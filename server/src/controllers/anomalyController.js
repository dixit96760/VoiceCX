const Anomaly = require('../models/Anomaly');
const anomalyDetectionService = require('../services/anomalyDetectionService');

exports.getAnomalies = async (req, res) => {
    try {
        const anomalies = await Anomaly.find({ user: req.user._id }).sort({ detectedAt: -1 });
        res.json(anomalies || []);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.runDetection = async (req, res) => {
    try {
        const newAnomalies = await anomalyDetectionService.detectAnomalies(req.user._id);
        res.json(newAnomalies || []);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
