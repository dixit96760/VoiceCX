const express = require('express');
const router = express.Router();
const { analyzeTranscript, analyzeFeedbackById, getFeedbackAnalysis } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const { validate, analyzeTranscriptSchema } = require('../middleware/validationMiddleware');

router.post('/analyze-transcript', protect, validate(analyzeTranscriptSchema), analyzeTranscript);
router.post('/analyze/:feedbackId', protect, analyzeFeedbackById);
router.get('/analysis/:feedbackId', protect, getFeedbackAnalysis);

module.exports = router;
