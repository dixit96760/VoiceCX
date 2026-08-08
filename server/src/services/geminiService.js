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
 * Generate Voice Agent Script from restaurant menu & tone
 */
async function generateVoiceScript({ restaurantName, cuisineType, voiceAgentTone, menuItems }) {
  const ai = getAiClient();
  const menuSummary = (menuItems || [])
    .map((item) => `- ${item.name} ($${item.price}): ${item.description || ''}`)
    .join('\n');

  const prompt = `
You are an expert conversational AI designer for restaurant voice agents.
Create a warm, engaging, and professional voice agent script for automated customer follow-up calls after dining at "${restaurantName}" (${cuisineType} cuisine).

Tone: ${voiceAgentTone || 'Friendly & Warm'}
Featured Menu Items:
${menuSummary || '- Signature Dishes and Chef Specials'}

Please output a structured JSON object with the following fields:
{
  "greeting": "Opening greeting line asking about their recent visit",
  "keyQuestions": ["Array of 3 natural customer feedback questions covering food, service, and ambiance"],
  "specialOfferOffer": "A polite offer for their next visit or dessert incentive",
  "fullScript": "The full conversational voice script flow written out for the AI voice agent"
}
Only output valid raw JSON without markdown codeblock formatting if possible.
`;

  if (ai) {
    try {
      const text = await callGemini(ai, prompt);
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return parsed;
    } catch (err) {
      console.warn('[Gemini API Fallback Script Generation]:', err.message);
    }
  }

  // Fallback realistic response if API key is not configured or fails
  return {
    greeting: `Hi! This is Alex calling from ${restaurantName}. We hope you had a fantastic meal with us today!`,
    keyQuestions: [
      `How did you enjoy our featured items like ${menuItems?.[0]?.name || 'our signature dishes'}?`,
      `How was the service provided by your host and server?`,
      `Is there anything we can improve regarding the speed, presentation, or ambiance?`
    ],
    specialOfferOffer: `We'd love to gift you 15% off your next visit or a complimentary dessert!`,
    fullScript: `[AGENT]: Hello! I am calling from ${restaurantName} to see how your visit went today.\n[CUSTOMER]: (Responds with feedback)\n[AGENT]: Thank you so much! We appreciate your thoughts on our ${cuisineType || 'food'} and team service. Have a wonderful rest of your day!`
  };
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

module.exports = {
  generateVoiceScript,
  analyzeTranscript,
};
