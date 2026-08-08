const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

const { connectDB } = require('./config/db');
const { demoMode, twilioConfigured, geminiConfigured } = require('./config/appConfig');

const app = express();

// Connect Database
connectDB();

// Core Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api', require('./routes/dashboardRoutes')); // /api/dashboard and /api/insights
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/do-not-call', require('./routes/dncRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// Existing feature routes for compatibility
app.use('/api/restaurant', require('./routes/restaurantRoutes'));
app.use('/api/calls', require('./routes/callRoutes'));

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Y6 Restaurant Voice CX API',
    timestamp: new Date().toISOString(),
    demoMode,
    geminiConfigured,
    twilioConfigured,
  });
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Y6 Restaurant Voice CX Server Running on Port ${PORT}`);
  console.log(` Health Check API: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});
