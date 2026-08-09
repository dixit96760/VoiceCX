const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Setting = require('../models/Setting');
const { getIsConnected } = require('../config/db');

const DEMO_USER = {
  _id: 'owner_demo_id_12345',
  id: 'owner_demo_id_12345',
  name: 'Chef Sarah Jenkins',
  email: 'owner@y6bistro.com',
  restaurantName: 'Y6 Gourmet Bistro',
  phone: '+1 (555) 234-5678',
};

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'super_secret_jwt_restaurant_voice_agent_key_2026';
  return jwt.sign({ id }, secret, { expiresIn: '30d' });
};

// @desc    Register new restaurant owner
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, restaurantName, phone } = req.body;
    const isDb = getIsConnected();

    if (!isDb) {
      const token = generateToken(DEMO_USER._id);
      return res.status(201).json({
        success: true,
        token,
        user: { ...DEMO_USER, name: name || DEMO_USER.name, email: email || DEMO_USER.email, restaurantName: restaurantName || DEMO_USER.restaurantName },
      });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      restaurantName: restaurantName || `${name}'s Bistro`,
      phone: phone || '+1 (555) 000-0000',
    });

    // Create initial default setting
    await Setting.create({
      user: user._id,
      callingSchedule: {
        startTime: '09:00',
        endTime: '20:00',
        timezone: 'America/New_York',
      },
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        restaurantName: user.restaurantName,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate restaurant owner & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const isDb = getIsConnected();

    if (!isDb) {
      const token = generateToken(DEMO_USER._id);
      return res.json({
        success: true,
        token,
        user: DEMO_USER,
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        restaurantName: user.restaurantName,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const isDb = getIsConnected();

    if (!isDb) {
      return res.json({
        success: true,
        user: DEMO_USER,
      });
    }

    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      user: {
        id: user ? user._id : req.user._id,
        _id: user ? user._id : req.user._id,
        name: user ? user.name : 'Chef Sarah Jenkins',
        email: user ? user.email : 'owner@y6bistro.com',
        restaurantName: user ? user.restaurantName : 'Y6 Gourmet Bistro',
        phone: user ? user.phone : '+1 (555) 234-5678',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
