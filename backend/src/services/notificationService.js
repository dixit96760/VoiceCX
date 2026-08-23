const Notification = require('../models/Notification');

exports.createNotification = async (userId, title, message, type) => {
    const notif = await Notification.create({
        title,
        message,
        type,
        user: userId
    });
    return notif;
};
