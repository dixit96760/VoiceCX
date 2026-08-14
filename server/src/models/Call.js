const mongoose = require('mongoose');

const callSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    vapiCallId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    twilioCallSid: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    contactName: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
      default: 'Valued Customer',
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true,
    },
    purpose: {
      type: String,
      default: 'Customer Feedback & Inquiry',
    },
    customInstructions: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['queued', 'calling', 'in-progress', 'completed', 'failed'],
      default: 'queued',
      index: true,
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    duration: {
      type: Number,
      default: 0,
    },
    transcript: {
      type: mongoose.Schema.Types.Mixed,
      default: '',
    },
    summary: {
      type: String,
      default: '',
    },
    outcome: {
      type: String,
      enum: ['positive', 'negative', 'interested', 'not_interested', 'callback_requested', 'completed', 'unknown'],
      default: 'unknown',
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral',
    },
    nextAction: {
      type: String,
      default: '',
    },
    followUpRequired: {
      type: Boolean,
      default: false,
    },
    followUpReason: {
      type: String,
      default: '',
    },
    recordingUrl: {
      type: String,
      default: '',
    },
    errorMessage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
callSchema.index({ createdAt: -1 });
callSchema.index({ status: 1, createdAt: -1 });
callSchema.index({ phoneNumber: 1, status: 1 });

module.exports = mongoose.model('Call', callSchema);
