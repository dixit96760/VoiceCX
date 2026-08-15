const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    reason: { type: String, required: true },
    priority: { type: String, required: true },
    relatedInsight: { type: mongoose.Schema.Types.ObjectId, ref: 'Insight' },
    status: { type: String, default: 'Pending' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Action', actionSchema);
