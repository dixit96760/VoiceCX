const express = require('express');
const router = express.Router();
const insightController = require('../controllers/insightController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', insightController.getInsights);
router.post('/generate', insightController.generateInsights);

module.exports = router;
