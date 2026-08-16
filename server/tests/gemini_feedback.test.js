const assert = require('assert');
const dotenv = require('dotenv');

dotenv.config();

const { analyzeFeedbackText } = require('../src/services/geminiService');

async function runGeminiPhase2Tests() {
  console.log('=======================================================');
  console.log(' Running Phase 2: Gemini AI Feedback Analysis Test Suite');
  console.log('=======================================================');

  try {
    // Test 1: Sample feedback analysis
    const sampleInput = 'Checkout took too long and the staff did not help me. I am very frustrated.';
    console.log(`\n[Test 1] Analyzing sample feedback:\n"${sampleInput}"`);

    const result = await analyzeFeedbackText(sampleInput);

    console.log('\nReturned Analysis Output:');
    console.log(JSON.stringify(result, null, 2));

    // Validations:
    assert.ok(result, 'Analysis result must be returned');
    assert.strictEqual(result.sentiment, 'negative', 'Sentiment must be negative');
    assert.ok(['high', 'medium'].includes(result.urgency), `Urgency should be high or medium, got ${result.urgency}`);
    assert.ok(['frustrated', 'angry', 'disappointed'].includes(result.emotion), `Emotion should be frustration-related, got ${result.emotion}`);
    assert.ok(result.category.includes('checkout') || result.category.includes('service'), `Category should be checkout or service related, got ${result.category}`);
    assert.strictEqual(typeof result.sentimentScore, 'number', 'sentimentScore must be a number');
    assert.ok(result.sentimentScore >= 0.0 && result.sentimentScore <= 1.0, `sentimentScore must be between 0.0 and 1.0, got ${result.sentimentScore}`);
    assert.strictEqual(typeof result.summary, 'string', 'summary must be a string');
    assert.ok(result.summary.length > 0, 'summary must not be empty');
    assert.ok(Array.isArray(result.topics), 'topics must be an array');
    assert.ok(result.topics.length > 0, 'topics array must not be empty');

    console.log('✓ Test 1 Passed: All 7 schema metrics validated successfully.');

    // Test 2: Error handling on empty text
    console.log('\n[Test 2] Testing error handling on empty input...');
    try {
      await analyzeFeedbackText('   ');
      assert.fail('Should have thrown an error for empty text');
    } catch (err) {
      assert.strictEqual(err.message, 'Feedback text is required for analysis');
      console.log('✓ Test 2 Passed: Empty input throws descriptive validation error.');
    }

    // Test 3: Positive feedback analysis
    console.log('\n[Test 3] Analyzing positive feedback sample...');
    const positiveInput = 'The truffle pizza was delicious and our server was super attentive and friendly!';
    const positiveResult = await analyzeFeedbackText(positiveInput);

    assert.strictEqual(positiveResult.sentiment, 'positive', 'Sentiment should be positive');
    assert.ok(positiveResult.sentimentScore >= 0.7, `sentimentScore should be high, got ${positiveResult.sentimentScore}`);
    assert.strictEqual(positiveResult.urgency, 'low', 'Urgency should be low for positive feedback');
    console.log('✓ Test 3 Passed: Positive feedback correctly classified with low urgency.');

    console.log('\n=======================================================');
    console.log(' ALL PHASE 2 GEMINI ANALYSIS TESTS PASSED! ✓');
    console.log('=======================================================');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Gemini Phase 2 Test Suite Failed:', error);
    process.exit(1);
  }
}

runGeminiPhase2Tests();
