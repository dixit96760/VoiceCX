const mongoose = require('mongoose');
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

// @desc    Create new feedback
// @route   POST /api/feedback
// @access  Private
const createFeedback = async (req, res) => {
  try {
    const isDb = getIsConnected();
    const userId = req.user._id;

    const {
      rating,
      summary,
      text,
      transcript,
      customerPhone,
      phone,
      customerName,
      name,
      customer,
      customerId,
      status,
      sentiment,
      categoryRatings,
      ownerNotes,
      notes,
      topIssues,
      complaints,
      praises,
      date,
    } = req.body;

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const textContent = (summary || text || (typeof transcript === 'string' ? transcript : (Array.isArray(transcript) && transcript.length > 0 ? JSON.stringify(transcript) : '')) || '').trim();
    if (!textContent) {
      return res.status(400).json({ success: false, message: 'Feedback text cannot be empty' });
    }

    const validSentiments = ['positive', 'neutral', 'negative'];
    const resolvedSentiment = sentiment && validSentiments.includes(sentiment)
      ? sentiment
      : (numRating >= 4 ? 'positive' : numRating === 3 ? 'neutral' : 'negative');

    const validStatuses = ['pending', 'reviewed', 'resolved', 'action_required'];
    const resolvedStatus = status && validStatuses.includes(status) ? status : 'pending';

    const targetCustomer = customer || customerId;
    const finalCustomer = targetCustomer && mongoose.Types.ObjectId.isValid(targetCustomer) ? targetCustomer : undefined;

    const feedbackData = {
      user: userId,
      customer: finalCustomer,
      customerPhone: customerPhone || phone || '+1 (555) 000-0000',
      customerName: customerName || name || 'Anonymous Guest',
      rating: numRating,
      sentiment: resolvedSentiment,
      status: resolvedStatus,
      summary: summary || textContent,
      transcript: transcript || textContent,
      categoryRatings: categoryRatings || { food: numRating, service: numRating, ambience: 4, value: 4 },
      ownerNotes: ownerNotes !== undefined ? ownerNotes : (notes || ''),
      topIssues: topIssues || complaints || [],
      praises: praises || [],
      date: date ? new Date(date) : new Date(),
    };

    if (!isDb) {
      const newMemoryFb = {
        _id: `fb_${Date.now()}`,
        ...feedbackData,
      };
      memoryFeedbacks.unshift(newMemoryFb);
      return res.status(201).json({
        success: true,
        message: 'Feedback created successfully',
        data: newMemoryFb,
      });
    }

    const feedback = await Feedback.create(feedbackData);

    res.status(201).json({
      success: true,
      message: 'Feedback created successfully',
      data: feedback,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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
    const { id } = req.params;

    if (!isDb) {
      const fb = memoryFeedbacks.find(f => f._id === id || f.id === id);
      if (!fb) return res.status(404).json({ success: false, message: 'Feedback entry not found' });
      return res.json({ success: true, data: fb });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid feedback ID format' });
    }

    const feedback = await Feedback.findOne({ _id: id, user: req.user._id }).populate('customer');

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

// @desc    Update feedback entry
// @route   PUT /api/feedback/:id
// @access  Private
const updateFeedback = async (req, res) => {
  try {
    const isDb = getIsConnected();
    const { id } = req.params;

    const {
      rating,
      summary,
      text,
      transcript,
      customerPhone,
      phone,
      customerName,
      name,
      customer,
      customerId,
      status,
      sentiment,
      categoryRatings,
      ownerNotes,
      notes,
      topIssues,
      complaints,
      praises,
    } = req.body;

    if (!isDb) {
      const fb = memoryFeedbacks.find(f => f._id === id || f.id === id);
      if (!fb) return res.status(404).json({ success: false, message: 'Feedback entry not found' });

      if (rating !== undefined) fb.rating = Number(rating);
      if (summary !== undefined || text !== undefined) fb.summary = summary || text;
      if (transcript !== undefined) fb.transcript = transcript;
      if (customerPhone !== undefined || phone !== undefined) fb.customerPhone = customerPhone || phone;
      if (customerName !== undefined || name !== undefined) fb.customerName = customerName || name;
      if (status && ['pending', 'reviewed', 'resolved', 'action_required'].includes(status)) fb.status = status;
      if (sentiment && ['positive', 'neutral', 'negative'].includes(sentiment)) fb.sentiment = sentiment;
      if (categoryRatings) fb.categoryRatings = { ...fb.categoryRatings, ...categoryRatings };
      if (ownerNotes !== undefined || notes !== undefined) fb.ownerNotes = ownerNotes !== undefined ? ownerNotes : notes;
      if (topIssues !== undefined || complaints !== undefined) fb.topIssues = topIssues || complaints;
      if (praises !== undefined) fb.praises = praises;
      if (customer || customerId) fb.customer = customer || customerId;

      return res.json({
        success: true,
        message: 'Feedback updated successfully',
        data: fb,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid feedback ID format' });
    }

    const feedback = await Feedback.findOne({ _id: id, user: req.user._id });

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback entry not found' });
    }

    if (rating !== undefined) feedback.rating = Number(rating);
    if (summary !== undefined || text !== undefined) feedback.summary = summary || text;
    if (transcript !== undefined) feedback.transcript = transcript;
    if (customerPhone !== undefined || phone !== undefined) feedback.customerPhone = customerPhone || phone;
    if (customerName !== undefined || name !== undefined) feedback.customerName = customerName || name;
    if (status && ['pending', 'reviewed', 'resolved', 'action_required'].includes(status)) feedback.status = status;
    if (sentiment && ['positive', 'neutral', 'negative'].includes(sentiment)) feedback.sentiment = sentiment;
    if (categoryRatings) {
      feedback.categoryRatings = {
        food: categoryRatings.food !== undefined ? categoryRatings.food : feedback.categoryRatings.food,
        service: categoryRatings.service !== undefined ? categoryRatings.service : feedback.categoryRatings.service,
        ambience: categoryRatings.ambience !== undefined ? categoryRatings.ambience : feedback.categoryRatings.ambience,
        value: categoryRatings.value !== undefined ? categoryRatings.value : feedback.categoryRatings.value,
      };
    }
    if (ownerNotes !== undefined || notes !== undefined) {
      feedback.ownerNotes = ownerNotes !== undefined ? ownerNotes : notes;
    }
    if (topIssues !== undefined || complaints !== undefined) feedback.topIssues = topIssues || complaints;
    if (praises !== undefined) feedback.praises = praises;

    const targetCustomer = customer || customerId;
    if (targetCustomer && mongoose.Types.ObjectId.isValid(targetCustomer)) {
      feedback.customer = targetCustomer;
    }

    await feedback.save();

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      data: feedback,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete feedback entry
// @route   DELETE /api/feedback/:id
// @access  Private
const deleteFeedback = async (req, res) => {
  try {
    const isDb = getIsConnected();
    const { id } = req.params;

    if (!isDb) {
      const idx = memoryFeedbacks.findIndex(f => f._id === id || f.id === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Feedback entry not found' });
      memoryFeedbacks.splice(idx, 1);
      return res.json({ success: true, message: 'Feedback deleted successfully', id });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid feedback ID format' });
    }

    const feedback = await Feedback.findOneAndDelete({ _id: id, user: req.user._id });

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback entry not found' });
    }

    res.json({
      success: true,
      message: 'Feedback deleted successfully',
      id,
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

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid feedback ID format' });
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
  createFeedback,
  getFeedbackList,
  getFeedbackById,
  updateFeedback,
  deleteFeedback,
  updateNotes,
};
