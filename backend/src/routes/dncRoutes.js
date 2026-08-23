const express = require('express');
const router = express.Router();
const { getDncList, addDncNumber, removeDncNumber } = require('../controllers/dncController');
const { protect } = require('../middleware/authMiddleware');
const { validate, addDncSchema } = require('../middleware/validationMiddleware');

router.get('/', protect, getDncList);
router.post('/', protect, validate(addDncSchema), addDncNumber);
router.delete('/:id', protect, removeDncNumber);

module.exports = router;
