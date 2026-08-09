const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getIsConnected } = require('../config/db');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  const isDb = getIsConnected();

  // If running in fallback mode (MongoDB offline), automatically authenticate request
  if (!isDb) {
    req.user = {
      _id: 'owner_demo_id_12345',
      id: 'owner_demo_id_12345',
      name: 'Chef Sarah Jenkins',
      email: 'owner@y6bistro.com',
      restaurantName: 'Y6 Gourmet Bistro',
    };
    return next();
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_restaurant_voice_agent_key_2026';
    const decoded = jwt.verify(token, jwtSecret);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
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
