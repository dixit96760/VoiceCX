const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Customer = require('./models/Customer');
const Feedback = require('./models/Feedback');
const Setting = require('./models/Setting');
const DoNotCall = require('./models/DoNotCall');
const CustomerCallLog = require('./models/CustomerCallLog');

const { connectDB } = require('./config/db');

const seedData = async () => {
  try {
    await connectDB();
    console.log('[Seed] Connected to MongoDB database...');

    // Clear all existing sample data from collections
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Feedback.deleteMany({});
    await Setting.deleteMany({});
    await DoNotCall.deleteMany({});
    await CustomerCallLog.deleteMany({});

    console.log('[Seed] Cleared all sample data from MongoDB database.');

    // Create Clean Default Demo Owner Account
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const owner = await User.create({
      name: 'Chef Sarah Jenkins',
      email: 'owner@y6bistro.com',
      password: hashedPassword,
      restaurantName: 'Y6 Gourmet Bistro',
      phone: '+1 (555) 234-5678',
    });

    console.log(`[Seed] Created Clean User Owner: ${owner.email}`);

    // Create Default Settings
    await Setting.create({
      user: owner._id,
      callingSchedule: {
        startTime: '10:00',
        endTime: '21:00',
        timezone: 'America/New_York',
        activeDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      },
      autoFeedbackEnabled: true,
    });

    console.log('[Seed] Clean database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedData();
