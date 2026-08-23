const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');
const { protect } = require('../middleware/authMiddleware');

// Call Management Endpoints (Protected for Multi-Tenancy)
router.post('/', protect, callController.createCall);
router.get('/', protect, callController.getCalls);
router.get('/stats', protect, callController.getDashboardStats);
router.get('/:id', protect, callController.getCallById);
router.delete('/:id', protect, callController.deleteCall);

// Automation Webhook Endpoints
router.post('/webhooks/make-feedback', callController.handleMakeFeedbackWebhook);

// Legacy routes compatibility
router.get('/analytics', protect, callController.getDashboardStats);
router.post('/simulate', protect, callController.simulateCall);
router.put('/:id/resolve', protect, callController.toggleResolveActionItem);
router.post('/twilio/call', protect, callController.createCall);

module.exports = router;
