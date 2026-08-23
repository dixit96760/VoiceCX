const twilio = require('twilio');
const { demoMode } = require('../config/appConfig');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client = null;

if (!demoMode && accountSid && authToken && accountSid.startsWith('AC')) {
  try {
    client = twilio(accountSid, authToken);
    console.log('Twilio client initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Twilio client:', err.message);
  }
} else if (demoMode) {
  console.log('DEMO_MODE enabled: Twilio outbound dialing is disabled. No real phone calls will be placed.');
} else {
  console.log('Twilio credentials missing or invalid. Outbound real calls disabled until TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN set.');
}

/**
 * Make an outbound real phone call using Twilio Voice API
 */
exports.makeOutboundCall = async ({ toPhoneNumber, customerName, promptContext, callbackUrl }) => {
  if (demoMode) {
    return {
      sid: `DEMO_CALL_${Date.now()}`,
      to: toPhoneNumber,
      from: twilioPhoneNumber || '+15551234567',
      status: 'queued',
      demoMode: true,
    };
  }

  if (!client || !twilioPhoneNumber) {
    throw new Error('Twilio is not configured on the server. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in environment variables.');
  }

  const call = await client.calls.create({
    url: callbackUrl, // Webhook URL returning TwiML instructions
    to: toPhoneNumber,
    from: twilioPhoneNumber,
    statusCallback: callbackUrl + '/status',
    statusCallbackEvent: ['completed', 'failed']
  });

  return call;
};

/**
 * Generate TwiML response for voice call turn
 */
exports.generateVoiceResponse = (sayMessage, gatherActionUrl) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  if (gatherActionUrl) {
    const gather = twiml.gather({
      input: 'speech',
      action: gatherActionUrl,
      method: 'POST',
      speechTimeout: 'auto',
      language: 'en-US'
    });
    gather.say({ voice: 'Polly.Joanna' }, sayMessage);
    twiml.say({ voice: 'Polly.Joanna' }, "We didn't catch that. Thank you for your time and have a wonderful day!");
  } else {
    twiml.say({ voice: 'Polly.Joanna' }, sayMessage);
    twiml.hangup();
  }

  return twiml.toString();
};
