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
 * Call Gemini with a hard timeout — so Twilio never hangs waiting
 */
async function geminiWithTimeout(prompt, timeoutMs = 8000) {
  const ai = getAiClient();
  if (!ai) return null;

  return Promise.race([
    ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt }).then(r => r.text.trim()),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini timeout')), timeoutMs)),
  ]).catch(err => {
    console.warn('[twimlService] Gemini timeout/error:', err.message);
    return null;
  });
}

/**
 * Build instant static greeting — NO Gemini call here.
 * Twilio times out in ~5s on the voice webhook, so this must be instant.
 * AI kicks in on gather turns which have much more time.
 */
function buildInstantGreeting(contactName, purpose) {
  const name = contactName && contactName !== 'Valued Customer' ? contactName : '';
  const greet = name ? `Hi ${name}!` : 'Hello!';
  return `${greet} This is Alex, an AI calling assistant. I'm reaching out ${purpose ? 'regarding ' + purpose : 'for a quick follow-up'}. How are you doing today?`;
}

/**
 * Build TwiML for initial call — INSTANT response, no Gemini wait
 */
async function buildGreetingTwiML(callSid, contactName, purpose, customInstructions, webhookBaseUrl) {
  const greeting = buildInstantGreeting(contactName, purpose);
  const gatherUrl = `${webhookBaseUrl}/api/webhooks/twilio/gather`;

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
  <Gather action="${gatherUrl}?${params.toString().replace(/&/g, '&amp;')}" input="speech" timeout="6" speechTimeout="auto" language="en-IN">
    <Say voice="alice" language="en-US">${escapeXml(greeting)}</Say>
  </Gather>
  <Say voice="alice" language="en-US">I didn't catch that. Are you there?</Say>
  <Hangup/>
</Response>`;
}

/**
 * Generate Gemini AI reply for gather turns (has 8s timeout)
 */
async function generateAIReply(callerSpeech, history, contactName, purpose, customInstructions) {
  const historyText = history.map(h => `${h.role}: ${h.text}`).join('\n');

  const prompt = `You are Alex, a professional AI calling assistant on a live phone call.

Contact Name: ${contactName || 'Customer'}
Call Purpose: ${purpose || 'Follow up'}
${customInstructions ? `Special Instructions: ${customInstructions}` : ''}

Conversation so far:
${historyText}

The person just said: "${callerSpeech}"

Rules:
- Reply naturally (2-3 sentences MAX — this is a phone call, be brief)
- Stay focused on the call purpose
- If they say bye/goodbye/not interested/stop, respond with a warm farewell
- Be empathetic and professional
- Output ONLY your spoken reply, nothing else`;

  const aiText = await geminiWithTimeout(prompt, 8000);
  if (aiText) return aiText;

  // Smart fallback replies if Gemini times out
  const lower = (callerSpeech || '').toLowerCase();
  if (lower.includes('bye') || lower.includes('goodbye') || lower.includes('not interested')) {
    return `Thank you for your time${contactName ? ', ' + contactName : ''}. Have a wonderful day! Goodbye.`;
  }
  if (lower.includes('yes') || lower.includes('sure') || lower.includes('okay') || lower.includes('go ahead')) {
    return `Great! ${purpose ? 'Regarding ' + purpose + ', ' : ''}could you share your thoughts or any feedback?`;
  }
  return `Thank you for sharing that. Is there anything else you'd like to discuss${purpose ? ' about ' + purpose : ''}?`;
}

/**
 * Check if conversation should end based on what was said
 */
function shouldEndCall(speech) {
  const lower = (speech || '').toLowerCase();
  return ['goodbye', 'bye', 'hang up', 'end call', 'stop calling', 'not interested', 'no thank you', 'do not call', 'remove me']
    .some(p => lower.includes(p));
}

function buildFarewellTwiML(text) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">${escapeXml(text)}</Say>
  <Hangup/>
</Response>`;
}

/**
 * Build TwiML for AI reply during conversation gather turns
 */
async function buildReplyTwiML(callerSpeech, callSid, contactName, purpose, customInstructions, turn, historyEncoded, webhookBaseUrl) {
  let history = [];
  try {
    if (historyEncoded) {
      history = JSON.parse(Buffer.from(historyEncoded, 'base64').toString('utf8'));
    }
  } catch (e) { history = []; }

  if (callerSpeech) {
    history.push({ role: 'CUSTOMER', text: callerSpeech });
  }

  // End call if user said goodbye or max turns reached
  if (shouldEndCall(callerSpeech) || turn > 8) {
    const farewell = `Thank you so much for your time${contactName ? ', ' + contactName : ''}. Have a wonderful day. Goodbye!`;
    history.push({ role: 'AI', text: farewell });
    return { twiml: buildFarewellTwiML(farewell), history, ended: true };
  }

  // Generate Gemini AI reply (with 8s timeout fallback)
  const aiReply = await generateAIReply(callerSpeech, history, contactName, purpose, customInstructions);
  history.push({ role: 'AI', text: aiReply });

  // Check if AI reply signals end of call
  const aiSignalsEnd = shouldEndCall(aiReply)
    || aiReply.toLowerCase().includes('goodbye')
    || aiReply.toLowerCase().includes('wonderful day');

  if (aiSignalsEnd) {
    return { twiml: buildFarewellTwiML(aiReply), history, ended: true };
  }

  // Continue conversation — encode history for next turn
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
  <Gather action="${gatherUrl}?${params.toString().replace(/&/g, '&amp;')}" input="speech" timeout="6" speechTimeout="auto" language="en-IN">
    <Say voice="alice" language="en-US">${escapeXml(aiReply)}</Say>
  </Gather>
  <Say voice="alice" language="en-US">Are you still there?</Say>
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

function buildTranscriptFromHistory(history) {
  return history.map(h => `${h.role}: ${h.text}`).join('\n');
}

module.exports = {
  buildGreetingTwiML,
  buildReplyTwiML,
  buildTranscriptFromHistory,
};
