const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

const { connectDB } = require('./config/db');
const { demoMode, twilioConfigured, geminiConfigured } = require('./config/appConfig');
const { handleVapiWebhook, handleTwilioStatusWebhook, handleTwilioVoiceWebhook } = require('./controllers/callController');

const app = express();

// Connect Database
connectDB();

// Core Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Telephony Webhooks Endpoints
app.post('/api/webhooks/vapi', handleVapiWebhook);
app.post('/api/webhooks/twilio/status', handleTwilioStatusWebhook);
app.post('/api/webhooks/twilio/voice', handleTwilioVoiceWebhook);

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/calls', require('./routes/callRoutes'));
app.use('/api', require('./routes/dashboardRoutes')); // /api/dashboard and /api/insights
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/do-not-call', require('./routes/dncRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// Legacy feature routes for compatibility
app.use('/api/restaurant', require('./routes/restaurantRoutes'));

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'VoiceCX AI Voice Calling Platform',
    timestamp: new Date().toISOString(),
    providerMode: process.env.VOICE_MODE || process.env.VOICE_PROVIDER_MODE || 'mock',
    twilioConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    vapiConfigured: !!process.env.VAPI_API_KEY,
    publicUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:5000',
    geminiConfigured,
  });
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(` VoiceCX AI Calling Platform Server Running on Port ${PORT}`);
  console.log(` Health Check API: http://localhost:${PORT}/api/health`);
  console.log(` Webhook Endpoint: http://localhost:${PORT}/api/webhooks/vapi`);
  console.log(`=======================================================`);
});
