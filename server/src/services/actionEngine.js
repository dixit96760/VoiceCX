const geminiService = require('./geminiService');
const Action = require('../models/Action');
const Insight = require('../models/Insight');

exports.generateActions = async (userId) => {
    const insights = await Insight.find({ user: userId }).limit(10).sort({ createdAt: -1 });
    if (insights.length === 0) return [];
    
    // Stub gemini usage
    let aiActions = [];
    if (geminiService && typeof geminiService.generateText === 'function') {
        try {
            const aiResponse = await geminiService.generateText('Generate actions for these insights');
            aiActions = JSON.parse(aiResponse) || [];
        } catch (e) {
            console.error('Error generating actions', e);
        }
    }
    
    const actions = [];
    for (let ai of aiActions) {
        const action = await Action.create({
            title: ai.title || 'Recommended Action',
            reason: ai.reason || 'Based on recent data',
            priority: ai.priority || 'Medium',
            relatedInsight: insights[0]._id, // stub logic
            user: userId
        });
        actions.push(action);
    }
    return actions;
};
