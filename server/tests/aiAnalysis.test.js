const assert = require('assert');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const { connectDB } = require('../src/config/db');
const Feedback = require('../src/models/Feedback');
const AIAnalysis = require('../src/models/AIAnalysis');
const { saveFeedbackAnalysis, getFeedbackAnalysisByFeedbackId } = require('../src/services/aiAnalysisService');

async function runAIAnalysisTests() {
  console.log('=======================================================');
  console.log(' Running Phase 3: AIAnalysis MongoDB Storage Test Suite');
  console.log('=======================================================');

  try {
    await connectDB();

    // Setup: Create a test user ID and test Feedback document
    const testUserId = new mongoose.Types.ObjectId();
    const testFeedback = await Feedback.create({
      user: testUserId,
      customerPhone: '+1 (555) 777-8888',
      customerName: 'Test Customer',
      rating: 2,
      sentiment: 'negative',
      status: 'pending',
      summary: 'Checkout process was slow and frustrating.',
    });

    const feedbackId = testFeedback._id;
    console.log(`Created test Feedback document with ID: ${feedbackId}`);

    const sampleAnalysis = {
      sentiment: 'negative',
      sentimentScore: 0.18,
      category: 'checkout',
      emotion: 'frustrated',
      urgency: 'high',
      summary: 'Customer experienced a slow and frustrating checkout.',
      topics: ['checkout', 'performance'],
    };

    // Test 1: Valid AIAnalysis creation
    console.log('\n[Test 1] Testing valid AIAnalysis document creation...');
    const savedDoc = await saveFeedbackAnalysis(feedbackId, sampleAnalysis);
    assert.ok(savedDoc, 'Saved document must be returned');
    assert.strictEqual(savedDoc.sentiment, 'negative');
    assert.strictEqual(savedDoc.sentimentScore, 0.18);
    assert.strictEqual(savedDoc.category, 'checkout');
    assert.strictEqual(savedDoc.emotion, 'frustrated');
    assert.strictEqual(savedDoc.urgency, 'high');
    assert.strictEqual(savedDoc.summary, 'Customer experienced a slow and frustrating checkout.');
    assert.deepStrictEqual(savedDoc.topics, ['checkout', 'performance']);
    console.log('✓ Test 1 Passed: AIAnalysis document created successfully.');

    // Test 2: Correct feedbackId reference
    console.log('\n[Test 2] Verifying feedbackId reference & database lookup...');
    const fetchedDoc = await getFeedbackAnalysisByFeedbackId(feedbackId);
    assert.ok(fetchedDoc, 'Document should be retrievable by feedbackId');
    assert.strictEqual(String(fetchedDoc.feedbackId._id || fetchedDoc.feedbackId), String(feedbackId));
    console.log('✓ Test 2 Passed: Correct feedbackId reference stored and populated.');

    // Test 3: Sentiment validation (invalid value rejected)
    console.log('\n[Test 3] Testing sentiment validation...');
    try {
      await saveFeedbackAnalysis(feedbackId, { ...sampleAnalysis, sentiment: 'invalid_sentiment' });
      assert.fail('Should have rejected invalid sentiment');
    } catch (err) {
      assert.ok(err.message.includes('sentiment'), `Expected sentiment error, got: ${err.message}`);
      console.log('✓ Test 3 Passed: Invalid sentiment rejected.');
    }

    // Test 4: sentimentScore below 0 rejected
    console.log('\n[Test 4] Testing sentimentScore below 0 rejected...');
    try {
      await saveFeedbackAnalysis(feedbackId, { ...sampleAnalysis, sentimentScore: -0.5 });
      assert.fail('Should have rejected sentimentScore < 0');
    } catch (err) {
      assert.ok(err.message.includes('between 0 and 1') || err.message.includes('sentimentScore'), `Expected score error, got: ${err.message}`);
      console.log('✓ Test 4 Passed: sentimentScore < 0 rejected.');
    }

    // Test 5: sentimentScore above 1 rejected
    console.log('\n[Test 5] Testing sentimentScore above 1 rejected...');
    try {
      await saveFeedbackAnalysis(feedbackId, { ...sampleAnalysis, sentimentScore: 1.5 });
      assert.fail('Should have rejected sentimentScore > 1');
    } catch (err) {
      assert.ok(err.message.includes('between 0 and 1') || err.message.includes('sentimentScore'), `Expected score error, got: ${err.message}`);
      console.log('✓ Test 5 Passed: sentimentScore > 1 rejected.');
    }

    // Test 6: Urgency validation
    console.log('\n[Test 6] Testing urgency validation...');
    try {
      await saveFeedbackAnalysis(feedbackId, { ...sampleAnalysis, urgency: 'extreme' });
      assert.fail('Should have rejected invalid urgency');
    } catch (err) {
      assert.ok(err.message.includes('urgency'), `Expected urgency error, got: ${err.message}`);
      console.log('✓ Test 6 Passed: Invalid urgency rejected.');
    }

    // Test 7: Required field validation (missing summary)
    console.log('\n[Test 7] Testing required field validation (missing summary)...');
    try {
      await saveFeedbackAnalysis(feedbackId, { ...sampleAnalysis, summary: '' });
      assert.fail('Should have rejected missing summary');
    } catch (err) {
      assert.ok(err.message.includes('Summary is required'), `Expected summary error, got: ${err.message}`);
      console.log('✓ Test 7 Passed: Missing summary field rejected.');
    }

    // Test 8 & 9: Duplicate feedbackId handling & Updating an existing analysis
    console.log('\n[Test 8 & 9] Testing duplicate feedbackId handling & updating existing analysis...');
    const updatedAnalysis = {
      ...sampleAnalysis,
      urgency: 'medium',
      summary: 'Updated summary: Customer checkout delayed.',
    };

    const updatedDoc = await saveFeedbackAnalysis(feedbackId, updatedAnalysis);
    const count = await AIAnalysis.countDocuments({ feedbackId });

    assert.strictEqual(count, 1, 'There should only be 1 AIAnalysis document per feedbackId');
    assert.strictEqual(updatedDoc.urgency, 'medium', 'Urgency should be updated to medium');
    assert.strictEqual(updatedDoc.summary, 'Updated summary: Customer checkout delayed.');
    console.log('✓ Test 8 & 9 Passed: Document updated without creating duplicate entries (count = 1).');

    // Test 10: Missing feedback handling
    console.log('\n[Test 10] Testing missing feedback handling...');
    const nonExistentFeedbackId = new mongoose.Types.ObjectId();
    try {
      await saveFeedbackAnalysis(nonExistentFeedbackId, sampleAnalysis);
      assert.fail('Should have rejected saving analysis for non-existent Feedback');
    } catch (err) {
      assert.ok(err.message.includes('not found'), `Expected feedback not found error, got: ${err.message}`);
      console.log('✓ Test 10 Passed: Non-existent feedback reference rejected.');
    }

    // Cleanup test documents
    await AIAnalysis.deleteMany({ feedbackId });
    await Feedback.findByIdAndDelete(feedbackId);

    console.log('\n=======================================================');
    console.log(' ALL PHASE 3 AIANALYSIS STORAGE TESTS PASSED! ✓');
    console.log('=======================================================');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ AIAnalysis Phase 3 Test Suite Failed:', error);
    process.exit(1);
  }
}

runAIAnalysisTests();
