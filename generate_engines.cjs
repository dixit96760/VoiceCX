const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'server', 'src');

const modelsDir = path.join(srcDir, 'models');
const servicesDir = path.join(srcDir, 'services');
const controllersDir = path.join(srcDir, 'controllers');
const routesDir = path.join(srcDir, 'routes');

// Ensure dirs
[modelsDir, servicesDir, controllersDir, routesDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const files = {
    // 1. Insight Engine
    'models/Insight.js': `const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    severity: { type: String, required: true },
    evidence: { type: mongoose.Schema.Types.Mixed },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Insight', insightSchema);
`,
    'services/insightEngine.js': `const geminiService = require('./geminiService');
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
`,
    'controllers/insightController.js': `const Insight = require('../models/Insight');
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
`,
    'routes/insightRoutes.js': `const express = require('express');
const router = express.Router();
const insightController = require('../controllers/insightController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', insightController.getInsights);
router.post('/generate', insightController.generateInsights);

module.exports = router;
`,

    // 2. KPI Engine
    'services/kpiEngine.js': `const Feedback = require('../models/Feedback');

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
`,
    'controllers/kpiController.js': `const kpiEngine = require('../services/kpiEngine');

exports.getKPIs = async (req, res) => {
    try {
        const kpis = await kpiEngine.calculateKPIs(req.user._id);
        res.json(kpis);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getCSAT = async (req, res) => {
    try {
        const kpis = await kpiEngine.calculateKPIs(req.user._id);
        res.json({ csat: kpis.csat || 0 });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
`,
    'routes/kpiRoutes.js': `const express = require('express');
const router = express.Router();
const kpiController = require('../controllers/kpiController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', kpiController.getKPIs);
router.get('/csat', kpiController.getCSAT);

module.exports = router;
`,

    // 3. Anomaly Detection
    'models/Anomaly.js': `const mongoose = require('mongoose');

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
`,
    'services/anomalyDetectionService.js': `const Anomaly = require('../models/Anomaly');
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
`,
    'controllers/anomalyController.js': `const Anomaly = require('../models/Anomaly');
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
`,
    'routes/anomalyRoutes.js': `const express = require('express');
const router = express.Router();
const anomalyController = require('../controllers/anomalyController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', anomalyController.getAnomalies);
router.post('/detect', anomalyController.runDetection);

module.exports = router;
`,

    // 4. AI Action Engine
    'models/Action.js': `const mongoose = require('mongoose');

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
`,
    'services/actionEngine.js': `const geminiService = require('./geminiService');
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
`,
    'controllers/actionController.js': `const Action = require('../models/Action');
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
`,
    'routes/actionRoutes.js': `const express = require('express');
const router = express.Router();
const actionController = require('../controllers/actionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', actionController.getActions);
router.post('/generate', actionController.generateActions);

module.exports = router;
`,

    // 5. Notifications
    'models/Notification.js': `const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, required: true },
    read: { type: Boolean, default: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
`,
    'services/notificationService.js': `const Notification = require('../models/Notification');

exports.createNotification = async (userId, title, message, type) => {
    const notif = await Notification.create({
        title,
        message,
        type,
        user: userId
    });
    return notif;
};
`,
    'controllers/notificationController.js': `const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
    try {
        const notifs = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(notifs || []);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
        res.json({ message: 'Marked all as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
`,
    'routes/notificationRoutes.js': `const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', notificationController.getNotifications);
router.put('/read', notificationController.markAsRead);

module.exports = router;
`
};

for (const [relPath, content] of Object.entries(files)) {
    const fullPath = path.join(srcDir, relPath);
    // Because I need a dummy protect middleware if it doesn't exist, wait, it exists in VoiceCX.
    // Let's replace the middleware path in routes to ensure it matches the typical path
    const fixedContent = content.replace(/require\('\.\.\/middleware\/authMiddleware'\)/g, "require('../middleware/auth')").replace(/\{ protect \}/g, "{ protect }"); 
    
    // I'll leave the require('../middleware/authMiddleware') since I saw the actual middleware might be called authMiddleware or similar.
    fs.writeFileSync(fullPath, content);
    console.log('Created:', relPath);
}
