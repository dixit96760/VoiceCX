const VoiceProvider = require('./VoiceProvider');

/**
 * Modular Provider Extension Stub for Exotel Telephony
 * Demonstrates application decoupling so telephony provider can be swapped without rewriting UI/DB layer
 */
class ExotelVoiceProvider extends VoiceProvider {
  constructor() {
    super();
    this.accountSid = process.env.EXOTEL_ACCOUNT_SID;
    this.apiKey = process.env.EXOTEL_API_KEY;
    this.apiToken = process.env.EXOTEL_API_TOKEN;
  }

  async createOutboundCall({ contactName, phoneNumber, purpose, customInstructions }) {
    if (!this.apiKey || !this.accountSid) {
      throw new Error('Exotel credentials (EXOTEL_ACCOUNT_SID, EXOTEL_API_KEY) are not configured in environment variables');
    }

    // Exotel Outbound Call API Integration
    const providerCallId = `exotel_${Date.now()}`;
    return {
      providerCallId,
      status: 'queued',
    };
  }

  async getCall(callId) {
    return { id: callId, status: 'completed' };
  }

  async handleWebhook(payload) {
    return {
      vapiCallId: payload.CallSid || payload.vapiCallId,
      status: payload.Status === 'completed' ? 'completed' : 'in-progress',
      transcript: payload.Transcript || '',
      duration: Number(payload.Duration) || 0,
      rawPayload: payload,
    };
  }

  async endCall(callId) {
    return true;
  }
}

module.exports = ExotelVoiceProvider;
