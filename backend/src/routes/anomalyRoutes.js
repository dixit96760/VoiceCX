const express = require('express');
const router = express.Router();
const anomalyController = require('../controllers/anomalyController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', anomalyController.getAnomalies);
router.post('/detect', anomalyController.runDetection);

module.exports = router;
