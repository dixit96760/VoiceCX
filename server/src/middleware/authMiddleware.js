const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getIsConnected } = require('../config/db');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  const isDb = getIsConnected();

  if (!isDb || !token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_restaurant_voice_agent_key_2026';
    const decoded = jwt.verify(token, jwtSecret);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    } else {
      req.user = user;
      req.user.id = user._id;
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

module.exports = { protect, auth: protect };
