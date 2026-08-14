const { GoogleGenAI } = require('@google/genai');

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') return null;
  try {
    return new GoogleGenAI({ apiKey });
  } catch (e) {
    return null;
  }
};

/**
 * Generate the AI opening greeting for the call
 */
async function generateGreeting(contactName, purpose, customInstructions) {
  const ai = getAiClient();

  if (ai) {
    try {
      const prompt = `You are a professional, warm AI calling assistant.
Generate a SHORT, natural opening greeting (2-3 sentences max) for an outbound phone call.

Contact Name: ${contactName || 'there'}
Call Purpose: ${purpose || 'follow up'}
${customInstructions ? `Special Instructions: ${customInstructions}` : ''}

Rules:
- Introduce yourself as "Alex, an AI assistant"
- Mention the contact's name
- State the purpose briefly
- End with an open question to get them talking
- Keep it under 40 words
- Sound natural and warm, not robotic

Output ONLY the greeting text, nothing else.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text.trim();
    } catch (err) {
      console.warn('[twimlService] Gemini greeting fallback:', err.message);
    }
  }

  // Fallback greeting
  return `Hi ${contactName || 'there'}, this is Alex, an AI assistant. I'm calling regarding ${purpose || 'a follow-up'}. How are you doing today?`;
}

/**
 * Generate AI reply based on what the caller said
 */
async function generateAIReply(callerSpeech, conversationHistory, contactName, purpose, customInstructions) {
  const ai = getAiClient();

  const historyText = conversationHistory.length > 0
    ? conversationHistory.map(h => `${h.role}: ${h.text}`).join('\n')
    : '';

  if (ai) {
    try {
      const prompt = `You are Alex, a professional AI calling assistant on a live phone call.

Contact Name: ${contactName || 'Customer'}
Call Purpose: ${purpose || 'Follow up'}
${customInstructions ? `Special Instructions: ${customInstructions}` : ''}

Conversation so far:
${historyText}

The person just said: "${callerSpeech}"

Rules:
- Reply naturally and conversationally (2-3 sentences max)
- Stay focused on the call purpose
- If they want to end the call, say a warm goodbye
- If they seem interested, ask a relevant follow-up question
- Never say you are a robot/AI unless directly asked
- Be empathetic and professional
- Output ONLY your spoken reply, nothing else`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text.trim();
    } catch (err) {
      console.warn('[twimlService] Gemini reply fallback:', err.message);
    }
  }

  // Fallback reply
  const lower = (callerSpeech || '').toLowerCase();
  if (lower.includes('bye') || lower.includes('goodbye') || lower.includes('no thank') || lower.includes('not interested')) {
    return `Thank you so much for your time, ${contactName || 'there'}. Have a wonderful day! Goodbye.`;
  }
  return `Thank you for sharing that. Is there anything else you'd like to discuss regarding ${purpose || 'this matter'}?`;
}

/**
 * Check if the conversation should end
 */
function shouldEndCall(speech) {
  const lower = (speech || '').toLowerCase();
  const endPhrases = ['goodbye', 'bye', 'hang up', 'end call', 'stop', 'not interested', 'no thank you', 'do not call', 'remove me'];
  return endPhrases.some(phrase => lower.includes(phrase));
}

/**
 * Build TwiML for initial call greeting
 */
async function buildGreetingTwiML(callSid, contactName, purpose, customInstructions, webhookBaseUrl) {
  const greeting = await generateGreeting(contactName, purpose, customInstructions);
  const gatherUrl = `${webhookBaseUrl}/api/webhooks/twilio/gather`;

  // Encode metadata into gather URL params
  const params = new URLSearchParams({
    callSid,
    contactName: contactName || '',
    purpose: purpose || '',
    customInstructions: customInstructions || '',
    turn: '1',
    history: '',
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather action="${gatherUrl}?${params.toString()}" input="speech" timeout="6" speechTimeout="auto" language="en-IN">
    <Say voice="Polly.Aditi" language="en-IN">${escapeXml(greeting)}</Say>
  </Gather>
  <Say voice="Polly.Aditi" language="en-IN">I didn't catch that. Let me try again.</Say>
  <Redirect method="POST">${gatherUrl}?${params.toString()}&amp;SpeechResult=</Redirect>
</Response>`;
}

/**
 * Build TwiML for AI reply during conversation
 */
async function buildReplyTwiML(callerSpeech, callSid, contactName, purpose, customInstructions, turn, historyEncoded, webhookBaseUrl) {
  // Decode conversation history
  let history = [];
  try {
    if (historyEncoded) {
      history = JSON.parse(Buffer.from(historyEncoded, 'base64').toString('utf8'));
    }
  } catch (e) {
    history = [];
  }

  // Add what caller just said
  if (callerSpeech) {
    history.push({ role: 'CUSTOMER', text: callerSpeech });
  }

  const isEnding = shouldEndCall(callerSpeech);

  if (isEnding || turn > 8) {
    // End the call gracefully
    const farewell = `Thank you so much for your time${contactName ? ', ' + contactName : ''}. Have a wonderful day. Goodbye!`;
    return {
      twiml: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">${escapeXml(farewell)}</Say>
  <Hangup/>
</Response>`,
      history,
      ended: true,
    };
  }

  // Generate AI reply
  const aiReply = await generateAIReply(callerSpeech, history, contactName, purpose, customInstructions);
  history.push({ role: 'AI', text: aiReply });

  // Check again if AI reply signals call end
  const aiSignalsEnd = shouldEndCall(aiReply) || aiReply.toLowerCase().includes('goodbye') || aiReply.toLowerCase().includes('have a wonderful');

  if (aiSignalsEnd) {
    return {
      twiml: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">${escapeXml(aiReply)}</Say>
  <Hangup/>
</Response>`,
      history,
      ended: true,
    };
  }

  // Encode updated history for next turn
  const newHistoryEncoded = Buffer.from(JSON.stringify(history)).toString('base64');
  const gatherUrl = `${webhookBaseUrl}/api/webhooks/twilio/gather`;
  const params = new URLSearchParams({
    callSid,
    contactName: contactName || '',
    purpose: purpose || '',
    customInstructions: customInstructions || '',
    turn: String(Number(turn) + 1),
    history: newHistoryEncoded,
  });

  return {
    twiml: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather action="${gatherUrl}?${params.toString()}" input="speech" timeout="6" speechTimeout="auto" language="en-IN">
    <Say voice="Polly.Aditi" language="en-IN">${escapeXml(aiReply)}</Say>
  </Gather>
  <Say voice="Polly.Aditi" language="en-IN">Are you still there?</Say>
  <Hangup/>
</Response>`,
    history,
    ended: false,
  };
}

function escapeXml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Build transcript string from history array
 */
function buildTranscriptFromHistory(history) {
  return history.map(h => `${h.role}: ${h.text}`).join('\n');
}

module.exports = {
  buildGreetingTwiML,
  buildReplyTwiML,
  buildTranscriptFromHistory,
};
