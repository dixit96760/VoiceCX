const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Customer = require('./models/Customer');
const Feedback = require('./models/Feedback');
const Setting = require('./models/Setting');
const DoNotCall = require('./models/DoNotCall');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/restaurant-voice-agent';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log('[Seed] Connected to MongoDB database...');

    // Clear existing data
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Feedback.deleteMany({});
    await Setting.deleteMany({});
    await DoNotCall.deleteMany({});

    // Create Demo Owner
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const owner = await User.create({
      name: 'Chef Sarah Jenkins',
      email: 'owner@y6bistro.com',
      password: hashedPassword,
      restaurantName: 'Y6 Gourmet Bistro',
      phone: '+1 (555) 234-5678',
    });

    console.log(`[Seed] Created User Owner: ${owner.email}`);

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

    // Create Customers
    const c1 = await Customer.create({
      user: owner._id,
      name: 'Michael Scott',
      phone: '+1 (555) 301-4455',
      email: 'm.scott@example.com',
      lastVisit: new Date(Date.now() - 86400000 * 2),
      feedbackCount: 2,
      lastSentiment: 'positive',
      lastRating: 5,
      totalRatingSum: 9,
    });

    const c2 = await Customer.create({
      user: owner._id,
      name: 'Pam Beesly',
      phone: '+1 (555) 301-6677',
      email: 'pam@example.com',
      lastVisit: new Date(Date.now() - 86400000 * 5),
      feedbackCount: 1,
      lastSentiment: 'negative',
      lastRating: 2,
      totalRatingSum: 2,
    });

    const c3 = await Customer.create({
      user: owner._id,
      name: 'Jim Halpert',
      phone: '+1 (555) 301-8899',
      email: 'jim@example.com',
      lastVisit: new Date(Date.now() - 86400000 * 1),
      feedbackCount: 1,
      lastSentiment: 'positive',
      lastRating: 5,
      totalRatingSum: 5,
    });

    console.log('[Seed] Created Customers');

    // Create Feedbacks
    await Feedback.create([
      {
        user: owner._id,
        customer: c1._id,
        customerName: c1.name,
        customerPhone: c1.phone,
        rating: 5,
        sentiment: 'positive',
        status: 'reviewed',
        summary: 'Customer loved the ribeye steak and excellent table service.',
        transcript: [
          { speaker: 'Agent', text: 'Hi Michael! How was your dinner at Y6 Gourmet Bistro yesterday?' },
          { speaker: 'Customer', text: 'It was fantastic! The ribeye steak was perfectly cooked and our server was amazing.' },
        ],
        categoryRatings: { food: 5, service: 5, ambience: 4, value: 4 },
        audioUrl: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
        audioStatus: 'available',
        ownerNotes: 'Sent 10% discount voucher for next visit.',
        praises: ['Ribeye steak quality', 'Attentive service'],
        topIssues: [],
        date: new Date(Date.now() - 86400000 * 2),
      },
      {
        user: owner._id,
        customer: c2._id,
        customerName: c2.name,
        customerPhone: c2.phone,
        rating: 2,
        sentiment: 'negative',
        status: 'action_required',
        summary: 'Soup was served cold and main course had a long 35-minute delay.',
        transcript: [
          { speaker: 'Agent', text: 'Hello Pam! Thank you for dining with us. We would love your quick feedback.' },
          { speaker: 'Customer', text: 'Honestly, the soup was lukewarm and we waited 35 minutes for our main course.' },
        ],
        categoryRatings: { food: 2, service: 2, ambience: 4, value: 2 },
        audioUrl: '',
        audioStatus: 'none',
        ownerNotes: 'Need to follow up with head chef regarding kitchen timing.',
        praises: [],
        topIssues: ['Cold soup', 'Long wait time'],
        date: new Date(Date.now() - 86400000 * 5),
      },
      {
        user: owner._id,
        customer: c3._id,
        customerName: c3.name,
        customerPhone: c3.phone,
        rating: 5,
        sentiment: 'positive',
        status: 'pending',
        summary: 'Delightful atmosphere and wonderful tiramisu dessert.',
        transcript: [
          { speaker: 'Agent', text: 'Hi Jim, how was your experience at Y6 Bistro?' },
          { speaker: 'Customer', text: 'Great atmosphere and the tiramisu was incredible!' },
        ],
        categoryRatings: { food: 5, service: 5, ambience: 5, value: 5 },
        audioUrl: '',
        audioStatus: 'none',
        ownerNotes: '',
        praises: ['Tiramisu dessert', 'Great atmosphere'],
        topIssues: [],
        date: new Date(Date.now() - 86400000 * 1),
      },
    ]);

    console.log('[Seed] Created Feedbacks');

    // Create DNC list entry
    await DoNotCall.create({
      user: owner._id,
      phoneNumber: '+1 (555) 999-0000',
      reason: 'Customer requested do not call during survey call',
    });

    console.log('[Seed] Created DNC entries');
    console.log('[Seed] Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedData();
