const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const auth = require('../middleware/auth');

router.get('/profile', auth, restaurantController.getProfile);
router.put('/profile', auth, restaurantController.updateProfile);
router.post('/generate-script', auth, restaurantController.generateScript);

module.exports = router;
