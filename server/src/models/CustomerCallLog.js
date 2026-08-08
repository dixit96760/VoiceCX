const mongoose = require('mongoose');

const customerCallLogSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customerName: {
      type: String,
      required: true,
      default: 'Valued Customer',
    },
    customerPhone: {
      type: String,
      required: true,
    },
    callStatus: {
      type: String,
      enum: ['completed', 'in-progress', 'failed', 'no-answer'],
      default: 'completed',
    },
    durationSeconds: {
      type: Number,
      default: 45,
    },
    rawTranscript: {
      type: String,
      required: true,
    },
    sentimentScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 75,
    },
    sentimentLabel: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'positive',
    },
    feedbackCategory: {
      type: String,
      enum: ['Food Quality', 'Service', 'Ambiance', 'Pricing', 'Delivery', 'General'],
      default: 'Food Quality',
    },
    actionItems: [
      {
        type: String,
      },
    ],
    summary: {
      type: String,
      default: '',
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    callTimestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CustomerCallLog', customerCallLogSchema);
