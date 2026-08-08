const express = require('express');
const router = express.Router();
const { getCustomers, getCustomerById } = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getCustomers);
router.get('/:id', protect, getCustomerById);

module.exports = router;
