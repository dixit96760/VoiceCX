const express = require('express');
const router = express.Router();
const { analyzeTranscript } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const { validate, analyzeTranscriptSchema } = require('../middleware/validationMiddleware');

router.post('/analyze-transcript', protect, validate(analyzeTranscriptSchema), analyzeTranscript);

module.exports = router;
