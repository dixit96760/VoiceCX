const Feedback = require('../models/Feedback');
const { getIsConnected } = require('../config/db');

const MEMORY_FEEDBACKS = [
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

// @desc    Get dashboard aggregated KPI metrics
// @route   GET /api/dashboard
// @access  Private
const getDashboard = async (req, res) => {
  try {
    const isDb = getIsConnected();
    const userId = req.user._id;

    // Fetch all feedback items for this user or memory fallback
    const feedbacks = isDb ? await Feedback.find({ user: userId }) : MEMORY_FEEDBACKS;

    const totalFeedback = feedbacks.length;
    
    if (totalFeedback === 0) {
      return res.json({
        success: true,
        data: {
          totalFeedback: 0,
          averageRating: 0,
          positivePercentage: 0,
          negativePercentage: 0,
          responseRate: 0,
          feedbackTrends: [],
          sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
          topIssues: [],
        },
      });
    }

    const totalRatingSum = feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0);
    const averageRating = parseFloat((totalRatingSum / totalFeedback).toFixed(1));

    const positiveCount = feedbacks.filter((f) => f.sentiment === 'positive').length;
    const negativeCount = feedbacks.filter((f) => f.sentiment === 'negative').length;
    const neutralCount = feedbacks.filter((f) => f.sentiment === 'neutral').length;

    const positivePercentage = Math.round((positiveCount / totalFeedback) * 100);
    const negativePercentage = Math.round((negativeCount / totalFeedback) * 100);
    const neutralPercentage = Math.round((neutralCount / totalFeedback) * 100);

    const reviewedOrResolvedCount = feedbacks.filter(
      (f) => f.status === 'reviewed' || f.status === 'resolved' || f.ownerNotes
    ).length;
    const responseRate = Math.round((reviewedOrResolvedCount / totalFeedback) * 100);

    // Group issues frequency
    const issueCounts = {};
    feedbacks.forEach((f) => {
      if (Array.isArray(f.topIssues)) {
        f.topIssues.forEach((issue) => {
          if (issue) {
            issueCounts[issue] = (issueCounts[issue] || 0) + 1;
          }
        });
      }
    });

    const topIssues = Object.entries(issueCounts)
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate feedback trends (last 7 days / weekly timeline)
    const trendsMap = {};
    feedbacks.forEach((f) => {
      const dateKey = new Date(f.date || f.createdAt).toISOString().split('T')[0];
      if (!trendsMap[dateKey]) {
        trendsMap[dateKey] = { date: dateKey, count: 0, totalRating: 0, averageRating: 0 };
      }
      trendsMap[dateKey].count += 1;
      trendsMap[dateKey].totalRating += f.rating || 0;
    });

    const feedbackTrends = Object.values(trendsMap)
      .map((t) => ({
        date: t.date,
        count: t.count,
        averageRating: parseFloat((t.totalRating / t.count).toFixed(1)),
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      data: {
        totalFeedback,
        averageRating,
        positivePercentage,
        negativePercentage,
        neutralPercentage,
        responseRate,
        feedbackTrends,
        sentimentBreakdown: {
          positive: positiveCount,
          neutral: neutralCount,
          negative: negativeCount,
        },
        topIssues,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed insights
// @route   GET /api/insights
// @access  Private
const getInsights = async (req, res) => {
  try {
    const isDb = getIsConnected();
    const userId = req.user._id;

    const feedbacks = isDb ? await Feedback.find({ user: userId }).sort({ date: 1, createdAt: 1 }) : MEMORY_FEEDBACKS;
    const total = feedbacks.length;

    const positive = feedbacks.filter((f) => f.sentiment === 'positive').length;
    const neutral = feedbacks.filter((f) => f.sentiment === 'neutral').length;
    const negative = feedbacks.filter((f) => f.sentiment === 'negative').length;

    // Common complaints (top issues)
    const complaintsMap = {};
    const praisesMap = {};

    feedbacks.forEach((f) => {
      if (Array.isArray(f.topIssues)) {
        f.topIssues.forEach((issue) => {
          if (issue) complaintsMap[issue] = (complaintsMap[issue] || 0) + 1;
        });
      }
      if (Array.isArray(f.praises)) {
        f.praises.forEach((praise) => {
          if (praise) praisesMap[praise] = (praisesMap[praise] || 0) + 1;
        });
      }
    });

    const commonComplaints = Object.entries(complaintsMap)
      .map(([item, count]) => ({ issue: item, count, percentage: total ? Math.round((count / total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);

    const commonPraises = Object.entries(praisesMap)
      .map(([item, count]) => ({ praise: item, count, percentage: total ? Math.round((count / total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);

    // Category Ratings Average
    const categoryTotals = { food: 0, service: 0, ambience: 0, value: 0, count: 0 };
    feedbacks.forEach((f) => {
      if (f.categoryRatings) {
        if (f.categoryRatings.food) categoryTotals.food += f.categoryRatings.food;
        if (f.categoryRatings.service) categoryTotals.service += f.categoryRatings.service;
        if (f.categoryRatings.ambience) categoryTotals.ambience += f.categoryRatings.ambience;
        if (f.categoryRatings.value) categoryTotals.value += f.categoryRatings.value;
        categoryTotals.count += 1;
      }
    });

    const categoryAverages = {
      food: categoryTotals.count ? parseFloat((categoryTotals.food / categoryTotals.count).toFixed(1)) : 0,
      service: categoryTotals.count ? parseFloat((categoryTotals.service / categoryTotals.count).toFixed(1)) : 0,
      ambience: categoryTotals.count ? parseFloat((categoryTotals.ambience / categoryTotals.count).toFixed(1)) : 0,
      value: categoryTotals.count ? parseFloat((categoryTotals.value / categoryTotals.count).toFixed(1)) : 0,
    };

    // Rating history timeline
    const ratingHistory = feedbacks.map((f) => ({
      id: f._id,
      date: f.date || f.createdAt,
      rating: f.rating,
      sentiment: f.sentiment,
      customerName: f.customerName,
      customerPhone: f.customerPhone,
    }));

    res.json({
      success: true,
      data: {
        sentimentDistribution: {
          positive: { count: positive, percentage: total ? Math.round((positive / total) * 100) : 0 },
          neutral: { count: neutral, percentage: total ? Math.round((neutral / total) * 100) : 0 },
          negative: { count: negative, percentage: total ? Math.round((negative / total) * 100) : 0 },
        },
        commonComplaints,
        commonPraises,
        categoryAverages,
        ratingHistory,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboard,
  getInsights,
};
