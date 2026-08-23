const { GoogleGenAI } = require('@google/genai');
const { demoMode } = require('../config/appConfig');

const getApiKey = () => process.env.GEMINI_API_KEY || '';

/**
 * Initialize Gemini API client if API key is provided and demo mode is disabled
 */
const getAiClient = () => {
  if (demoMode) {
    console.log('DEMO_MODE enabled: Gemini API calls are disabled. Using local analysis fallback.');
    return null;
  }

  const apiKey = getApiKey();
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return null;
  }
  try {
    return new GoogleGenAI({ apiKey });
  } catch (err) {
    console.error('Error initializing GoogleGenAI client:', err);
    return null;
  }
};

/**
 * Helper: call Gemini model and get text response
 */
async function callGemini(client, prompt) {
  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  return response.text;
}



/**
 * Analyze raw text transcript of customer phone feedback
 */
async function analyzeTranscript(rawTranscript) {
  const ai = getAiClient();

  const prompt = `
Analyze the following restaurant customer phone feedback transcript.
Extract structured metrics and return a JSON object with:
1. "sentimentScore": integer between 0 and 100 (0 = highly dissatisfied, 50 = neutral, 100 = ecstatic).
2. "sentimentLabel": string, exactly one of ["positive", "neutral", "negative"].
3. "feedbackCategory": string, primary category from ["Food Quality", "Service", "Ambiance", "Pricing", "Delivery", "General"].
4. "summary": string, concise 1-2 sentence overview of customer's main feedback points.
5. "actionItems": array of short actionable bullet points for the restaurant manager/owner.

Transcript:
"""
${rawTranscript}
"""

Output format strictly as JSON:
{
  "sentimentScore": 85,
  "sentimentLabel": "positive",
  "feedbackCategory": "Food Quality",
  "summary": "Customer thoroughly enjoyed the truffle pizza but noted the wait time was slightly long.",
  "actionItems": ["Acknowledge compliment on truffle pizza with chef", "Review kitchen prep times during peak hours"]
}
`;

  if (ai) {
    try {
      const text = await callGemini(ai, prompt);
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return {
        sentimentScore: typeof parsed.sentimentScore === 'number' ? parsed.sentimentScore : 75,
        sentimentLabel: parsed.sentimentLabel || 'positive',
        feedbackCategory: parsed.feedbackCategory || 'Food Quality',
        summary: parsed.summary || 'Customer provided general feedback on their meal experience.',
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : ['Review customer feedback with staff'],
      };
    } catch (err) {
      console.warn('[Gemini API Fallback Transcript Analysis]:', err.message);
    }
  }

  // Smart algorithmic analysis fallback if Gemini API key not present
  const lower = (rawTranscript || '').toLowerCase();
  let sentimentScore = 75;
  let sentimentLabel = 'positive';
  let category = 'Food Quality';

  if (lower.includes('terrible') || lower.includes('cold') || lower.includes('raw') || lower.includes('rude') || lower.includes('worst') || lower.includes('slow') || lower.includes('horrible') || lower.includes('long wait')) {
    sentimentScore = 32;
    sentimentLabel = 'negative';
  } else if (lower.includes('okay') || lower.includes('average') || lower.includes('fine') || lower.includes('decent')) {
    sentimentScore = 58;
    sentimentLabel = 'neutral';
  } else if (lower.includes('delicious') || lower.includes('amazing') || lower.includes('great') || lower.includes('excellent') || lower.includes('love')) {
    sentimentScore = 92;
    sentimentLabel = 'positive';
  }

  if (lower.includes('waiter') || lower.includes('server') || lower.includes('staff') || lower.includes('host') || lower.includes('service')) {
    category = 'Service';
  } else if (lower.includes('delivery') || lower.includes('driver') || lower.includes('late') || lower.includes('box')) {
    category = 'Delivery';
  } else if (lower.includes('price') || lower.includes('expensive') || lower.includes('bill') || lower.includes('cost')) {
    category = 'Pricing';
  } else if (lower.includes('loud') || lower.includes('music') || lower.includes('seating') || lower.includes('clean') || lower.includes('ambiance')) {
    category = 'Ambiance';
  }

  const sampleActionItems = sentimentLabel === 'negative'
    ? ['Issue customer follow-up apology & voucher', 'Conduct staff briefing on service speed', 'Verify food temperature before dispatch']
    : sentimentLabel === 'neutral'
      ? ['Gather additional feedback on side dishes', 'Ensure drink orders arrive promptly']
      : ['Share positive feedback with kitchen team', 'Offer loyalty reward bonus for next visit'];

  return {
    sentimentScore,
    sentimentLabel,
    feedbackCategory: category,
    summary: `Customer expressed ${sentimentLabel} sentiment regarding their ${category.toLowerCase()} experience.`,
    actionItems: sampleActionItems,
  };
}

/**
 * Validate and sanitize Gemini analysis output to guarantee contract compliance
 */
function validateAndSanitizeAnalysis(parsed, text) {
  const validSentiments = ['positive', 'negative', 'neutral'];
  const validUrgencies = ['low', 'medium', 'high'];

  let sentiment = typeof parsed?.sentiment === 'string' ? parsed.sentiment.toLowerCase().trim() : '';
  if (!validSentiments.includes(sentiment)) {
    sentiment = 'neutral';
  }

  let sentimentScore = typeof parsed?.sentimentScore === 'number' ? parsed.sentimentScore : parseFloat(parsed?.sentimentScore);
  if (isNaN(sentimentScore)) {
    sentimentScore = sentiment === 'positive' ? 0.85 : (sentiment === 'negative' ? 0.25 : 0.5);
  }
  // Clamp between 0.0 and 1.0
  sentimentScore = Math.max(0.0, Math.min(1.0, Math.round(sentimentScore * 100) / 100));

  let urgency = typeof parsed?.urgency === 'string' ? parsed.urgency.toLowerCase().trim() : '';
  if (!validUrgencies.includes(urgency)) {
    urgency = sentiment === 'negative' ? 'high' : (sentiment === 'neutral' ? 'medium' : 'low');
  }

  let category = typeof parsed?.category === 'string' && parsed.category.trim() ? parsed.category.trim().toLowerCase() : 'other';
  let emotion = typeof parsed?.emotion === 'string' && parsed.emotion.trim() ? parsed.emotion.trim().toLowerCase() : 'neutral';
  let summary = typeof parsed?.summary === 'string' && parsed.summary.trim() ? parsed.summary.trim() : (text ? text.slice(0, 150) : 'No summary available.');

  let topics = Array.isArray(parsed?.topics)
    ? Array.from(new Set(parsed.topics.filter(t => typeof t === 'string' && t.trim()).map(t => t.trim().toLowerCase())))
    : [];

  if (topics.length === 0) {
    topics = [category];
  }

  return {
    sentiment,
    sentimentScore,
    category,
    emotion,
    urgency,
    summary,
    topics,
  };
}

/**
 * Smart algorithmic fallback analysis generator when Gemini API is unavailable or fails
 */
function generateFeedbackFallbackAnalysis(text) {
  const lower = (text || '').toLowerCase();

  let sentiment = 'neutral';
  let sentimentScore = 0.5;
  let emotion = 'neutral';
  let urgency = 'medium';
  let category = 'other';
  const topicsSet = new Set();

  if (lower.includes('terrible') || lower.includes('worst') || lower.includes('horrible') || lower.includes('frustrated') || lower.includes('angry') || lower.includes('slow') || lower.includes('took too long') || lower.includes('cold') || lower.includes('rude') || lower.includes('bad') || lower.includes('disappointed')) {
    sentiment = 'negative';
    sentimentScore = 0.18;
    urgency = 'high';
    if (lower.includes('frustrated') || lower.includes('angry')) {
      emotion = 'frustrated';
    } else if (lower.includes('disappointed')) {
      emotion = 'disappointed';
    } else {
      emotion = 'frustrated';
    }
  } else if (lower.includes('great') || lower.includes('loved') || lower.includes('delicious') || lower.includes('excellent') || lower.includes('amazing') || lower.includes('happy') || lower.includes('wonderful')) {
    sentiment = 'positive';
    sentimentScore = 0.92;
    urgency = 'low';
    emotion = lower.includes('happy') ? 'happy' : 'satisfied';
  }

  if (lower.includes('checkout') || lower.includes('pay') || lower.includes('register') || lower.includes('cashier') || lower.includes('bill')) {
    category = 'checkout';
    topicsSet.add('checkout');
    topicsSet.add('performance');
  } else if (lower.includes('service') || lower.includes('waiter') || lower.includes('staff') || lower.includes('server') || lower.includes('host')) {
    category = 'service';
    topicsSet.add('service');
    topicsSet.add('staff');
  } else if (lower.includes('food') || lower.includes('meal') || lower.includes('steak') || lower.includes('dish') || lower.includes('taste')) {
    category = 'food';
    topicsSet.add('food');
    topicsSet.add('quality');
  } else if (lower.includes('price') || lower.includes('cost') || lower.includes('expensive')) {
    category = 'pricing';
    topicsSet.add('pricing');
  } else if (lower.includes('delivery') || lower.includes('driver')) {
    category = 'delivery';
    topicsSet.add('delivery');
  } else {
    category = 'other';
    topicsSet.add('feedback');
  }

  if (lower.includes('slow') || lower.includes('took too long') || lower.includes('wait') || lower.includes('delay')) {
    topicsSet.add('performance');
  }

  const summary = text && text.trim() ? text.trim() : 'Customer provided feedback.';

  return {
    sentiment,
    sentimentScore,
    category,
    emotion,
    urgency,
    summary,
    topics: Array.from(topicsSet),
  };
}

/**
 * Analyze customer feedback text using Google Gemini AI
 * Returns structured analysis: { sentiment, sentimentScore, category, emotion, urgency, summary, topics }
 */
async function analyzeFeedbackText(feedbackInput) {
  const text = typeof feedbackInput === 'string'
    ? feedbackInput
    : (feedbackInput?.text || feedbackInput?.summary || '');

  if (!text || !text.trim()) {
    throw new Error('Feedback text is required for analysis');
  }

  const cleanText = text.trim();
  const ai = getAiClient();

  if (ai) {
    try {
      const prompt = `
You are an expert AI customer experience analyst.
Analyze the following customer feedback text carefully:

---
${cleanText}
---

Extract structured analytical data and return strictly valid JSON matching this exact structure:
{
  "sentiment": "positive" | "negative" | "neutral",
  "sentimentScore": number between 0.0 and 1.0 (where 0.0 is extremely negative/dissatisfied, 0.5 is neutral, and 1.0 is extremely positive/delighted),
  "category": "short category string (e.g. checkout, service, food, pricing, staff, delivery, product, technical, other)",
  "emotion": "short emotion string (e.g. happy, satisfied, frustrated, angry, disappointed, confused, neutral, excited)",
  "urgency": "low" | "medium" | "high",
  "summary": "short, concise 1-2 sentence summary of the customer feedback without inventing facts",
  "topics": ["array of relevant unique topic strings"]
}

Rules:
1. "sentiment" MUST be exactly one of: "positive", "negative", or "neutral".
2. "sentimentScore" MUST be a floating point number strictly between 0.0 and 1.0 (e.g. 0.87). Do NOT use 0-100 scale.
3. "category" MUST be a short meaningful category describing the main feedback issue.
4. "emotion" MUST be a short emotion descriptor.
5. "urgency" MUST be exactly one of: "low", "medium", or "high".
6. "summary" MUST be a concise overview based only on the provided feedback text.
7. "topics" MUST be an array of strings with no duplicates.
8. Respond ONLY with valid raw JSON. Do NOT wrap in markdown backticks or add explanatory text outside JSON.
`;

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API request timed out')), 10000)
      );

      const apiPromise = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const response = await Promise.race([apiPromise, timeoutPromise]);
      const rawText = response.text || '';
      const cleanJsonStr = rawText.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanJsonStr);

      return validateAndSanitizeAnalysis(parsed, cleanText);
    } catch (err) {
      console.warn('[Gemini AI Feedback Analysis Warning]:', err.message);
    }
  }

  return generateFeedbackFallbackAnalysis(cleanText);
}

module.exports = {
  analyzeTranscript,
  analyzeFeedbackText,
  analyzeFeedback: analyzeFeedbackText,
};
