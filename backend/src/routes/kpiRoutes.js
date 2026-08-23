const express = require('express');
const router = express.Router();
const kpiController = require('../controllers/kpiController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', kpiController.getKPIs);
router.get('/csat', kpiController.getCSAT);

module.exports = router;
