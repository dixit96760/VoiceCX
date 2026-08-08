const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_restaurant_voice_agent_key_2026';
    const decoded = jwt.verify(token, jwtSecret);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      // Fallback if db is empty or demo mode user token
      req.user = { _id: decoded.id, id: decoded.id };
    } else {
      req.user = user;
      req.user.id = user._id;
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

module.exports = { protect, auth: protect };
