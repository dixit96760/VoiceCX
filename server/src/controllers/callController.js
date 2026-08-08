const CustomerCallLog = require('../models/CustomerCallLog');
const { analyzeTranscript } = require('../services/geminiService');
const { getIsConnected } = require('../config/db');

// Seed mock logs in memory for fallback / demo
const initialMockLogs = [
  {
    _id: 'call_101',
    customerName: 'Sarah Jenkins',
    customerPhone: '+1 (555) 349-8120',
    callStatus: 'completed',
    durationSeconds: 78,
    rawTranscript: `Agent: Hi Sarah, thank you for dining at Gourmet Haven Bistro! How was your experience overall?\nCustomer: Oh, the Truffle Mushroom Risotto was absolutely phenomenal! The flavors were rich and authentic. But we had to wait almost 25 minutes for our drinks to arrive after ordering.\nAgent: We appreciate your honest feedback. I will share the compliment with the chef and note the drink service delay with bar staff. Have a great day!`,
    sentimentScore: 82,
    sentimentLabel: 'positive',
    feedbackCategory: 'Food Quality',
    summary: 'Customer praised the Truffle Mushroom Risotto, but highlighted a 25-minute delay for drinks.',
    actionItems: [
      'Share positive kitchen feedback on Truffle Mushroom Risotto with Executive Chef',
      'Audit bar queue speed and staff response during evening rush hours'
    ],
    resolved: false,
    callTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
  },
  {
    _id: 'call_102',
    customerName: 'Marcus Vance',
    customerPhone: '+1 (555) 918-2041',
    callStatus: 'completed',
    durationSeconds: 52,
    rawTranscript: `Agent: Hello Marcus, following up on your takeaway delivery order from Gourmet Haven Bistro!\nCustomer: The pizza arrived completely lukewarm and the crust was soggy. For a $22 pizza I expected it to be hot and crisp.\nAgent: We are truly sorry to hear that. I will inform manager Marcus to issue a gift card and address transit packaging with courier team.`,
    sentimentScore: 28,
    sentimentLabel: 'negative',
    feedbackCategory: 'Delivery',
    summary: 'Takeaway pizza arrived lukewarm and soggy. Customer unhappy with price to quality ratio.',
    actionItems: [
      'Issue $15 apology promo code to customer Marcus Vance',
      'Upgrade thermal insulated delivery bags for courier orders',
      'Review cook-to-pickup timing for delivery orders'
    ],
    resolved: false,
    callTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 18), // 18 hours ago
  },
  {
    _id: 'call_103',
    customerName: 'Emily & David Thorne',
    customerPhone: '+1 (555) 772-9011',
    callStatus: 'completed',
    durationSeconds: 94,
    rawTranscript: `Agent: Hi Emily, calling from Gourmet Haven Bistro regarding your anniversary dinner yesterday!\nCustomer: Everything was perfection! Our server Carlos made us feel so special, candle was brought with dessert, and the atmosphere was cozy and warm. Will definitely return!\nAgent: That warms our hearts! We look forward to hosting you again soon!`,
    sentimentScore: 96,
    sentimentLabel: 'positive',
    feedbackCategory: 'Service',
    summary: 'Outstanding anniversary dining experience! Praised server Carlos and cozy ambiance.',
    actionItems: [
      'Recognize server Carlos for exemplary anniversary service excellence',
      'Send anniversary loyalty invitation card for next year'
    ],
    resolved: true,
    callTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 36), // 1.5 days ago
  },
  {
    _id: 'call_104',
    customerName: 'Robert Chen',
    customerPhone: '+1 (555) 441-0982',
    callStatus: 'completed',
    durationSeconds: 61,
    rawTranscript: `Agent: Hi Robert! How was your lunch today at Gourmet Haven Bistro?\nCustomer: The lunch special garlic focaccia was good, but the dining room was extremely loud due to background music turn up. Hard to hold a business discussion.\nAgent: Thank you for letting us know! We will calibrate lunch hour ambient volume levels.`,
    sentimentScore: 60,
    sentimentLabel: 'neutral',
    feedbackCategory: 'Ambiance',
    summary: 'Food was good, but loud background music hindered business lunch conversation.',
    actionItems: [
      'Lower dining area audio volume by 20% during weekday lunch hours (12 PM - 2 PM)'
    ],
    resolved: false,
    callTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 54), // 2.2 days ago
  },
  {
    _id: 'call_105',
    customerName: 'Jessica Taylor',
    customerPhone: '+1 (555) 230-6714',
    callStatus: 'completed',
    durationSeconds: 42,
    rawTranscript: `Agent: Hello Jessica, thank you for calling Gourmet Haven Bistro!\nCustomer: Just wanted to say your Tiramisu is the best in town. We order it every single weekend!\nAgent: Thank you Jessica! You made our pastry chef smile.`,
    sentimentScore: 98,
    sentimentLabel: 'positive',
    feedbackCategory: 'Food Quality',
    summary: 'Customer expressed intense praise for the house Tiramisu dessert quality.',
    actionItems: [
      'Highlight Tiramisu dessert on social media channels as customer favorite'
    ],
    resolved: true,
    callTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
  }
];

let memoryLogs = [...initialMockLogs];

exports.getCallLogs = async (req, res) => {
  try {
    const isDb = getIsConnected();
    const ownerId = req.user.id;
    const { category, sentiment, search } = req.query;

    if (isDb) {
      let filter = { ownerId };
      if (category && category !== 'all') {
        filter.feedbackCategory = category;
      }
      if (sentiment && sentiment !== 'all') {
        filter.sentimentLabel = sentiment;
      }
      if (search) {
        filter.$or = [
          { customerName: { $regex: search, $options: 'i' } },
          { customerPhone: { $regex: search, $options: 'i' } },
          { rawTranscript: { $regex: search, $options: 'i' } },
          { summary: { $regex: search, $options: 'i' } }
        ];
      }

      let logs = await CustomerCallLog.find(filter).sort({ callTimestamp: -1 });

      // Seed default logs if DB is empty for user
      if (logs.length === 0 && !search && !category && !sentiment) {
        const seeded = initialMockLogs.map(l => ({ ...l, _id: undefined, ownerId }));
        logs = await CustomerCallLog.insertMany(seeded);
      }

      return res.json(logs);
    } else {
      let filtered = [...memoryLogs];

      if (category && category !== 'all') {
        filtered = filtered.filter(l => l.feedbackCategory === category);
      }
      if (sentiment && sentiment !== 'all') {
        filtered = filtered.filter(l => l.sentimentLabel === sentiment);
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(l =>
          (l.customerName || '').toLowerCase().includes(q) ||
          (l.customerPhone || '').toLowerCase().includes(q) ||
          (l.rawTranscript || '').toLowerCase().includes(q) ||
          (l.summary || '').toLowerCase().includes(q)
        );
      }

      return res.json(filtered);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching call logs', error: error.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const isDb = getIsConnected();
    const ownerId = req.user.id;

    let logs = [];
    if (isDb) {
      logs = await CustomerCallLog.find({ ownerId });
      if (logs.length === 0) {
        const seeded = initialMockLogs.map(l => ({ ...l, _id: undefined, ownerId }));
        logs = await CustomerCallLog.insertMany(seeded);
      }
    } else {
      logs = memoryLogs;
    }

    const totalCalls = logs.length;
    const completedCalls = logs.filter(l => l.callStatus === 'completed').length;
    const responseRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 100;

    const totalScore = logs.reduce((acc, curr) => acc + (curr.sentimentScore || 75), 0);
    const avgSentiment = totalCalls > 0 ? Math.round(totalScore / totalCalls) : 80;

    const positiveCount = logs.filter(l => l.sentimentLabel === 'positive').length;
    const neutralCount = logs.filter(l => l.sentimentLabel === 'neutral').length;
    const negativeCount = logs.filter(l => l.sentimentLabel === 'negative').length;

    const categoryCounts = {
      'Food Quality': 0,
      'Service': 0,
      'Ambiance': 0,
      'Pricing': 0,
      'Delivery': 0,
      'General': 0,
    };

    logs.forEach(l => {
      const cat = l.feedbackCategory || 'Food Quality';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const pendingActionItems = logs.reduce((acc, curr) => {
      if (!curr.resolved && Array.isArray(curr.actionItems)) {
        return acc + curr.actionItems.length;
      }
      return acc;
    }, 0);

    return res.json({
      totalCalls,
      completedCalls,
      responseRate,
      avgSentiment,
      positiveCount,
      neutralCount,
      negativeCount,
      pendingActionItems,
      sentimentBreakdown: [
        { name: 'Positive', value: positiveCount, color: '#10b981' },
        { name: 'Neutral', value: neutralCount, color: '#f59e0b' },
        { name: 'Negative', value: negativeCount, color: '#ef4444' },
      ],
      categoryBreakdown: Object.keys(categoryCounts).map(cat => ({
        category: cat,
        count: categoryCounts[cat],
      })),
      recentTrend: [
        { day: 'Mon', sentiment: 78, calls: 4 },
        { day: 'Tue', sentiment: 82, calls: 6 },
        { day: 'Wed', sentiment: 74, calls: 5 },
        { day: 'Thu', sentiment: 88, calls: 8 },
        { day: 'Fri', sentiment: 91, calls: 12 },
        { day: 'Sat', sentiment: 85, calls: 15 },
        { day: 'Sun', sentiment: avgSentiment, calls: totalCalls },
      ]
    });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating analytics metrics', error: error.message });
  }
};

exports.simulateCall = async (req, res) => {
  try {
    const isDb = getIsConnected();
    const ownerId = req.user.id;
    const { customerName, customerPhone, rawTranscript, scenario } = req.body;

    if (!customerPhone || !rawTranscript) {
      return res.status(400).json({ message: 'Customer phone number and transcript are required' });
    }

    // Process raw transcript using Gemini AI analysis service
    const aiResult = await analyzeTranscript(rawTranscript);

    const callLogData = {
      ownerId,
      customerName: customerName || 'Valued Customer',
      customerPhone,
      callStatus: 'completed',
      durationSeconds: Math.floor(Math.random() * 45) + 30,
      rawTranscript,
      sentimentScore: aiResult.sentimentScore,
      sentimentLabel: aiResult.sentimentLabel,
      feedbackCategory: aiResult.feedbackCategory,
      summary: aiResult.summary,
      actionItems: aiResult.actionItems,
      resolved: false,
      callTimestamp: new Date(),
    };

    if (isDb) {
      const createdLog = await CustomerCallLog.create(callLogData);
      return res.status(201).json({
        success: true,
        callLog: createdLog,
        analysis: aiResult,
      });
    } else {
      const createdLog = {
        _id: 'call_' + Date.now(),
        ...callLogData,
      };
      memoryLogs.unshift(createdLog);
      return res.status(201).json({
        success: true,
        callLog: createdLog,
        analysis: aiResult,
      });
    }
  } catch (error) {
    console.error('Call simulation error:', error);
    res.status(500).json({ message: 'Error simulating customer voice call', error: error.message });
  }
};

exports.toggleResolveActionItem = async (req, res) => {
  try {
    const isDb = getIsConnected();
    const { id } = req.params;

    if (isDb) {
      const log = await CustomerCallLog.findById(id);
      if (!log) return res.status(404).json({ message: 'Call log not found' });

      log.resolved = !log.resolved;
      await log.save();
      return res.json(log);
    } else {
      const log = memoryLogs.find(l => l._id === id);
      if (!log) return res.status(404).json({ message: 'Call log not found' });
      log.resolved = !log.resolved;
      return res.json(log);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating call resolution', error: error.message });
  }
};

/**
 * Handle real Twilio Voice Webhook (TwiML output)
 */
exports.handleTwilioVoiceWebhook = async (req, res) => {
  const VoiceResponse = require('twilio').twiml.VoiceResponse;
  const twiml = new VoiceResponse();
  const speechResult = req.body.SpeechResult;

  if (!speechResult) {
    const gather = twiml.gather({
      input: 'speech',
      action: '/api/calls/twilio/webhook',
      method: 'POST',
      speechTimeout: 'auto'
    });
    gather.say({ voice: 'Polly.Joanna' }, 'Hello! Thank you for dining with us at Gourmet Haven Bistro. How was your experience today?');
    twiml.say('We did not receive any response. Thank you and have a wonderful day!');
    res.type('text/xml');
    return res.send(twiml.toString());
  }

  // Customer spoke! Analyze with Gemini AI
  try {
    const callerPhone = req.body.From || '+15551234567';
    const transcript = `Agent: Hello! Thank you for dining with us at Gourmet Haven Bistro. How was your experience today?\nCustomer: ${speechResult}`;
    
    const aiResult = await analyzeTranscript(transcript);
    const isDb = getIsConnected();

    const callLogData = {
      customerName: 'Phone Customer (' + callerPhone.slice(-4) + ')',
      customerPhone: callerPhone,
      callStatus: 'completed',
      durationSeconds: parseInt(req.body.CallDuration || '45', 10),
      rawTranscript: transcript,
      sentimentScore: aiResult.sentimentScore,
      sentimentLabel: aiResult.sentimentLabel,
      feedbackCategory: aiResult.feedbackCategory,
      summary: aiResult.summary,
      actionItems: aiResult.actionItems,
      resolved: false,
      callTimestamp: new Date()
    };

    if (isDb) {
      await CustomerCallLog.create(callLogData);
    } else {
      memoryLogs.unshift({ _id: 'twilio_' + Date.now(), ...callLogData });
    }

    twiml.say({ voice: 'Polly.Joanna' }, 'Thank you so much for your feedback! We have recorded your notes and wish you a fantastic day!');
    twiml.hangup();
  } catch (err) {
    console.error('Twilio Voice Webhook error:', err);
    twiml.say({ voice: 'Polly.Joanna' }, 'Thank you for your feedback! Have a great day.');
  }

  res.type('text/xml');
  return res.send(twiml.toString());
};

/**
 * Trigger Outbound Real Phone Call via Twilio
 */
const { demoMode } = require('../config/appConfig');

exports.makeRealTwilioCall = async (req, res) => {
  try {
    const { customerPhone, customerName } = req.body;

    if (!customerPhone) {
      return res.status(400).json({ message: 'Customer phone number is required' });
    }

    if (demoMode) {
      return res.json({
        success: true,
        message: `Demo mode enabled: outbound Twilio dialing is disabled. This is a safe simulation response for ${customerPhone}.`,
        callSid: `DEMO_CALL_${Date.now()}`,
      });
    }

    const { makeOutboundCall } = require('../services/twilioService');
    const host = req.get('host');
    const protocol = req.protocol;
    const callbackUrl = `${protocol}://${host}/api/calls/twilio/webhook`;

    const call = await makeOutboundCall({
      toPhoneNumber: customerPhone,
      customerName: customerName || 'Valued Customer',
      callbackUrl
    });

    res.json({
      success: true,
      message: `Outbound call initiated to ${customerPhone}`,
      callSid: call.sid
    });
  } catch (error) {
    console.error('Twilio real call error:', error);
    res.status(500).json({ message: error.message || 'Failed to place real Twilio call' });
  }
};

