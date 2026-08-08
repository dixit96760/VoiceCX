const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');
const auth = require('../middleware/auth');

router.get('/', auth, callController.getCallLogs);
router.get('/analytics', auth, callController.getAnalytics);
router.post('/simulate', auth, callController.simulateCall);
router.put('/:id/resolve', auth, callController.toggleResolveActionItem);

// Twilio Real Voice Call endpoints
router.post('/twilio/webhook', callController.handleTwilioVoiceWebhook);
router.post('/twilio/call', auth, callController.makeRealTwilioCall);

module.exports = router;

