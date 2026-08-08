const demoMode = process.env.DEMO_MODE === 'true';

const twilioConfigured = !demoMode &&
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_PHONE_NUMBER;

const geminiConfigured = !demoMode &&
  process.env.GEMINI_API_KEY &&
  process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';

module.exports = {
  demoMode,
  twilioConfigured: Boolean(twilioConfigured),
  geminiConfigured: Boolean(geminiConfigured),
};
