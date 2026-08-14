const VoiceProvider = require('./VoiceProvider');

class MockVoiceProvider extends VoiceProvider {
  constructor() {
    super();
    this.mockCalls = new Map();
  }

  /**
   * Create sandbox mock call for local testing without telephony credit cost
   */
  async createOutboundCall({ contactName, phoneNumber, purpose, customInstructions, metadata }) {
    const mockVapiCallId = `mock_vapi_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const mockCallData = {
      id: mockVapiCallId,
      contactName: contactName || 'Valued Customer',
      phoneNumber,
      purpose: purpose || 'Customer Feedback & Survey',
      customInstructions: customInstructions || '',
      status: 'queued',
      createdAt: new Date(),
    };

    this.mockCalls.set(mockVapiCallId, mockCallData);

    console.log(`[MockVoiceProvider] Created mock call ${mockVapiCallId} to ${phoneNumber} (${contactName})`);

    // Asynchronously trigger status transitions & simulated webhooks
    this.simulateCallLifecycle(mockVapiCallId, contactName, purpose, customInstructions);

    return {
      providerCallId: mockVapiCallId,
      status: 'queued',
      rawResponse: mockCallData,
    };
  }

  /**
   * Simulate realistic call lifecycle status transitions & webhook events
   */
  simulateCallLifecycle(mockVapiCallId, contactName, purpose, customInstructions) {
    const { processVapiWebhook } = require('../webhookService');

    // 1. Transition to "calling" after 2s
    setTimeout(async () => {
      console.log(`[MockVoiceProvider] Simulating status: calling for ${mockVapiCallId}`);
      await processVapiWebhook({
        message: {
          type: 'call-status-update',
          status: 'calling',
          call: { id: mockVapiCallId, status: 'calling' },
        },
      });
    }, 2000);

    // 2. Transition to "in-progress" after 5s
    setTimeout(async () => {
      console.log(`[MockVoiceProvider] Simulating status: in-progress for ${mockVapiCallId}`);
      await processVapiWebhook({
        message: {
          type: 'call-status-update',
          status: 'in-progress',
          call: { id: mockVapiCallId, status: 'in-progress' },
        },
      });
    }, 5000);

    // 3. Complete call with realistic transcript & duration after 10s
    setTimeout(async () => {
      console.log(`[MockVoiceProvider] Simulating status: completed & sending transcript for ${mockVapiCallId}`);
      
      const sampleTranscript = `AI: Hello ${contactName || 'there'}! I'm calling regarding your recent experience with our service for ${purpose || 'customer feedback'}. Do you have 30 seconds to share how everything went?\nCUSTOMER: Yes, sure! Everything was great. The service was prompt and the team was super helpful.\nAI: That's wonderful to hear! ${customInstructions ? 'Just following up: ' + customInstructions : 'Thank you so much for your feedback and have a fantastic day!'}\nCUSTOMER: Thanks, you too! Goodbye.`;

      await processVapiWebhook({
        message: {
          type: 'end-of-call-report',
          status: 'completed',
          transcript: sampleTranscript,
          duration: 45,
          recordingUrl: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
          call: {
            id: mockVapiCallId,
            status: 'completed',
            duration: 45,
          },
          artifact: {
            transcript: sampleTranscript,
            recordingUrl: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
          },
        },
      });
    }, 10000);
  }

  async getCall(callId) {
    return this.mockCalls.get(callId) || { id: callId, status: 'completed' };
  }

  async handleWebhook(payload) {
    const message = payload.message || payload;
    const call = message.call || payload.call || {};
    const vapiCallId = call.id || payload.vapiCallId || message.callId;

    return {
      vapiCallId,
      eventType: message.type || payload.type || 'call-status-update',
      status: message.status || call.status || 'completed',
      transcript: message.transcript || message.artifact?.transcript || '',
      recordingUrl: message.recordingUrl || message.artifact?.recordingUrl || '',
      duration: message.duration || 45,
      rawPayload: payload,
    };
  }

  async endCall(callId) {
    console.log(`[MockVoiceProvider] Ended mock call ${callId}`);
    return true;
  }
}

module.exports = MockVoiceProvider;
