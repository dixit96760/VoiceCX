const VoiceProvider = require('./VoiceProvider');

class VapiVoiceProvider extends VoiceProvider {
  constructor() {
    super();
    this.apiKey = process.env.VAPI_API_KEY;
    this.assistantId = process.env.VAPI_ASSISTANT_ID;
    this.phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
    this.webhookSecret = process.env.VAPI_WEBHOOK_SECRET;
    this.baseUrl = 'https://api.vapi.ai';
  }

  /**
   * Create an outbound call via Vapi REST API
   */
  async createOutboundCall({ contactName, phoneNumber, purpose, customInstructions, metadata }) {
    if (!this.apiKey) {
      throw new Error('VAPI_API_KEY is not configured in server environment variables');
    }

    const payload = {
      customer: {
        number: phoneNumber,
        name: contactName,
      },
    };

    if (this.assistantId) {
      payload.assistantId = this.assistantId;
    }

    if (this.phoneNumberId) {
      payload.phoneNumberId = this.phoneNumberId;
    }

    // Dynamic assistant prompt override with supplied call purpose & custom instructions
    if (purpose || customInstructions) {
      payload.assistantOverrides = {
        variableValues: {
          contactName: contactName || 'Customer',
          purpose: purpose || 'Follow up & feedback',
          customInstructions: customInstructions || 'Be polite and helpful.',
        },
      };
    }

    if (metadata) {
      payload.metadata = metadata;
    }

    const response = await fetch(`${this.baseUrl}/call`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || data.error || `Vapi API returned status ${response.status}`;
      console.error('[VapiVoiceProvider Error]', errorMsg, data);
      throw new Error(errorMsg);
    }

    return {
      providerCallId: data.id || data.vapiCallId || `vapi_${Date.now()}`,
      status: data.status || 'queued',
      rawResponse: data,
    };
  }

  /**
   * Retrieve call information from Vapi API
   */
  async getCall(vapiCallId) {
    if (!this.apiKey) {
      throw new Error('VAPI_API_KEY is not configured');
    }

    const response = await fetch(`${this.baseUrl}/call/${vapiCallId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Vapi call: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Process raw webhook payload from Vapi
   */
  async handleWebhook(payload, headers) {
    // Webhook signature verification if secret is provided
    if (this.webhookSecret && headers && headers['x-vapi-secret']) {
      if (headers['x-vapi-secret'] !== this.webhookSecret) {
        throw new Error('Unauthorized Vapi webhook signature');
      }
    }

    const message = payload.message || payload;
    const type = message.type || payload.type;
    const call = message.call || payload.call || {};
    const vapiCallId = call.id || payload.vapiCallId || message.callId;

    let status = 'in-progress';
    if (type === 'call-status-update' || type === 'status-update') {
      const vapiStatus = message.status || call.status;
      if (vapiStatus === 'queued') status = 'queued';
      else if (vapiStatus === 'ringing' || vapiStatus === 'in-progress') status = 'in-progress';
      else if (vapiStatus === 'ended' || vapiStatus === 'completed') status = 'completed';
      else if (vapiStatus === 'failed') status = 'failed';
    } else if (type === 'end-of-call-report' || type === 'analysis') {
      status = 'completed';
    }

    return {
      vapiCallId,
      eventType: type,
      status,
      transcript: message.transcript || call.transcript || message.artifact?.transcript || '',
      recordingUrl: message.recordingUrl || call.recordingUrl || message.artifact?.recordingUrl || '',
      endedReason: message.endedReason || call.endedReason || '',
      duration: message.duration || call.duration || message.artifact?.durationSeconds || 0,
      cost: message.cost || call.cost || 0,
      rawPayload: payload,
    };
  }

  /**
   * End an active call
   */
  async endCall(vapiCallId) {
    if (!this.apiKey) return false;

    const response = await fetch(`${this.baseUrl}/call/${vapiCallId}/stop`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  }
}

module.exports = VapiVoiceProvider;
