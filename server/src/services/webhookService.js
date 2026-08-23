
/**
 * Idempotent Webhook Processor for Telephony Provider events
 * @param {Object} payload - Raw webhook request body
 * @param {Object} [headers] - Request headers for signature validation
 */
async function processVapiWebhook(payload, headers) {
  try {
    const message = payload.message || payload;
    const call = message.call || {};
    const vapiCallId = call.id || payload.vapiCallId || payload.CallSid || payload.call_id;
    const status = message.status || payload.status || (payload.CallStatus ? (payload.CallStatus === 'completed' ? 'completed' : 'in-progress') : 'completed');
    const transcript = message.transcript || payload.transcript || [];
    const recordingUrl = message.artifact?.stereoRecordingUrl || payload.recordingUrl || payload.RecordingUrl;
    const duration = message.durationSeconds || payload.duration;
    const eventType = message.type || payload.eventType || 'call-update';

    if (!vapiCallId) {
      console.warn('[webhookService] Received webhook payload without vapiCallId:', payload);
      return { success: false, message: 'Missing vapiCallId' };
    }

    // Idempotency Key Check
    const idempotencyKey = `${vapiCallId}:${eventType}:${status}:${(transcript || '').length}`;
    if (processedEvents.has(idempotencyKey)) {
      console.log(`[webhookService Idempotency] Skipping duplicate webhook event: ${idempotencyKey}`);
      return { success: true, message: 'Duplicate event skipped' };
    }
    processedEvents.add(idempotencyKey);

    // Keep memory set bounded
    if (processedEvents.size > 5000) {
      const firstItem = processedEvents.values().next().value;
      processedEvents.delete(firstItem);
    }

    const isDb = getIsConnected();

    if (isDb) {
      let callDoc = await Call.findOne({
        $or: [{ vapiCallId }, { twilioCallSid: vapiCallId }],
      });
      
      if (!callDoc) {
        callDoc = await Call.findOne({ status: { $in: ['queued', 'calling', 'in-progress'] } }).sort({ createdAt: -1 });
        if (callDoc) {
          if (!callDoc.vapiCallId) callDoc.vapiCallId = vapiCallId;
          if (!callDoc.twilioCallSid) callDoc.twilioCallSid = vapiCallId;
        }
      }

      if (!callDoc) {
        console.warn(`[webhookService] Call record not found for ID: ${vapiCallId}. Creating fallback call entry.`);
        callDoc = new Call({
          vapiCallId,
          twilioCallSid: vapiCallId,
          contactName: payload.message?.call?.customer?.name || payload.CallerName || 'Valued Customer',
          phoneNumber: payload.message?.call?.customer?.number || payload.From || payload.To || '+15550000000',
          purpose: 'Outbound AI Call',
          status: 'queued',
        });
      }

      // Update call status & timestamps
      if (status && status !== callDoc.status) {
        callDoc.status = status;
        if (status === 'calling' && !callDoc.startedAt) {
          callDoc.startedAt = new Date();
        } else if (status === 'in-progress' && !callDoc.startedAt) {
          callDoc.startedAt = new Date();
        } else if (status === 'completed' || status === 'failed') {
          callDoc.endedAt = new Date();
          if (!callDoc.startedAt) callDoc.startedAt = new Date(Date.now() - (duration || 30) * 1000);
        }
      }

      if (duration && duration > 0) {
        callDoc.duration = duration;
      }

      if (recordingUrl) {
        callDoc.recordingUrl = recordingUrl;
      }

      if (transcript && transcript.length > (callDoc.transcript ? JSON.stringify(callDoc.transcript).length : 0)) {
        callDoc.transcript = transcript;
      }

      await callDoc.save();

      // If call is completed and has not generated summary yet, generate AI summary
      if ((status === 'completed' || transcript) && !processedCompletedCalls.has(vapiCallId)) {
        processedCompletedCalls.add(vapiCallId);

        const summaryResult = await generateCallSummary(callDoc.transcript || transcript, {
          purpose: callDoc.purpose,
          contactName: callDoc.contactName,
        });

        callDoc.summary = summaryResult.summary;
        callDoc.outcome = summaryResult.outcome;
        callDoc.sentiment = summaryResult.sentiment;
        callDoc.nextAction = summaryResult.nextAction;
        callDoc.followUpRequired = summaryResult.followUpRequired;
        callDoc.followUpReason = summaryResult.followUpReason;
        callDoc.status = 'completed';
        if (!callDoc.endedAt) callDoc.endedAt = new Date();

        await callDoc.save();


      }

      return { success: true, callId: callDoc._id, status: callDoc.status };
    } else {
      console.log(`[webhookService Memory Mode] Received webhook for ${vapiCallId}, status: ${status}`);
      return { success: true, vapiCallId, status };
    }
  } catch (error) {
    console.error('[webhookService Error]', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  processVapiWebhook,
};
