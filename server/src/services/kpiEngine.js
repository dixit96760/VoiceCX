const Feedback = require('../models/Feedback');

exports.calculateKPIs = async (userId) => {
    try {
        const feedbacks = await Feedback.find({ user: userId });
        if (feedbacks.length === 0) {
            return { totalFeedback: 0, averageRating: 0, positivePercent: 0, negativePercent: 0, neutralPercent: 0, csat: 0, resolutionRate: 0 };
        }
        
        const totalFeedback = feedbacks.length;
        let sumRating = 0;
        let pos = 0, neg = 0, neu = 0;
        let resolved = 0;
        
        feedbacks.forEach(f => {
            const rating = f.rating || 0;
            sumRating += rating;
            if (rating >= 4) pos++;
            else if (rating <= 2) neg++;
            else neu++;
            
            if (f.status === 'resolved') resolved++;
        });
        
        return {
            totalFeedback,
            averageRating: sumRating / totalFeedback,
            positivePercent: (pos / totalFeedback) * 100,
            negativePercent: (neg / totalFeedback) * 100,
            neutralPercent: (neu / totalFeedback) * 100,
            csat: (pos / totalFeedback) * 100, // simplified CSAT
            resolutionRate: (resolved / totalFeedback) * 100
        };
    } catch (err) {
        return { totalFeedback: 0, averageRating: 0, positivePercent: 0, negativePercent: 0, neutralPercent: 0, csat: 0, resolutionRate: 0 };
    }
};
