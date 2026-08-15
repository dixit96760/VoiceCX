const Anomaly = require('../models/Anomaly');
const kpiEngine = require('./kpiEngine');

exports.detectAnomalies = async (userId) => {
    const currentKPIs = await kpiEngine.calculateKPIs(userId);
    // In a real app, compare with historical data.
    // For now, simple mock comparison:
    
    if (currentKPIs.totalFeedback === 0) return [];
    
    const expectedCSAT = 80;
    const anomalies = [];
    
    if (currentKPIs.csat < expectedCSAT - 10) {
        const deviation = expectedCSAT - currentKPIs.csat;
        const newAnomaly = await Anomaly.create({
            metric: 'CSAT',
            currentValue: currentKPIs.csat,
            expectedValue: expectedCSAT,
            deviation,
            severity: deviation > 20 ? 'High' : 'Medium',
            user: userId
        });
        anomalies.push(newAnomaly);
    }
    
    return anomalies;
};
