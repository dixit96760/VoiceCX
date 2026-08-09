const Customer = require('../models/Customer');
const Feedback = require('../models/Feedback');
const { getIsConnected } = require('../config/db');

const MEMORY_CUSTOMERS = [
  { _id: 'c1', id: 'c1', name: 'Michael Scott', phone: '+1 (555) 301-4455', lastVisit: new Date(Date.now() - 86400000 * 2), feedbackCount: 2, lastSentiment: 'positive', lastRating: 5 },
  { _id: 'c2', id: 'c2', name: 'Pam Beesly', phone: '+1 (555) 301-6677', lastVisit: new Date(Date.now() - 86400000 * 5), feedbackCount: 1, lastSentiment: 'negative', lastRating: 2 },
  { _id: 'c3', id: 'c3', name: 'Jim Halpert', phone: '+1 (555) 301-8899', lastVisit: new Date(Date.now() - 86400000 * 1), feedbackCount: 1, lastSentiment: 'positive', lastRating: 5 },
];

// @desc    Get customer profiles
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res) => {
  try {
    const isDb = getIsConnected();
    const userId = req.user._id;

    if (!isDb) {
      return res.json({ success: true, count: MEMORY_CUSTOMERS.length, data: MEMORY_CUSTOMERS });
    }

    // Fetch all customers for this user
    let customers = await Customer.find({ user: userId }).sort({ lastVisit: -1 });

    // If no customer collection documents exist yet, dynamically extract distinct customers from Feedbacks
    if (customers.length === 0) {
      const feedbacks = await Feedback.find({ user: userId }).sort({ date: -1 });
      const customerMap = {};

      feedbacks.forEach((f) => {
        const phoneKey = f.customerPhone;
        if (!customerMap[phoneKey]) {
          customerMap[phoneKey] = {
            name: f.customerName || 'Guest Customer',
            phone: f.customerPhone,
            email: '',
            lastVisit: f.date || f.createdAt,
            feedbackCount: 0,
            lastSentiment: f.sentiment,
            lastRating: f.rating,
            totalRatingSum: 0,
          };
        }
        customerMap[phoneKey].feedbackCount += 1;
        customerMap[phoneKey].totalRatingSum += f.rating || 0;
      });

      customers = Object.values(customerMap).map((c) => ({
        ...c,
        averageRating: parseFloat((c.totalRatingSum / c.feedbackCount).toFixed(1)),
      }));
    }

    res.json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get individual customer history and rating trends
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res) => {
  try {
    const isDb = getIsConnected();
    const userId = req.user._id;
    const { id } = req.params;

    if (!isDb) {
      const c = MEMORY_CUSTOMERS.find(cust => cust._id === id || cust.phone === id);
      return res.json({
        success: true,
        data: {
          customer: c || { phone: id, name: 'Guest Customer', feedbackCount: 1 },
          feedbackHistory: [],
          ratingTrends: [],
        },
      });
    }

    let customer = await Customer.findOne({ _id: id, user: userId });

    let customerPhone = customer ? customer.phone : null;

    if (!customer) {
      // Check if ID was passed as a phone number string or if customer exists by phone
      customer = await Customer.findOne({ phone: id, user: userId });
      if (customer) {
        customerPhone = customer.phone;
      } else {
        // Look up by feedback entry
        const sampleFeedback = await Feedback.findOne({
          $or: [{ customerPhone: id }, { customerName: id }],
          user: userId,
        });
        if (sampleFeedback) {
          customerPhone = sampleFeedback.customerPhone;
        }
      }
    }

    if (!customer && !customerPhone) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Fetch customer's full feedback history
    const feedbackHistory = await Feedback.find({
      user: userId,
      ...(customer ? { $or: [{ customer: customer._id }, { customerPhone: customer.phone }] } : { customerPhone }),
    }).sort({ date: -1 });

    // Calculate rating trend timeline
    const ratingTrends = feedbackHistory.map((f) => ({
      date: f.date || f.createdAt,
      rating: f.rating,
      sentiment: f.sentiment,
      summary: f.summary,
    }));

    res.json({
      success: true,
      data: {
        customer: customer || {
          phone: customerPhone,
          name: feedbackHistory[0]?.customerName || 'Guest Customer',
          feedbackCount: feedbackHistory.length,
        },
        feedbackHistory,
        ratingTrends,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add new customer with full details & initial feedback
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res) => {
  try {
    const isDb = getIsConnected();
    const userId = req.user._id;
    const { name, phone, email, itemsOrdered, rating, notes, visitDate } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone number are required' });
    }

    const numRating = Number(rating) || 5;
    const sentiment = numRating >= 4 ? 'positive' : (numRating === 3 ? 'neutral' : 'negative');
    const dateOfVisit = visitDate ? new Date(visitDate) : new Date();

    const summaryText = itemsOrdered 
      ? `Ordered: ${itemsOrdered}. ${notes || 'No extra notes.'}`
      : (notes || 'Customer details added manually.');

    if (!isDb) {
      const newCustomer = {
        _id: 'c_' + Date.now(),
        id: 'c_' + Date.now(),
        name,
        phone,
        email: email || '',
        lastVisit: dateOfVisit,
        feedbackCount: 1,
        lastSentiment: sentiment,
        lastRating: numRating,
        itemsOrdered: itemsOrdered || '',
      };
      MEMORY_CUSTOMERS.unshift(newCustomer);
      return res.status(201).json({
        success: true,
        message: 'Customer added successfully',
        data: newCustomer,
      });
    }

    let customer = await Customer.findOne({ phone, user: userId });
    if (!customer) {
      customer = await Customer.create({
        user: userId,
        name,
        phone,
        email: email || '',
        lastVisit: dateOfVisit,
        feedbackCount: 1,
        lastSentiment: sentiment,
        lastRating: numRating,
        totalRatingSum: numRating,
      });
    } else {
      customer.name = name || customer.name;
      if (email) customer.email = email;
      customer.lastVisit = dateOfVisit;
      customer.feedbackCount += 1;
      customer.lastSentiment = sentiment;
      customer.lastRating = numRating;
      customer.totalRatingSum += numRating;
      await customer.save();
    }

    const feedback = await Feedback.create({
      user: userId,
      customer: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone,
      rating: numRating,
      sentiment,
      status: 'reviewed',
      summary: summaryText,
      transcript: [
        { speaker: 'Agent', text: `Customer ${customer.name} visited on ${dateOfVisit.toLocaleDateString()}.` },
        { speaker: 'Customer', text: itemsOrdered ? `Ordered items: ${itemsOrdered}. ${notes || ''}` : notes || 'Great visit!' }
      ],
      categoryRatings: { food: numRating, service: numRating, ambience: numRating, value: numRating },
      audioUrl: '',
      audioStatus: 'none',
      ownerNotes: notes || '',
      praises: itemsOrdered ? [itemsOrdered] : [],
      topIssues: numRating <= 2 ? ['Customer dissatisfaction'] : [],
      date: dateOfVisit,
    });

    res.status(201).json({
      success: true,
      message: 'Customer added successfully',
      data: {
        customer,
        feedback,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
};
