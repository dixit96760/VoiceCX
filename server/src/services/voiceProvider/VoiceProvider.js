/**
 * Abstract Base Class for Voice Telephony Providers (Vapi, Exotel, Mock, etc.)
 */
class VoiceProvider {
  /**
   * Create an outbound AI phone call
   * @param {Object} params
   * @param {string} params.contactName
   * @param {string} params.phoneNumber
   * @param {string} params.purpose
   * @param {string} [params.customInstructions]
   * @param {Object} [params.metadata]
   * @returns {Promise<{ providerCallId: string, status: string, rawResponse?: any }>}
   */
  async createOutboundCall(params) {
    throw new Error('createOutboundCall() must be implemented by provider subclass');
  }

  /**
   * Fetch call details from telephony provider API
   * @param {string} callId
   */
  async getCall(callId) {
    throw new Error('getCall() must be implemented by provider subclass');
  }

  /**
   * Process raw webhook payload from telephony provider
   * @param {Object} payload
   * @param {Object} headers
   */
  async handleWebhook(payload, headers) {
    throw new Error('handleWebhook() must be implemented by provider subclass');
  }

  /**
   * Terminate an active call
   * @param {string} callId
   */
  async endCall(callId) {
    throw new Error('endCall() must be implemented by provider subclass');
  }
}

module.exports = VoiceProvider;
