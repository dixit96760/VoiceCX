const Feedback = require('../models/Feedback');
const { getIsConnected } = require('../config/db');

const MEMORY_FEEDBACKS = [];

// @desc    Get dashboard aggregated KPI metrics
// @route   GET /api/dashboard
// @access  Private
const getDashboard = async (req, res) => {
  try {
    const isDb = getIsConnected();
    const userId = req.user._id;

    // Fetch all feedback items for this user from MongoDB Atlas or memory fallback
    const feedbacks = isDb ? await Feedback.find({ user: userId }) : MEMORY_FEEDBACKS;
    const totalFeedback = feedbacks.length;

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    if (totalFeedback === 0) {
      return res.json({
        success: true,
        data: {
          totalFeedback: 0,
          averageRating: 0,
          positivePercentage: 0,
          negativePercentage: 0,
          neutralPercentage: 0,
          responseRate: 100,
          feedbackTrends: daysOfWeek.map(day => ({ date: day, count: 0, averageRating: 0, positive: 0, negative: 0 })),
          sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
          topIssues: [],
        },
      });
    }

    const totalRatingSum = feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0);
    const averageRating = parseFloat((totalRatingSum / totalFeedback).toFixed(1));

    const positiveCount = feedbacks.filter((f) => f.sentiment === 'positive' || f.sentiment === 'Positive').length;
    const negativeCount = feedbacks.filter((f) => f.sentiment === 'negative' || f.sentiment === 'Negative').length;
    const neutralCount = feedbacks.filter((f) => f.sentiment === 'neutral' || f.sentiment === 'Neutral').length;

    const positivePercentage = Math.round((positiveCount / totalFeedback) * 100);
    const negativePercentage = Math.round((negativeCount / totalFeedback) * 100);
    const neutralPercentage = Math.round((neutralCount / totalFeedback) * 100);

    const responseRate = 100;

    // Group issues frequency dynamically
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
      .map(([issue, count]) => ({ issue, count, percentage: Math.round((count / totalFeedback) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate dynamic 7-day timeline
    const trendsMap = {};
    feedbacks.forEach((f) => {
      const dateObj = new Date(f.date || f.createdAt);
      const dayName = daysOfWeek[(dateObj.getDay() + 6) % 7]; // Convert Sunday 0 to index 6
      if (!trendsMap[dayName]) {
        trendsMap[dayName] = { date: dayName, count: 0, totalRating: 0, positive: 0, negative: 0 };
      }
      trendsMap[dayName].count += 1;
      trendsMap[dayName].totalRating += f.rating || 0;
      if (f.sentiment?.toLowerCase() === 'positive') trendsMap[dayName].positive += 1;
      if (f.sentiment?.toLowerCase() === 'negative') trendsMap[dayName].negative += 1;
    });

    const feedbackTrends = daysOfWeek.map(day => ({
      date: day,
      count: trendsMap[day]?.count || 0,
      total: trendsMap[day]?.count || 0,
      positive: trendsMap[day]?.positive || 0,
      negative: trendsMap[day]?.negative || 0,
      averageRating: trendsMap[day]?.count ? parseFloat((trendsMap[day].totalRating / trendsMap[day].count).toFixed(1)) : 0,
    }));

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

    const positive = feedbacks.filter((f) => f.sentiment?.toLowerCase() === 'positive').length;
    const neutral = feedbacks.filter((f) => f.sentiment?.toLowerCase() === 'neutral').length;
    const negative = feedbacks.filter((f) => f.sentiment?.toLowerCase() === 'negative').length;

    // Common complaints and praises mapped dynamically from real feedback
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
