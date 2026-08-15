const express = require('express');
const router = express.Router();
const actionController = require('../controllers/actionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', actionController.getActions);
router.post('/generate', actionController.generateActions);

module.exports = router;
