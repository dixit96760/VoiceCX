const Customer = require('../models/Customer');
const Feedback = require('../models/Feedback');

// @desc    Get customer profiles
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res) => {
  try {
    const userId = req.user._id;

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
    const userId = req.user._id;
    const { id } = req.params;

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

module.exports = {
  getCustomers,
  getCustomerById,
};
