const Setting = require('../models/Setting');
const { getIsConnected } = require('../config/db');

let memorySettings = {
  callingSchedule: {
    startTime: '10:00',
    endTime: '20:00',
    timezone: 'Asia/Kolkata',
    activeDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  },
  autoFeedbackEnabled: true,
};

// @desc    Get calling schedule settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
  try {
    const isDb = getIsConnected();
    if (!isDb) {
      return res.json({ success: true, data: memorySettings });
    }
    let settings = await Setting.findOne({ user: req.user._id });

    if (!settings) {
      settings = await Setting.create({
        user: req.user._id,
        callingSchedule: {
          startTime: '09:00',
          endTime: '20:00',
          timezone: 'America/New_York',
        },
      });
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update calling schedule settings
// @route   PUT /api/settings/calling
// @access  Private
const updateCallingSettings = async (req, res) => {
  try {
    const isDb = getIsConnected();
    const { startTime, endTime, timezone, activeDays, autoFeedbackEnabled } = req.body;

    if (!isDb) {
      if (startTime) memorySettings.callingSchedule.startTime = startTime;
      if (endTime) memorySettings.callingSchedule.endTime = endTime;
      if (timezone) memorySettings.callingSchedule.timezone = timezone;
      if (activeDays) memorySettings.callingSchedule.activeDays = activeDays;
      if (typeof autoFeedbackEnabled === 'boolean') memorySettings.autoFeedbackEnabled = autoFeedbackEnabled;

      return res.json({
        success: true,
        message: 'Calling schedule settings updated successfully',
        data: memorySettings,
      });
    }

    let settings = await Setting.findOne({ user: req.user._id });

    if (!settings) {
      settings = new Setting({ user: req.user._id });
    }

    if (!settings.callingSchedule) {
      settings.callingSchedule = {};
    }

    if (startTime) settings.callingSchedule.startTime = startTime;
    if (endTime) settings.callingSchedule.endTime = endTime;
    if (timezone) settings.callingSchedule.timezone = timezone;
    if (activeDays) settings.callingSchedule.activeDays = activeDays;

    if (typeof autoFeedbackEnabled === 'boolean') {
      settings.autoFeedbackEnabled = autoFeedbackEnabled;
    }

    await settings.save();

    res.json({
      success: true,
      message: 'Calling schedule settings updated successfully',
      data: settings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSettings,
  updateCallingSettings,
};
