const DoNotCall = require('../models/DoNotCall');
const { getIsConnected } = require('../config/db');

let memoryDncList = [
  { _id: 'dnc_1', phoneNumber: '+1 (555) 999-0000', reason: 'Customer requested do not call during survey call', addedAt: new Date() },
  { _id: 'dnc_2', phoneNumber: '+91 8888888888', reason: 'Opted out via SMS', addedAt: new Date() },
];

// @desc    Get list of blocked DNC phone numbers
// @route   GET /api/do-not-call
// @access  Private
const getDncList = async (req, res) => {
  try {
    const isDb = getIsConnected();
    if (!isDb) {
      return res.json({ success: true, count: memoryDncList.length, data: memoryDncList });
    }
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
    const isDb = getIsConnected();
    const { phoneNumber, reason } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    if (!isDb) {
      const existing = memoryDncList.find(item => item.phoneNumber === phoneNumber);
      if (existing) {
        return res.status(400).json({ success: false, message: 'Phone number is already on the DNC list' });
      }
      const newEntry = {
        _id: 'dnc_' + Date.now(),
        phoneNumber,
        reason: reason || 'Customer requested opt-out',
        addedAt: new Date(),
      };
      memoryDncList.unshift(newEntry);
      return res.status(201).json({ success: true, message: 'Phone number added to DNC list successfully', data: newEntry });
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
    const isDb = getIsConnected();
    const { id } = req.params;

    if (!isDb) {
      const index = memoryDncList.findIndex(item => item._id === id || item.phoneNumber === id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'DNC record not found' });
      }
      const removed = memoryDncList.splice(index, 1)[0];
      return res.json({ success: true, message: 'Phone number removed from DNC list successfully', data: removed });
    }

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
