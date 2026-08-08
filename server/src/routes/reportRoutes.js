const express = require('express');
const router = express.Router();
const { exportFeedbackCsv } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/export', protect, exportFeedbackCsv);

module.exports = router;
