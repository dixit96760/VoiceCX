const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
    },
    lastVisit: {
      type: Date,
      default: Date.now,
    },
    feedbackCount: {
      type: Number,
      default: 0,
    },
    lastSentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative', 'unknown'],
      default: 'unknown',
    },
    lastRating: {
      type: Number,
      default: 5,
    },
    totalRatingSum: {
      type: Number,
      default: 5,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);
