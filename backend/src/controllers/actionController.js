const Action = require('../models/Action');
const actionEngine = require('../services/actionEngine');

exports.getActions = async (req, res) => {
    try {
        const actions = await Action.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(actions || []);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.generateActions = async (req, res) => {
    try {
        const newActions = await actionEngine.generateActions(req.user._id);
        res.json(newActions || []);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
