const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      index: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    customerName: {
      type: String,
      default: 'Anonymous Guest',
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      index: true,
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral',
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'action_required'],
      default: 'pending',
      index: true,
    },
    summary: {
      type: String,
      default: '',
    },
    transcript: {
      type: mongoose.Schema.Types.Mixed, // String or Array of transcript lines
      default: '',
    },
    categoryRatings: {
      food: { type: Number, default: 0 },
      service: { type: Number, default: 0 },
      ambience: { type: Number, default: 0 },
      value: { type: Number, default: 0 },
    },
    audioUrl: {
      type: String,
      default: '',
    },
    audioStatus: {
      type: String,
      enum: ['available', 'processing', 'none'],
      default: 'none',
    },
    ownerNotes: {
      type: String,
      default: '',
    },
    topIssues: [
      {
        type: String,
      },
    ],
    praises: [
      {
        type: String,
      },
    ],
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
