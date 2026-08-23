const Call = require('../models/Call');
const User = require('../models/User');
const { getIsConnected } = require('../config/db');

const { analyzeTranscript } = require('../services/geminiService');
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

    // Trigger Make.com Automation if Webhook URL is provided
    const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL;
    if (makeWebhookUrl) {
      try {
        const makePayload = {
          callId: callDoc._id,
          contactName: cleanName,
          phoneNumber: formattedPhone,
          purpose: cleanPurpose,
          customInstructions: cleanInstructions
        };
        // Node 18+ has native fetch
        await fetch(makeWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(makePayload)
        });
        console.log(`[Make.com] Triggered outbound call automation for ${formattedPhone}`);
        
        if (isDb) {
          callDoc.status = 'calling';
          await callDoc.save();
        } else {
          callDoc.status = 'calling';
        }
      } catch (err) {
        console.error('[Make.com Webhook Error] Failed to ping Make.com:', err.message);
      }
    }

    // Return call record response
    return res.status(201).json({
      success: true,
      message: `Call record registered for ${cleanName} (${formattedPhone})`,
      data: callDoc,
    });
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

// @desc    6. Webhook Endpoint Handlers (Make.com Automation)
// @route   POST /api/webhooks/make-feedback
// Make.com will POST to this URL when the call completes.
// Expected payload: { callId, transcript, summary, sentiment, outcome, duration }
exports.handleMakeFeedbackWebhook = async (req, res) => {
  try {
    const { callId, transcript, summary, sentiment, outcome, duration } = req.body;
    const isDb = getIsConnected();

    if (!callId) {
      return res.status(400).json({ success: false, error: 'Missing callId in Make.com payload' });
    }

    console.log(`[Make.com Webhook] Received call feedback for Call ID: ${callId}`);

    if (isDb) {
      const callDoc = await Call.findById(callId) || await Call.findOne({ vapiCallId: callId });
      
      if (callDoc) {
        callDoc.status = 'completed';
        callDoc.endedAt = new Date();
        if (transcript) callDoc.transcript = transcript;
        if (summary) callDoc.summary = summary;
        if (sentiment) callDoc.sentiment = sentiment.toLowerCase();
        if (outcome) callDoc.outcome = outcome;
        if (duration) callDoc.duration = Number(duration);
        
        await callDoc.save();
        console.log(`[Make.com Webhook] Successfully updated Call ID: ${callId}`);
      } else {
        console.warn(`[Make.com Webhook] Call ID ${callId} not found in database.`);
      }
    }

    // Always respond 200 so Make.com knows it succeeded
    return res.json({ success: true, message: 'Feedback ingested successfully' });
  } catch (error) {
    console.error('[handleMakeFeedbackWebhook Error]', error);
    return res.status(500).json({ success: false, error: error.message });
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
