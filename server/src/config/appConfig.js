const demoMode = process.env.DEMO_MODE === 'true';

const twilioConfigured = !demoMode &&
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_PHONE_NUMBER;

const geminiConfigured = !demoMode &&
  !!process.env.GEMINI_API_KEY;

module.exports = {
  demoMode,
  twilioConfigured: Boolean(twilioConfigured),
  geminiConfigured: Boolean(geminiConfigured),
};
