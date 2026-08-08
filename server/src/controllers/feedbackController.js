const Feedback = require('../models/Feedback');

// @desc    Get feedback list with query filters
// @route   GET /api/feedback
// @access  Private
const getFeedbackList = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate, sentiment, rating, status, search } = req.query;

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
    const { notes, ownerNotes } = req.body;
    const noteText = notes !== undefined ? notes : ownerNotes;

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
