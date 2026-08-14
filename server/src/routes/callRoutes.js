const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');

// Call Management Endpoints
router.post('/', callController.createCall);
router.get('/', callController.getCalls);
router.get('/stats', callController.getDashboardStats);
router.get('/:id', callController.getCallById);
router.delete('/:id', callController.deleteCall);

// Telephony Webhooks Endpoints
router.post('/webhooks/vapi', callController.handleVapiWebhook);
router.post('/vapi/webhook', callController.handleVapiWebhook);
router.post('/webhooks/twilio/status', callController.handleTwilioStatusWebhook);
router.post('/webhooks/twilio/voice', callController.handleTwilioVoiceWebhook);
router.post('/webhooks/twilio/gather', callController.handleTwilioGatherWebhook);
router.get('/webhooks/twilio/gather', callController.handleTwilioGatherWebhook);

// Legacy routes compatibility
router.get('/analytics', callController.getDashboardStats);
router.post('/simulate', callController.simulateCall);
router.put('/:id/resolve', callController.toggleResolveActionItem);
router.post('/twilio/webhook', callController.handleVapiWebhook);
router.post('/twilio/call', callController.createCall);

module.exports = router;
