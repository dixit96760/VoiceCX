const mongoose = require('mongoose');

const anomalySchema = new mongoose.Schema({
    metric: { type: String, required: true },
    currentValue: { type: Number, required: true },
    expectedValue: { type: Number, required: true },
    deviation: { type: Number, required: true },
    severity: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    detectedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Anomaly', anomalySchema);
