const geminiService = require('./geminiService');
const Feedback = require('../models/Feedback');
const Insight = require('../models/Insight');

exports.generateInsights = async (userId) => {
    // Note: Assuming Feedback model exists
    let feedbacks = [];
    try {
        feedbacks = await Feedback.find({ user: userId }).limit(100);
    } catch (err) {
        console.error('Feedback model might not exist or error occurred', err);
    }
    
    if (feedbacks.length === 0) return [];
    
    // Stub call to geminiService
    const prompt = 'Analyze this feedback...';
    let aiInsights = [];
    if (geminiService && typeof geminiService.generateText === 'function') {
        try {
            const aiResponse = await geminiService.generateText(prompt);
            aiInsights = JSON.parse(aiResponse) || [];
        } catch (e) {
            console.error('Error with geminiService', e);
        }
    }
    
    const savedInsights = [];
    for (let insight of aiInsights) {
        const newInsight = await Insight.create({
            title: insight.title || 'New Insight',
            description: insight.description || 'Description',
            category: insight.category || 'General',
            severity: insight.severity || 'Medium',
            evidence: insight.evidence || null,
            user: userId
        });
        savedInsights.push(newInsight);
    }
    return savedInsights;
};
