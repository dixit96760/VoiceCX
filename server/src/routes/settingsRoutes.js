const express = require('express');
const router = express.Router();
const { getSettings, updateCallingSettings } = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');
const { validate, updateCallingSettingsSchema } = require('../middleware/validationMiddleware');

router.get('/', protect, getSettings);
router.put('/calling', protect, validate(updateCallingSettingsSchema), updateCallingSettings);

module.exports = router;
