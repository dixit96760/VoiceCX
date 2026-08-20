const VoiceProvider = require('./VoiceProvider');
const twilio = require('twilio');

class TwilioVoiceProvider extends VoiceProvider {
  constructor() {
    super();
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.appUrl = (process.env.PUBLIC_BASE_URL || process.env.APP_URL || 'http://localhost:5000').replace(/\/$/, '');

    if (this.accountSid && this.authToken && this.accountSid.startsWith('AC')) {
      try {
        this.client = twilio(this.accountSid, this.authToken);
      } catch (err) {
        console.error('[TwilioVoiceProvider] Client initialization failed:', err.message);
      }
    }
  }

  /**
   * Create an outbound call via Twilio Voice API
   */
  async createOutboundCall({ contactName, phoneNumber, purpose, customInstructions, metadata }) {
    if (!this.client || !this.phoneNumber) {
      throw new Error('Twilio Voice API is not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in server/.env');
    }

    if (this.appUrl.includes('localhost') || this.appUrl.includes('127.0.0.1')) {
      throw new Error(
        `Twilio requires a public HTTPS URL for webhooks (cannot use "${this.appUrl}").\n` +
        `Solution 1 (Real Calls): Run "ngrok http 5000" in terminal and set PUBLIC_BASE_URL=https://xxxx.ngrok-free.app in server/.env.\n` +
        `Solution 2 (Sandbox Testing): Set VOICE_MODE=mock in server/.env to test without ngrok or Twilio charges.`
      );
    }

    let callbackUrl = `${this.appUrl}/api/webhooks/twilio/voice`;
    let statusCallbackUrl = `${this.appUrl}/api/webhooks/twilio/status`;

    // Twilio converts POST to GET on 301 redirects. If the user set PUBLIC_BASE_URL to http:// on Render,
    // Twilio gets redirected, hits GET, and gets 404. Force HTTPS to avoid the redirect entirely.
    if (!callbackUrl.includes('localhost') && callbackUrl.startsWith('http://')) {
      callbackUrl = callbackUrl.replace('http://', 'https://');
      statusCallbackUrl = statusCallbackUrl.replace('http://', 'https://');
    }

    const call = await this.client.calls.create({
      to: phoneNumber,
      from: this.phoneNumber,
      url: callbackUrl,
      statusCallback: statusCallbackUrl,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      record: true,
    });

    console.log(`[TwilioVoiceProvider] Outbound call created SID: ${call.sid} to ${phoneNumber} (${contactName})`);

    return {
      providerCallId: call.sid,
      status: call.status === 'queued' || call.status === 'initiated' ? 'queued' : call.status,
      rawResponse: call,
    };
  }

  /**
   * Fetch call information from Twilio Voice API
   */
  async getCall(callSid) {
    if (!this.client) throw new Error('Twilio client not initialized');
    const call = await this.client.calls(callSid).fetch();
    return {
      providerCallId: call.sid,
      status: call.status,
      duration: Number(call.duration) || 0,
      price: call.price,
    };
  }

  /**
   * Process raw webhook payload from Twilio Status Callback or Voice TwiML
   */
  async handleWebhook(payload, headers) {
    const callSid = payload.CallSid || payload.vapiCallId;
    const twilioStatus = (payload.CallStatus || 'completed').toLowerCase();

    let status = 'in-progress';
    if (twilioStatus === 'queued' || twilioStatus === 'initiated') status = 'queued';
    else if (twilioStatus === 'ringing' || twilioStatus === 'in-progress' || twilioStatus === 'answered') status = 'in-progress';
    else if (twilioStatus === 'completed') status = 'completed';
    else if (twilioStatus === 'failed' || twilioStatus === 'busy' || twilioStatus === 'no-answer' || twilioStatus === 'canceled') status = 'failed';

    return {
      vapiCallId: callSid,
      eventType: payload.EventType || 'status-update',
      status,
      transcript: payload.SpeechResult || payload.Transcript || '',
      recordingUrl: payload.RecordingUrl || '',
      duration: Number(payload.CallDuration) || Number(payload.RecordingDuration) || 0,
      rawPayload: payload,
    };
  }

  /**
   * End an active call via Twilio Voice API
   */
  async endCall(callSid) {
    if (!this.client) return false;
    await this.client.calls(callSid).update({ status: 'completed' });
    return true;
  }
}

module.exports = TwilioVoiceProvider;
