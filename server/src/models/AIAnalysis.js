const mongoose = require('mongoose');

const aiAnalysisSchema = new mongoose.Schema(
  {
    feedbackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Feedback',
      required: [true, 'feedbackId is required'],
      unique: true,
      index: true,
    },
    sentiment: {
      type: String,
      required: [true, 'sentiment is required'],
      enum: {
        values: ['positive', 'neutral', 'negative'],
        message: 'sentiment must be one of: positive, neutral, negative',
      },
    },
    sentimentScore: {
      type: Number,
      required: [true, 'sentimentScore is required'],
      min: [0, 'sentimentScore must be at least 0'],
      max: [1, 'sentimentScore must be at most 1'],
    },
    category: {
      type: String,
      required: [true, 'category is required'],
      trim: true,
    },
    emotion: {
      type: String,
      required: [true, 'emotion is required'],
      trim: true,
    },
    urgency: {
      type: String,
      required: [true, 'urgency is required'],
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'urgency must be one of: low, medium, high',
      },
    },
    summary: {
      type: String,
      required: [true, 'summary is required'],
      trim: true,
    },
    topics: [
      {
        type: String,
        trim: true,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AIAnalysis', aiAnalysisSchema);
