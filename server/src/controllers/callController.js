const Call = require('../models/Call');
const User = require('../models/User');
const { getIsConnected } = require('../config/db');
const { getVoiceProvider } = require('../services/voiceProvider');
const { processVapiWebhook } = require('../services/webhookService');
const { analyzeTranscript } = require('../services/geminiService');
const { buildGreetingTwiML, buildReplyTwiML, buildTranscriptFromHistory } = require('../services/twimlService');
const { generateCallSummary } = require('../services/aiSummaryService');

/**
 * Validate E.164 phone number format (e.g. +919876543210, +14155552671)
 */
function formatAndValidateE164(phone) {
  if (!phone || typeof phone !== 'string') return null;
  
  // Clean spaces, hyphens, and brackets
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Add leading + if missing but starts with country code or digits
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10) {
      cleaned = '+1' + cleaned; // Default North America if 10 digits
    } else {
      cleaned = '+' + cleaned;
    }
  }

  // Regex E.164: + followed by 7 to 15 digits
  const e164Regex = /^\+[1-9]\d{6,14}$/;
  if (!e164Regex.test(cleaned)) {
    return null;
  }

  return cleaned;
}

// @desc    1. Create outbound AI phone call
// @route   POST /api/calls
// @access  Public / Private
exports.createCall = async (req, res) => {
  try {
    const { contactName, phoneNumber, purpose, customInstructions } = req.body;
    const isDb = getIsConnected();
    const userId = req.user ? req.user._id : undefined;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    const formattedPhone = formatAndValidateE164(phoneNumber);
    if (!formattedPhone) {
      return res.status(400).json({
        success: false,
        error: `Invalid phone number format: "${phoneNumber}". Please provide a valid E.164 phone number (e.g. +919876543210 or +14155552671).`,
      });
    }

    const cleanName = (contactName && contactName.trim()) ? contactName.trim() : 'Valued Customer';
    const cleanPurpose = (purpose && purpose.trim()) ? purpose.trim() : 'Customer Feedback & Inquiry';
    const cleanInstructions = customInstructions ? customInstructions.trim() : '';

    let callDoc = null;
    if (isDb) {
      callDoc = await Call.create({
        user: userId,
        contactName: cleanName,
        phoneNumber: formattedPhone,
        purpose: cleanPurpose,
        customInstructions: cleanInstructions,
        status: 'queued',
        startedAt: new Date(),
      });
    } else {
      callDoc = {
        _id: 'call_' + Date.now(),
        contactName: cleanName,
        phoneNumber: formattedPhone,
        purpose: cleanPurpose,
        customInstructions: cleanInstructions,
        status: 'queued',
        createdAt: new Date(),
      };
    }

    // Call Voice Provider (Vapi / Mock / Exotel)
    try {
      const voiceProvider = getVoiceProvider();
      const providerResult = await voiceProvider.createOutboundCall({
        contactName: cleanName,
        phoneNumber: formattedPhone,
        purpose: cleanPurpose,
        customInstructions: cleanInstructions,
        metadata: { callId: callDoc._id ? callDoc._id.toString() : callDoc.id },
      });

      if (isDb && callDoc) {
        callDoc.vapiCallId = providerResult.providerCallId;
        callDoc.twilioCallSid = providerResult.providerCallId;
        callDoc.status = providerResult.status || 'queued';
        await callDoc.save();
      } else {
        callDoc.vapiCallId = providerResult.providerCallId;
        callDoc.twilioCallSid = providerResult.providerCallId;
        callDoc.status = providerResult.status || 'queued';
      }

      return res.status(201).json({
        success: true,
        message: `Outbound AI call queued for ${cleanName} (${formattedPhone})`,
        data: callDoc,
      });
    } catch (providerErr) {
      console.error('[Call Creation Provider Error]', providerErr);

      if (isDb && callDoc) {
        callDoc.status = 'failed';
        callDoc.errorMessage = providerErr.message;
        await callDoc.save();
      }

      return res.status(500).json({
        success: false,
        error: providerErr.message || 'Failed to initiate outbound AI call via telephony provider',
        data: callDoc,
      });
    }
  } catch (error) {
    console.error('[createCall Error]', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    2. Get call history list with filtering & sorting
// @route   GET /api/calls
// @access  Public / Private
exports.getCalls = async (req, res) => {
  try {
    const isDb = getIsConnected();
    const { status, outcome, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    if (isDb) {
      const filter = {};
      if (req.user && req.user._id) {
        filter.user = req.user._id;
      }

      if (status && status !== 'all') {
        filter.status = status;
      }

      if (outcome && outcome !== 'all') {
        filter.outcome = outcome;
      }

      if (search) {
        filter.$or = [
          { contactName: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } },
          { purpose: { $regex: search, $options: 'i' } },
          { summary: { $regex: search, $options: 'i' } },
        ];
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const calls = await Call.find(filter).sort(sortOptions);

      return res.json({
        success: true,
        data: calls,
        total: calls.length,
      });
    } else {
      return res.json({
        success: true,
        data: [],
        total: 0,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    3. Get single call details by ID
// @route   GET /api/calls/:id
// @access  Public / Private
exports.getCallById = async (req, res) => {
  try {
    const { id } = req.params;
    const isDb = getIsConnected();

    if (isDb) {
      let callDoc = null;
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        callDoc = await Call.findById(id);
      }
      if (!callDoc) {
        callDoc = await Call.findOne({ vapiCallId: id });
      }

      if (!callDoc) {
        return res.status(404).json({ success: false, error: 'Call record not found' });
      }

      return res.json({
        success: true,
        data: callDoc,
      });
    } else {
      return res.status(404).json({ success: false, error: 'Call record not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    4. Delete call record
// @route   DELETE /api/calls/:id
// @access  Public / Private
exports.deleteCall = async (req, res) => {
  try {
    const { id } = req.params;
    const isDb = getIsConnected();

    if (isDb) {
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        await Call.findByIdAndDelete(id);
      } else {
        await Call.deleteOne({ vapiCallId: id });
      }
    }

    return res.json({
      success: true,
      message: 'Call record deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    5. Get aggregated dashboard call stats
// @route   GET /api/dashboard/stats
// @access  Public / Private
exports.getDashboardStats = async (req, res) => {
  try {
    const isDb = getIsConnected();

    if (isDb) {
      const filter = {};
      if (req.user && req.user._id) {
        filter.user = req.user._id;
      }

      const calls = await Call.find(filter);

      const totalCalls = calls.length;
      const completed = calls.filter(c => c.status === 'completed').length;
      const failed = calls.filter(c => c.status === 'failed').length;
      const inProgress = calls.filter(c => c.status === 'in-progress' || c.status === 'calling' || c.status === 'queued').length;

      const completedDurations = calls.filter(c => c.duration > 0).map(c => c.duration);
      const totalDuration = completedDurations.reduce((acc, d) => acc + d, 0);
      const averageDuration = completedDurations.length > 0 ? Math.round(totalDuration / completedDurations.length) : 0;

      return res.json({
        success: true,
        data: {
          totalCalls,
          completed,
          failed,
          inProgress,
          averageDuration,
        },
      });
    } else {
      return res.json({
        success: true,
        data: {
          totalCalls: 0,
          completed: 0,
          failed: 0,
          inProgress: 0,
          averageDuration: 0,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    6. Webhook Endpoint Handlers (Vapi & Twilio)
// @route   POST /api/webhooks/vapi or POST /api/webhooks/twilio/status
exports.handleVapiWebhook = async (req, res) => {
  try {
    const result = await processVapiWebhook(req.body, req.headers);
    return res.json(result);
  } catch (error) {
    console.error('[handleVapiWebhook Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.handleTwilioStatusWebhook = async (req, res) => {
  try {
    const result = await processVapiWebhook(req.body, req.headers);
    return res.json(result);
  } catch (error) {
    console.error('[handleTwilioStatusWebhook Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc  Voice Webhook — Twilio calls this when recipient picks up
// @route POST /api/webhooks/twilio/voice
exports.handleTwilioVoiceWebhook = async (req, res) => {
  try {
    const callSid = req.body.CallSid || '';
    const to = req.body.To || '';
    const isDb = getIsConnected();
    const baseUrl = (process.env.PUBLIC_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

    // Find the call record to get contact name, purpose, instructions
    let contactName = 'there';
    let purpose = 'follow up';
    let customInstructions = '';

    if (isDb && callSid) {
      const callDoc = await Call.findOne({
        $or: [{ twilioCallSid: callSid }, { phoneNumber: to }],
      }).sort({ createdAt: -1 });

      if (callDoc) {
        contactName = callDoc.contactName || 'there';
        purpose = callDoc.purpose || 'follow up';
        customInstructions = callDoc.customInstructions || '';
        // Mark as in-progress
        callDoc.status = 'in-progress';
        callDoc.startedAt = callDoc.startedAt || new Date();
        callDoc.twilioCallSid = callSid;
        await callDoc.save();
      }
    }

    console.log(`[VoiceWebhook] Call ${callSid} answered by ${to} — Contact: ${contactName}, Purpose: ${purpose}`);

    const twiml = await buildGreetingTwiML(callSid, contactName, purpose, customInstructions, baseUrl);

    res.set('Content-Type', 'text/xml');
    res.send(twiml);
  } catch (error) {
    console.error('[handleTwilioVoiceWebhook Error]', error);
    // Fallback TwiML so Twilio never shows "application error"
    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna-Neural" language="en-US">Hello! Thank you for picking up. We will call you back shortly. Goodbye!</Say>
  <Hangup/>
</Response>`);
  }
};

// @desc  Gather Webhook — Processes speech input and generates AI reply
// @route POST /api/webhooks/twilio/gather
exports.handleTwilioGatherWebhook = async (req, res) => {
  try {
    const callerSpeech = req.body.SpeechResult || req.query.SpeechResult || '';
    const callSid = req.query.callSid || req.body.CallSid || '';
    const contactName = req.query.contactName || '';
    const purpose = req.query.purpose || '';
    const customInstructions = req.query.customInstructions || '';
    const turn = parseInt(req.query.turn || '1', 10);
    const historyEncoded = req.query.history || '';
    const baseUrl = (process.env.PUBLIC_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
    const isDb = getIsConnected();

    console.log(`[GatherWebhook] Turn ${turn} | CallSid: ${callSid} | Speech: "${callerSpeech}"`);

    const { twiml, history, ended } = await buildReplyTwiML(
      callerSpeech, callSid, contactName, purpose, customInstructions, turn, historyEncoded, baseUrl
    );

    // If call ended, save transcript and generate AI summary
    if (ended && isDb && callSid) {
      try {
        const callDoc = await Call.findOne({
          $or: [{ twilioCallSid: callSid }, { vapiCallId: callSid }],
        });

        if (callDoc) {
          const transcriptText = buildTranscriptFromHistory(history);
          callDoc.transcript = transcriptText;
          callDoc.status = 'completed';
          callDoc.endedAt = new Date();
          await callDoc.save();

          // Async AI summary — don't await so call ends fast
          generateCallSummary(transcriptText, { purpose, contactName })
            .then(async (summary) => {
              callDoc.summary = summary.summary;
              callDoc.outcome = summary.outcome;
              callDoc.sentiment = summary.sentiment;
              callDoc.nextAction = summary.nextAction;
              callDoc.followUpRequired = summary.followUpRequired;
              callDoc.followUpReason = summary.followUpReason;
              await callDoc.save();
              console.log(`[GatherWebhook] AI summary saved for call ${callSid}`);
            })
            .catch(err => console.warn('[GatherWebhook] Summary error:', err.message));
        }
      } catch (dbErr) {
        console.warn('[GatherWebhook] DB save error:', dbErr.message);
      }
    }

    res.set('Content-Type', 'text/xml');
    res.send(twiml);
  } catch (error) {
    console.error('[handleTwilioGatherWebhook Error]', error);
    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna-Neural" language="en-US">Thank you for your time. Have a great day. Goodbye!</Say>
  <Hangup/>
</Response>`);
  }
};

// Existing compatibility exports for legacy simulation endpoints
exports.getCallLogs = async (req, res) => {
  try {
    const isDb = getIsConnected();
    const calls = isDb ? await Call.find().sort({ createdAt: -1 }) : [];
    res.json(calls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAnalytics = exports.getDashboardStats;

exports.simulateCall = async (req, res) => {
  req.body.phoneNumber = req.body.customerPhone || req.body.phoneNumber;
  req.body.contactName = req.body.customerName || req.body.contactName;
  return exports.createCall(req, res);
};

exports.toggleResolveActionItem = async (req, res) => {
  res.json({ success: true });
};

exports.makeRealTwilioCall = exports.createCall;
