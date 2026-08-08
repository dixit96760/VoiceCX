const DoNotCall = require('../models/DoNotCall');

// @desc    Get list of blocked DNC phone numbers
// @route   GET /api/do-not-call
// @access  Private
const getDncList = async (req, res) => {
  try {
    const dncList = await DoNotCall.find({ user: req.user._id }).sort({ addedAt: -1 });

    res.json({
      success: true,
      count: dncList.length,
      data: dncList,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add phone number to DNC list
// @route   POST /api/do-not-call
// @access  Private
const addDncNumber = async (req, res) => {
  try {
    const { phoneNumber, reason } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const existing = await DoNotCall.findOne({ user: req.user._id, phoneNumber });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Phone number is already on the DNC list' });
    }

    const dncEntry = await DoNotCall.create({
      user: req.user._id,
      phoneNumber,
      reason: reason || 'Customer requested opt-out',
    });

    res.status(201).json({
      success: true,
      message: 'Phone number added to DNC list successfully',
      data: dncEntry,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove phone number from DNC list
// @route   DELETE /api/do-not-call/:id
// @access  Private
const removeDncNumber = async (req, res) => {
  try {
    const { id } = req.params;

    const dncEntry = await DoNotCall.findOneAndDelete({
      $or: [{ _id: id }, { phoneNumber: id }],
      user: req.user._id,
    });

    if (!dncEntry) {
      return res.status(404).json({ success: false, message: 'DNC record not found' });
    }

    res.json({
      success: true,
      message: 'Phone number removed from DNC list successfully',
      data: { id: dncEntry._id, phoneNumber: dncEntry.phoneNumber },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDncList,
  addDncNumber,
  removeDncNumber,
};
