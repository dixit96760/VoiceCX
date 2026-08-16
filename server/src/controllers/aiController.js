const mongoose = require('mongoose');
const { GoogleGenAI } = require('@google/genai');
const Feedback = require('../models/Feedback');
const { analyzeFeedbackText } = require('../services/geminiService');
const { saveFeedbackAnalysis, getFeedbackAnalysisByFeedbackId } = require('../services/aiAnalysisService');
const { getIsConnected } = require('../config/db');

// @desc    Trigger AI analysis for specific feedback item and store result
// @route   POST /api/ai/analyze/:feedbackId
// @access  Private
const analyzeFeedbackById = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const isDb = getIsConnected();

    if (isDb && !mongoose.Types.ObjectId.isValid(feedbackId)) {
      return res.status(400).json({ success: false, message: 'Invalid feedbackId format' });
    }

    let feedbackText = '';
    let targetFeedback = null;

    if (isDb) {
      targetFeedback = await Feedback.findOne({ _id: feedbackId, user: req.user._id });
      if (!targetFeedback) {
        return res.status(404).json({ success: false, message: 'Feedback entry not found' });
      }
      feedbackText = targetFeedback.summary || targetFeedback.text || (typeof targetFeedback.transcript === 'string' ? targetFeedback.transcript : (Array.isArray(targetFeedback.transcript) ? JSON.stringify(targetFeedback.transcript) : ''));
    } else {
      feedbackText = 'Customer provided feedback.';
    }

    if (!feedbackText || !feedbackText.trim()) {
      feedbackText = 'Customer provided dining feedback.';
    }

    // 1. Generate structured analysis using Gemini AI service
    const analysisResult = await analyzeFeedbackText(feedbackText);

    // 2. Persist analysis into MongoDB AIAnalysis collection via storage service
    const savedAnalysis = await saveFeedbackAnalysis(feedbackId, analysisResult);

    return res.status(200).json({
      success: true,
      message: 'AI feedback analysis completed and saved successfully',
      data: savedAnalysis,
    });
  } catch (error) {
    if (error.message && (error.message.includes('not found') || error.message.includes('Referenced feedback'))) {
      return res.status(404).json({ success: false, message: 'Feedback entry not found' });
    }
    return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

// @desc    Get saved AI analysis for specific feedback item
// @route   GET /api/ai/analysis/:feedbackId
// @access  Private
const getFeedbackAnalysis = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const isDb = getIsConnected();

    if (isDb && !mongoose.Types.ObjectId.isValid(feedbackId)) {
      return res.status(400).json({ success: false, message: 'Invalid feedbackId format' });
    }

    const analysisDoc = await getFeedbackAnalysisByFeedbackId(feedbackId);

    if (!analysisDoc) {
      return res.status(404).json({ success: false, message: 'AI analysis not found for this feedback entry' });
    }

    return res.status(200).json({
      success: true,
      data: analysisDoc,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

// @desc    Analyze call transcript with Google Gemini AI
// @route   POST /api/ai/analyze-transcript
// @access  Private
const analyzeTranscript = async (req, res) => {
  try {
    const { transcript, text } = req.body;
    const rawTranscript = typeof transcript === 'string' ? transcript : (text || JSON.stringify(transcript));

    if (!rawTranscript || rawTranscript.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Transcript or text input is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Return structured fallback analysis when Gemini API key is missing
      return res.json({
        success: true,
        mocked: true,
        message: 'GEMINI_API_KEY is not set in environment. Returning standard rule-based NLP extraction.',
        analysis: generateFallbackAnalysis(rawTranscript),
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an expert AI customer experience analyst for restaurants.
Analyze the following customer voice feedback transcript carefully:

---
${rawTranscript}
---

Extract structured analytical data and return strictly valid JSON matching this exact structure:
{
  "sentiment": "positive" | "neutral" | "negative",
  "rating": number (1 to 5),
  "summary": "1-2 sentence executive summary of the feedback",
  "categoryRatings": {
    "food": number (1 to 5),
    "service": number (1 to 5),
    "ambience": number (1 to 5),
    "value": number (1 to 5)
  },
  "topIssues": ["issue 1", "issue 2"],
  "praises": ["praise 1", "praise 2"],
  "actionableItems": ["action item 1", "action item 2"]
}

Respond ONLY with JSON without markdown formatting backticks.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const responseText = response.text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
      const parsedData = JSON.parse(responseText);

      return res.json({
        success: true,
        analysis: parsedData,
      });
    } catch (geminiError) {
      console.warn('[Gemini API Warning]', geminiError.message);
      return res.json({
        success: true,
        mocked: true,
        warning: `Gemini API call failed: ${geminiError.message}. Using rule-based fallback.`,
        analysis: generateFallbackAnalysis(rawTranscript),
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Fallback rule-based analysis generator
function generateFallbackAnalysis(text) {
  const lower = text.toLowerCase();
  
  let sentiment = 'neutral';
  let rating = 3;

  if (lower.includes('great') || lower.includes('loved') || lower.includes('delicious') || lower.includes('excellent') || lower.includes('amazing')) {
    sentiment = 'positive';
    rating = 5;
  } else if (lower.includes('bad') || lower.includes('cold') || lower.includes('slow') || lower.includes('terrible') || lower.includes('disappointed')) {
    sentiment = 'negative';
    rating = 2;
  }

  const topIssues = [];
  if (lower.includes('cold') || lower.includes('temperature')) topIssues.push('Food served cold');
  if (lower.includes('slow') || lower.includes('wait') || lower.includes('delay')) topIssues.push('Long wait time');
  if (lower.includes('rude') || lower.includes('staff')) topIssues.push('Staff service quality');
  if (topIssues.length === 0 && sentiment === 'negative') topIssues.push('Overall satisfaction issue');

  const praises = [];
  if (lower.includes('delicious') || lower.includes('tasty') || lower.includes('flavorable')) praises.push('Great food taste');
  if (lower.includes('friendly') || lower.includes('attentive')) praises.push('Friendly service');

  return {
    sentiment,
    rating,
    summary: `Customer feedback analysis for call. Overall sentiment detected as ${sentiment}.`,
    categoryRatings: {
      food: rating,
      service: sentiment === 'positive' ? 5 : 3,
      ambience: 4,
      value: 4,
    },
    topIssues,
    praises,
    actionableItems: topIssues.length > 0 ? ['Follow up with customer regarding issues reported'] : ['Send gratitude message to customer'],
  };
}

module.exports = {
  analyzeTranscript,
  analyzeFeedbackById,
  getFeedbackAnalysis,
};
