const Setting = require('../models/Setting');

// @desc    Get calling schedule settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
  try {
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
    const { startTime, endTime, timezone, activeDays, autoFeedbackEnabled } = req.body;

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
