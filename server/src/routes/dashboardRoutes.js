const express = require('express');
const router = express.Router();
const { getDashboard, getInsights } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, getDashboard);
router.get('/insights', protect, getInsights);

module.exports = router;
