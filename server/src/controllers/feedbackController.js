const Feedback = require('../models/Feedback');
const { getIsConnected } = require('../config/db');

let memoryFeedbacks = [
  {
    _id: 'fb_1',
    customerName: 'Michael Scott',
    customerPhone: '+1 (555) 301-4455',
    rating: 5,
    sentiment: 'positive',
    status: 'reviewed',
    summary: 'Customer loved the ribeye steak and excellent table service.',
    transcript: [
      { speaker: 'Agent', text: 'Hi Michael! How was your dinner at Y6 Gourmet Bistro yesterday?' },
      { speaker: 'Customer', text: 'It was fantastic! The ribeye steak was perfectly cooked and our server was amazing.' },
    ],
    categoryRatings: { food: 5, service: 5, ambience: 4, value: 4 },
    audioUrl: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
    ownerNotes: 'Sent 10% discount voucher for next visit.',
    praises: ['Ribeye steak quality', 'Attentive service'],
    topIssues: [],
    date: new Date(Date.now() - 86400000 * 2),
  },
  {
    _id: 'fb_2',
    customerName: 'Pam Beesly',
    customerPhone: '+1 (555) 301-6677',
    rating: 2,
    sentiment: 'negative',
    status: 'action_required',
    summary: 'Soup was served cold and main course had a long 35-minute delay.',
    transcript: [
      { speaker: 'Agent', text: 'Hello Pam! Thank you for dining with us. We would love your quick feedback.' },
      { speaker: 'Customer', text: 'Honestly, the soup was lukewarm and we waited 35 minutes for our main course.' },
    ],
    categoryRatings: { food: 2, service: 2, ambience: 4, value: 2 },
    audioUrl: '',
    ownerNotes: 'Need to follow up with head chef regarding kitchen timing.',
    praises: [],
    topIssues: ['Cold soup', 'Long wait time'],
    date: new Date(Date.now() - 86400000 * 5),
  },
  {
    _id: 'fb_3',
    customerName: 'Jim Halpert',
    customerPhone: '+1 (555) 301-8899',
    rating: 5,
    sentiment: 'positive',
    status: 'pending',
    summary: 'Delightful atmosphere and wonderful tiramisu dessert.',
    transcript: [
      { speaker: 'Agent', text: 'Hi Jim, how was your experience at Y6 Bistro?' },
      { speaker: 'Customer', text: 'Great atmosphere and the tiramisu was incredible!' },
    ],
    categoryRatings: { food: 5, service: 5, ambience: 5, value: 5 },
    audioUrl: '',
    ownerNotes: '',
    praises: ['Tiramisu dessert', 'Great atmosphere'],
    topIssues: [],
    date: new Date(Date.now() - 86400000 * 1),
  },
];

// @desc    Get feedback list with query filters
// @route   GET /api/feedback
// @access  Private
const getFeedbackList = async (req, res) => {
  try {
    const isDb = getIsConnected();
    const userId = req.user._id;
    const { startDate, endDate, sentiment, rating, status, search } = req.query;

    if (!isDb) {
      let filtered = [...memoryFeedbacks];
      if (sentiment) filtered = filtered.filter(f => f.sentiment === sentiment);
      if (rating) filtered = filtered.filter(f => f.rating === Number(rating));
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(f => 
          f.customerPhone.includes(s) || f.customerName.toLowerCase().includes(s) || f.summary.toLowerCase().includes(s)
        );
      }
      return res.json({ success: true, count: filtered.length, data: filtered });
    }

    const query = { user: userId };

    // Date filtering
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Sentiment filter
    if (sentiment && ['positive', 'neutral', 'negative'].includes(sentiment)) {
      query.sentiment = sentiment;
    }

    // Rating filter
    if (rating && !isNaN(rating)) {
      query.rating = Number(rating);
    }

    // Status filter
    if (status && ['pending', 'reviewed', 'resolved', 'action_required'].includes(status)) {
      query.status = status;
    }

    // Search keywords (phone, name, or summary)
    if (search) {
      query.$or = [
        { customerPhone: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
      ];
    }

    const feedbacks = await Feedback.find(query).sort({ date: -1, createdAt: -1 });

    res.json({
      success: true,
      count: feedbacks.length,
      data: feedbacks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed feedback by ID
// @route   GET /api/feedback/:id
// @access  Private
const getFeedbackById = async (req, res) => {
  try {
    const isDb = getIsConnected();
    if (!isDb) {
      const fb = memoryFeedbacks.find(f => f._id === req.params.id || f.id === req.params.id);
      if (!fb) return res.status(404).json({ success: false, message: 'Feedback entry not found' });
      return res.json({ success: true, data: fb });
    }

    const feedback = await Feedback.findOne({ _id: req.params.id, user: req.user._id }).populate('customer');

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback entry not found' });
    }

    res.json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save or update owner notes on feedback
// @route   POST /api/feedback/:id/notes
// @access  Private
const updateNotes = async (req, res) => {
  try {
    const isDb = getIsConnected();
    const { notes, ownerNotes } = req.body;
    const noteText = notes !== undefined ? notes : ownerNotes;

    if (!isDb) {
      const fb = memoryFeedbacks.find(f => f._id === req.params.id || f.id === req.params.id);
      if (!fb) return res.status(404).json({ success: false, message: 'Feedback entry not found' });
      fb.ownerNotes = noteText || '';
      return res.json({ success: true, message: 'Owner notes updated successfully', data: fb });
    }

    const feedback = await Feedback.findOne({ _id: req.params.id, user: req.user._id });

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback entry not found' });
    }

    feedback.ownerNotes = noteText || '';
    if (feedback.status === 'pending') {
      feedback.status = 'reviewed';
    }
    
    await feedback.save();

    res.json({
      success: true,
      message: 'Owner notes updated successfully',
      data: feedback,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getFeedbackList,
  getFeedbackById,
  updateNotes,
};
