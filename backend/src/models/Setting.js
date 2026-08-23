const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    callingSchedule: {
      startTime: {
        type: String,
        default: '09:00',
      },
      endTime: {
        type: String,
        default: '20:00',
      },
      timezone: {
        type: String,
        default: 'America/New_York',
      },
      activeDays: {
        type: [String],
        default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      },
    },
    autoFeedbackEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Setting', settingSchema);
