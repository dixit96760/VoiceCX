const Notification = require('../models/Notification');

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
