const mongoose = require('mongoose');
const AIAnalysis = require('../models/AIAnalysis');
const Feedback = require('../models/Feedback');
const { getIsConnected } = require('../config/db');

// In-memory store fallback for zero-database test runs
let memoryAIAnalyses = [];

/**
 * Validate analysis payload against schema rules
 */
function validateAnalysisData(analysis) {
  if (!analysis || typeof analysis !== 'object') {
    throw new Error('Analysis data is required');
  }

  const validSentiments = ['positive', 'neutral', 'negative'];
  if (!analysis.sentiment || !validSentiments.includes(analysis.sentiment)) {
    throw new Error('Invalid sentiment. Must be positive, neutral, or negative');
  }

  if (typeof analysis.sentimentScore !== 'number' || isNaN(analysis.sentimentScore)) {
    throw new Error('sentimentScore is required and must be a number');
  }

  if (analysis.sentimentScore < 0 || analysis.sentimentScore > 1) {
    throw new Error('sentimentScore must be between 0 and 1');
  }

  if (!analysis.category || typeof analysis.category !== 'string' || !analysis.category.trim()) {
    throw new Error('Category is required and must be a non-empty string');
  }

  if (!analysis.emotion || typeof analysis.emotion !== 'string' || !analysis.emotion.trim()) {
    throw new Error('Emotion is required and must be a non-empty string');
  }

  const validUrgencies = ['low', 'medium', 'high'];
  if (!analysis.urgency || !validUrgencies.includes(analysis.urgency)) {
    throw new Error('Invalid urgency. Must be low, medium, or high');
  }

  if (!analysis.summary || typeof analysis.summary !== 'string' || !analysis.summary.trim()) {
    throw new Error('Summary is required and must be a non-empty string');
  }

  if (analysis.topics !== undefined && !Array.isArray(analysis.topics)) {
    throw new Error('Topics must be an array of strings');
  }
}

/**
 * Save or update AI analysis for a feedback item
 * Uses upsert strategy to prevent duplicate documents for the same feedbackId.
 */
async function saveFeedbackAnalysis(feedbackId, analysisData) {
  if (!feedbackId) {
    throw new Error('feedbackId is required');
  }

  const isDb = getIsConnected();

  if (isDb && !mongoose.Types.ObjectId.isValid(feedbackId)) {
    throw new Error('Invalid feedbackId format');
  }

  // 1. Validate payload fields
  validateAnalysisData(analysisData);

  // 2. Verify referenced Feedback exists
  if (isDb) {
    const existingFeedback = await Feedback.findById(feedbackId);
    if (!existingFeedback) {
      throw new Error('Referenced feedback entry not found');
    }
  }

  const cleanData = {
    feedbackId,
    sentiment: analysisData.sentiment,
    sentimentScore: analysisData.sentimentScore,
    category: analysisData.category.trim(),
    emotion: analysisData.emotion.trim(),
    urgency: analysisData.urgency,
    summary: analysisData.summary.trim(),
    topics: Array.isArray(analysisData.topics)
      ? Array.from(new Set(analysisData.topics.filter(t => typeof t === 'string' && t.trim()).map(t => t.trim())))
      : [],
  };

  // 3. Upsert strategy in MongoDB
  if (isDb) {
    const savedDocument = await AIAnalysis.findOneAndUpdate(
      { feedbackId },
      cleanData,
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    return savedDocument;
  }

  // Fallback for memory mode execution
  const existingIdx = memoryAIAnalyses.findIndex(a => String(a.feedbackId) === String(feedbackId));
  if (existingIdx !== -1) {
    memoryAIAnalyses[existingIdx] = {
      ...memoryAIAnalyses[existingIdx],
      ...cleanData,
      updatedAt: new Date(),
    };
    return memoryAIAnalyses[existingIdx];
  }

  const newDoc = {
    _id: `analysis_${Date.now()}`,
    ...cleanData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memoryAIAnalyses.push(newDoc);
  return newDoc;
}

/**
 * Get AI Analysis by feedbackId
 */
async function getFeedbackAnalysisByFeedbackId(feedbackId) {
  if (!feedbackId) return null;

  const isDb = getIsConnected();

  if (isDb) {
    if (!mongoose.Types.ObjectId.isValid(feedbackId)) return null;
    return await AIAnalysis.findOne({ feedbackId }).populate('feedbackId');
  }

  return memoryAIAnalyses.find(a => String(a.feedbackId) === String(feedbackId)) || null;
}

module.exports = {
  saveFeedbackAnalysis,
  getFeedbackAnalysisByFeedbackId,
  validateAnalysisData,
};
