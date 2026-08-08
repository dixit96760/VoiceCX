const express = require('express');
const router = express.Router();
const { getFeedbackList, getFeedbackById, updateNotes } = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');
const { validate, feedbackNotesSchema } = require('../middleware/validationMiddleware');

router.get('/', protect, getFeedbackList);
router.get('/:id', protect, getFeedbackById);
router.post('/:id/notes', protect, validate(feedbackNotesSchema), updateNotes);

module.exports = router;
