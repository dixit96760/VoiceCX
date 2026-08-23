const assert = require('assert');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const { connectDB } = require('../src/config/db');
const Feedback = require('../src/models/Feedback');
const AIAnalysis = require('../src/models/AIAnalysis');
const User = require('../src/models/User');
const errorHandler = require('../src/middleware/errorHandler');

const app = express();
app.use(express.json());
app.use('/api/ai', require('../src/routes/aiRoutes'));
app.use(errorHandler);

// Helper for testing HTTP requests in-process
async function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, async () => {
      const port = server.address().port;
      try {
        const fetchOptions = {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer demo_token_12345',
            ...headers,
          },
        };
        if (body) {
          fetchOptions.body = JSON.stringify(body);
        }

        const res = await fetch(`http://127.0.0.1:${port}${path}`, fetchOptions);
        const data = await res.json();
        server.close();
        resolve({ status: res.status, body: data });
      } catch (err) {
        server.close();
        reject(err);
      }
    });
  });
}

async function runAiApiTests() {
  console.log('=======================================================');
  console.log(' Running Phase 4: AI Feedback Analysis APIs Test Suite');
  console.log('=======================================================');

  try {
    await connectDB();

    // Get or create the default user for auth middleware matching
    let defaultUser = await User.findOne({ email: 'owner@y6bistro.com' });
    if (!defaultUser) {
      defaultUser = await User.create({
        name: 'Chef Sarah Jenkins',
        email: 'owner@y6bistro.com',
        password: 'password123',
        restaurantName: 'Y6 Gourmet Bistro',
        phone: '+1 (555) 234-5678',
      });
    }

    const testFeedback = await Feedback.create({
      user: defaultUser._id,
      customerPhone: '+1 (555) 333-4444',
      customerName: 'Robert California',
      rating: 1,
      sentiment: 'negative',
      status: 'pending',
      summary: 'Checkout was extremely slow and cashier was unresponsive.',
    });

    const feedbackId = testFeedback._id.toString();
    console.log(`Created test Feedback document with ID: ${feedbackId}`);

    // Test 1: POST /api/ai/analyze/:feedbackId (Valid Feedback Analysis)
    console.log('\n[Test 1] POST /api/ai/analyze/:feedbackId - Analyze valid feedback...');
    const analyzeRes = await makeRequest('POST', `/api/ai/analyze/${feedbackId}`);

    assert.strictEqual(analyzeRes.status, 200, `Status should be 200 OK, got ${analyzeRes.status}`);
    assert.strictEqual(analyzeRes.body.success, true, 'Response success should be true');
    assert.ok(analyzeRes.body.data, 'Analysis data must be returned');
    assert.strictEqual(String(analyzeRes.body.data.feedbackId._id || analyzeRes.body.data.feedbackId), feedbackId);
    assert.ok(['positive', 'negative', 'neutral'].includes(analyzeRes.body.data.sentiment));
    assert.strictEqual(typeof analyzeRes.body.data.sentimentScore, 'number');
    assert.ok(analyzeRes.body.data.sentimentScore >= 0 && analyzeRes.body.data.sentimentScore <= 1);
    assert.ok(analyzeRes.body.data.category, 'Category must be present');
    assert.ok(analyzeRes.body.data.emotion, 'Emotion must be present');
    assert.ok(['low', 'medium', 'high'].includes(analyzeRes.body.data.urgency));
    assert.ok(analyzeRes.body.data.summary, 'Summary must be present');

    console.log('✓ Test 1 Passed: AI analysis generated and saved via POST endpoint.');

    // Test 2: POST /api/ai/analyze/:feedbackId (Non-existing Feedback ID)
    console.log('\n[Test 2] POST /api/ai/analyze/:feedbackId - Test non-existing feedback ID...');
    const fakeObjectId = new mongoose.Types.ObjectId().toString();
    const missingFeedbackRes = await makeRequest('POST', `/api/ai/analyze/${fakeObjectId}`);

    assert.strictEqual(missingFeedbackRes.status, 404, 'Should return 404 for non-existent Feedback');
    assert.strictEqual(missingFeedbackRes.body.success, false);
    console.log('✓ Test 2 Passed: Non-existent Feedback ID returns 404.');

    // Test 3: POST /api/ai/analyze/:feedbackId (Invalid ObjectId format)
    console.log('\n[Test 3] POST /api/ai/analyze/:feedbackId - Test invalid ObjectId format...');
    const invalidIdRes = await makeRequest('POST', '/api/ai/analyze/invalid-hex-id-123');

    assert.strictEqual(invalidIdRes.status, 400, 'Should return 400 for invalid ObjectId format');
    assert.strictEqual(invalidIdRes.body.success, false);
    console.log('✓ Test 3 Passed: Invalid ObjectId format returns 400.');

    // Test 4 & 5 & 6: Re-analyze same feedback updates existing analysis (upsert, no duplicates)
    console.log('\n[Test 4, 5 & 6] Testing re-analysis upsert behavior (no duplicate AIAnalysis documents)...');
    const reAnalyzeRes = await makeRequest('POST', `/api/ai/analyze/${feedbackId}`);

    assert.strictEqual(reAnalyzeRes.status, 200, 'Re-analysis should succeed with 200 OK');
    const count = await AIAnalysis.countDocuments({ feedbackId: testFeedback._id });
    assert.strictEqual(count, 1, 'Database must contain exactly 1 AIAnalysis document for this feedbackId');
    console.log('✓ Test 4, 5 & 6 Passed: Re-analysis updated existing document without creating duplicate.');

    // Test 7: GET /api/ai/analysis/:feedbackId (Fetch Existing Analysis)
    console.log('\n[Test 7] GET /api/ai/analysis/:feedbackId - Fetch existing AI analysis...');
    const getAnalysisRes = await makeRequest('GET', `/api/ai/analysis/${feedbackId}`);

    assert.strictEqual(getAnalysisRes.status, 200, 'Status should be 200 OK');
    assert.strictEqual(getAnalysisRes.body.success, true);
    assert.ok(getAnalysisRes.body.data, 'Data should be present');
    assert.strictEqual(String(getAnalysisRes.body.data.feedbackId._id || getAnalysisRes.body.data.feedbackId), feedbackId);
    console.log('✓ Test 7 Passed: Successfully fetched stored AI analysis.');

    // Test 8: GET /api/ai/analysis/:feedbackId (Missing Analysis for unanalyzed feedback)
    console.log('\n[Test 8] GET /api/ai/analysis/:feedbackId - Test missing analysis...');
    const unanalyzedFeedback = await Feedback.create({
      user: defaultUser._id,
      customerPhone: '+1 (555) 111-2222',
      customerName: 'Unanalyzed Guest',
      rating: 5,
      summary: 'Great dining experience.',
    });

    const unanalyzedId = unanalyzedFeedback._id.toString();
    const missingAnalysisRes = await makeRequest('GET', `/api/ai/analysis/${unanalyzedId}`);

    assert.strictEqual(missingAnalysisRes.status, 404, 'Should return 404 for unanalyzed Feedback');
    assert.strictEqual(missingAnalysisRes.body.success, false);
    console.log('✓ Test 8 Passed: Missing AI analysis returns 404.');

    // Test 9: GET /api/ai/analysis/:feedbackId (Invalid ObjectId format)
    console.log('\n[Test 9] GET /api/ai/analysis/:feedbackId - Test invalid ObjectId format...');
    const invalidGetIdRes = await makeRequest('GET', '/api/ai/analysis/invalid-id-xyz');

    assert.strictEqual(invalidGetIdRes.status, 400, 'Should return 400 for invalid ObjectId format');
    assert.strictEqual(invalidGetIdRes.body.success, false);
    console.log('✓ Test 9 Passed: Invalid GET ObjectId format returns 400.');

    // Test 10: Authentication behavior
    console.log('\n[Test 10] Testing route accessibility with auth middleware context...');
    const authTestRes = await makeRequest('GET', `/api/ai/analysis/${feedbackId}`);
    assert.strictEqual(authTestRes.status, 200);
    console.log('✓ Test 10 Passed: Authenticated requests succeed.');

    // Cleanup test documents
    await AIAnalysis.deleteMany({ feedbackId: testFeedback._id });
    await AIAnalysis.deleteMany({ feedbackId: unanalyzedFeedback._id });
    await Feedback.findByIdAndDelete(testFeedback._id);
    await Feedback.findByIdAndDelete(unanalyzedFeedback._id);

    console.log('\n=======================================================');
    console.log(' ALL PHASE 4 AI API TESTS PASSED SUCCESSFULLY! ✓');
    console.log('=======================================================');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ AI API Phase 4 Test Suite Failed:', error);
    process.exit(1);
  }
}

runAiApiTests();
