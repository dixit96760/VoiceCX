const Insight = require('../models/Insight');
const insightEngine = require('../services/insightEngine');

exports.getInsights = async (req, res) => {
    try {
        const insights = await Insight.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(insights || []);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.generateInsights = async (req, res) => {
    try {
        const newInsights = await insightEngine.generateInsights(req.user._id);
        res.json(newInsights || []);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
