const assert = require('assert');
const VapiVoiceProvider = require('../src/services/voiceProvider/VapiVoiceProvider');
const MockVoiceProvider = require('../src/services/voiceProvider/MockVoiceProvider');
const { getVoiceProvider } = require('../src/services/voiceProvider');
const { processVapiWebhook } = require('../src/services/webhookService');
const { generateCallSummary } = require('../src/services/aiSummaryService');

console.log('=======================================================');
console.log(' Running AI Voice Calling & Vapi Provider Test Suite');
console.log('=======================================================');

async function runTests() {
  try {
    // Test 1: Provider Abstraction Factory
    console.log('\n[Test 1] Testing VoiceProvider Factory Selection...');
    process.env.VOICE_PROVIDER_MODE = 'mock';
    const mockProvider = getVoiceProvider();
    assert.strictEqual(mockProvider instanceof MockVoiceProvider, true, 'Factory should return MockVoiceProvider in mock mode');
    console.log('✓ Test 1 Passed: Factory correctly returns MockVoiceProvider in mock mode.');

    // Test 2: E.164 Phone Format Validation
    console.log('\n[Test 2] Testing E.164 Phone Number Formatting...');
    const e164Regex = /^\+[1-9]\d{6,14}$/;
    const validPhone = '+919876543210';
    assert.strictEqual(e164Regex.test(validPhone), true, 'Phone number +919876543210 must match E.164 format');
    
    const invalidPhone = '123';
    assert.strictEqual(e164Regex.test(invalidPhone), false, 'Phone number 123 must fail E.164 format');
    console.log('✓ Test 2 Passed: E.164 phone regex correctly validates numbers.');

    // Test 3: Outbound Mock Call Creation
    console.log('\n[Test 3] Testing Outbound Call Creation via Mock Voice Provider...');
    const callResult = await mockProvider.createOutboundCall({
      contactName: 'Test Candidate',
      phoneNumber: '+919876543210',
      purpose: 'Internship follow-up interview',
      customInstructions: 'Ask if candidate is available tomorrow at 10 AM',
    });

    assert.ok(callResult.providerCallId, 'Provider call ID must be returned');
    assert.strictEqual(callResult.status, 'queued', 'Initial call status must be queued');
    console.log(`✓ Test 3 Passed: Call created with ID: ${callResult.providerCallId}`);

    // Test 4: Idempotent Webhook Processing
    console.log('\n[Test 4] Testing Idempotent Webhook Processing...');
    const mockCallId = `test_vapi_${Date.now()}`;
    const webhookPayload = {
      message: {
        type: 'call-status-update',
        status: 'in-progress',
        call: { id: mockCallId, status: 'in-progress' },
      },
    };

    const res1 = await processVapiWebhook(webhookPayload);
    assert.strictEqual(res1.success, true, 'First webhook call must succeed');

    const res2 = await processVapiWebhook(webhookPayload);
    assert.strictEqual(res2.success, true, 'Second duplicate webhook call must succeed idempotently');
    assert.strictEqual(res2.message, 'Duplicate event skipped', 'Duplicate webhook must be identified and skipped');
    console.log('✓ Test 4 Passed: Webhook processing is idempotent and skips duplicates.');

    // Test 5: AI Call Summary Generation
    console.log('\n[Test 5] Testing AI Structured Call Summary Generation...');
    const sampleTranscript = `AI: Hello John! Calling regarding your internship application.\nCUSTOMER: Great, yes I am very interested and available for an interview tomorrow.\nAI: Perfect, thank you!`;
    const summaryResult = await generateCallSummary(sampleTranscript, { purpose: 'Internship Application' });

    assert.ok(summaryResult.summary, 'Summary text must be generated');
    assert.ok(summaryResult.outcome, 'Outcome field must be present');
    assert.ok(summaryResult.sentiment, 'Sentiment field must be present');
    assert.strictEqual(typeof summaryResult.followUpRequired, 'boolean', 'followUpRequired must be a boolean');
    console.log('✓ Test 5 Passed: AI Call Summarizer generates structured JSON:');
    console.log(JSON.stringify(summaryResult, null, 2));

    console.log('\n=======================================================');
    console.log(' ALL 5 TESTS PASSED SUCCESSFULLY! ✓');
    console.log('=======================================================');
  } catch (error) {
    console.error('\n❌ Test Suite Failed:', error);
    process.exit(1);
  }
}

runTests();
