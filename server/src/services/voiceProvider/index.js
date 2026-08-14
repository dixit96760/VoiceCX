const VapiVoiceProvider = require('./VapiVoiceProvider');
const TwilioVoiceProvider = require('./TwilioVoiceProvider');
const MockVoiceProvider = require('./MockVoiceProvider');
const ExotelVoiceProvider = require('./ExotelVoiceProvider');

let currentProviderInstance = null;

/**
 * Get active VoiceProvider instance based on VOICE_PROVIDER_MODE environment variable
 * Supported modes: 'twilio' | 'vapi' | 'mock' | 'exotel'
 */
function getVoiceProvider() {
  const mode = (process.env.VOICE_MODE || process.env.VOICE_PROVIDER_MODE || 'mock').toLowerCase();

  if (mode === 'twilio' && process.env.TWILIO_ACCOUNT_SID) {
    if (!currentProviderInstance || !(currentProviderInstance instanceof TwilioVoiceProvider)) {
      console.log('[VoiceProvider Factory] Active Provider: TwilioVoiceProvider (Twilio Voice API Outbound)');
      currentProviderInstance = new TwilioVoiceProvider();
    }
  } else if (mode === 'vapi' && process.env.VAPI_API_KEY) {
    if (!currentProviderInstance || !(currentProviderInstance instanceof VapiVoiceProvider)) {
      console.log('[VoiceProvider Factory] Active Provider: VapiVoiceProvider (Live Vapi AI Telephony)');
      currentProviderInstance = new VapiVoiceProvider();
    }
  } else if (mode === 'exotel') {
    if (!currentProviderInstance || !(currentProviderInstance instanceof ExotelVoiceProvider)) {
      console.log('[VoiceProvider Factory] Active Provider: ExotelVoiceProvider');
      currentProviderInstance = new ExotelVoiceProvider();
    }
  } else {
    if (!currentProviderInstance || !(currentProviderInstance instanceof MockVoiceProvider)) {
      console.log('[VoiceProvider Factory] Active Provider: MockVoiceProvider (Sandbox Mode - Credit Free)');
      currentProviderInstance = new MockVoiceProvider();
    }
  }

  return currentProviderInstance;
}

module.exports = {
  getVoiceProvider,
  TwilioVoiceProvider,
  VapiVoiceProvider,
  MockVoiceProvider,
  ExotelVoiceProvider,
};
