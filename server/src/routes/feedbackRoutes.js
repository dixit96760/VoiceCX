const express = require('express');
const router = express.Router();
const {
  createFeedback,
  getFeedbackList,
  getFeedbackById,
  updateFeedback,
  deleteFeedback,
  updateNotes,
} = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');
const {
  validate,
  createFeedbackSchema,
  updateFeedbackSchema,
  feedbackNotesSchema,
} = require('../middleware/validationMiddleware');

router.post('/', protect, validate(createFeedbackSchema), createFeedback);
router.get('/', protect, getFeedbackList);
router.get('/:id', protect, getFeedbackById);
router.put('/:id', protect, validate(updateFeedbackSchema), updateFeedback);
router.delete('/:id', protect, deleteFeedback);

router.post('/:id/notes', protect, validate(feedbackNotesSchema), updateNotes);

module.exports = router;
