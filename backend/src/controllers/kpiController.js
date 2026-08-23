const kpiEngine = require('../services/kpiEngine');

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
