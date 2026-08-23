const assert = require('assert');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const { connectDB } = require('../src/config/db');
const errorHandler = require('../src/middleware/errorHandler');

const app = express();
app.use(express.json());
app.use('/api/feedback', require('../src/routes/feedbackRoutes'));
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

async function runFeedbackTests() {
  console.log('=======================================================');
  console.log(' Running Feedback CRUD APIs & Validation Test Suite');
  console.log('=======================================================');

  try {
    await connectDB();

    let createdFeedbackId = null;

    // Test 1: POST /api/feedback (Valid Creation)
    console.log('\n[Test 1] POST /api/feedback - Valid feedback creation...');
    const createRes = await makeRequest('POST', '/api/feedback', {
      rating: 5,
      summary: 'The food was extraordinary! Excellent service from host and staff.',
      customerName: 'Alice Smith',
      customerPhone: '+1 (555) 999-8877',
      status: 'pending',
      categoryRatings: { food: 5, service: 5, ambience: 4, value: 4 },
    });

    assert.strictEqual(createRes.status, 201, `Status should be 201 Created, got ${createRes.status}`);
    assert.strictEqual(createRes.body.success, true, 'Response success should be true');
    assert.ok(createRes.body.data._id || createRes.body.data.id, 'Feedback ID must be returned');
    assert.strictEqual(createRes.body.data.rating, 5, 'Rating should match input');
    assert.strictEqual(createRes.body.data.summary, 'The food was extraordinary! Excellent service from host and staff.');

    createdFeedbackId = createRes.body.data._id || createRes.body.data.id;
    console.log(`✓ Test 1 Passed: Feedback created with ID ${createdFeedbackId}`);

    // Test 2: POST /api/feedback (Validation Failure - Rating Out of Range)
    console.log('\n[Test 2] POST /api/feedback - Validation error for invalid rating...');
    const invalidRatingRes = await makeRequest('POST', '/api/feedback', {
      rating: 10,
      summary: 'Good food',
    });
    assert.strictEqual(invalidRatingRes.status, 400, 'Status should be 400 Bad Request');
    assert.strictEqual(invalidRatingRes.body.success, false);
    console.log('✓ Test 2 Passed: Invalid rating (10) rejected with 400.');

    // Test 3: POST /api/feedback (Validation Failure - Empty Text)
    console.log('\n[Test 3] POST /api/feedback - Validation error for empty text...');
    const emptyTextRes = await makeRequest('POST', '/api/feedback', {
      rating: 4,
      summary: '   ',
    });
    assert.strictEqual(emptyTextRes.status, 400, 'Status should be 400 Bad Request');
    assert.strictEqual(emptyTextRes.body.success, false);
    console.log('✓ Test 3 Passed: Empty text rejected with 400.');

    // Test 4: GET /api/feedback (List & Filtering)
    console.log('\n[Test 4] GET /api/feedback - Fetch list of feedback records...');
    const listRes = await makeRequest('GET', '/api/feedback');
    assert.strictEqual(listRes.status, 200, 'Status should be 200 OK');
    assert.strictEqual(listRes.body.success, true);
    assert.ok(Array.isArray(listRes.body.data), 'Data should be an array');
    assert.ok(listRes.body.data.length >= 1, 'Should contain at least 1 feedback item');
    console.log(`✓ Test 4 Passed: Returned ${listRes.body.data.length} feedback items.`);

    // Test 5: GET /api/feedback/:id (Single Item Fetch)
    console.log('\n[Test 5] GET /api/feedback/:id - Fetch feedback by ID...');
    const getByIdRes = await makeRequest('GET', `/api/feedback/${createdFeedbackId}`);
    assert.strictEqual(getByIdRes.status, 200, 'Status should be 200 OK');
    assert.strictEqual(getByIdRes.body.success, true);
    assert.strictEqual(getByIdRes.body.data.customerName, 'Alice Smith');
    console.log('✓ Test 5 Passed: Successfully retrieved feedback by ID.');

    // Test 6: GET /api/feedback/:id (Invalid ObjectId & 404)
    console.log('\n[Test 6] GET /api/feedback/:id - Test invalid ID and non-existent ID...');
    const invalidIdRes = await makeRequest('GET', '/api/feedback/invalid-hex-id-999');
    assert.strictEqual(invalidIdRes.status, 400, 'Invalid ObjectId should return 400');

    const fakeObjectId = new mongoose.Types.ObjectId().toString();
    const notFoundRes = await makeRequest('GET', `/api/feedback/${fakeObjectId}`);
    assert.strictEqual(notFoundRes.status, 404, 'Non-existent ObjectId should return 404');
    console.log('✓ Test 6 Passed: Invalid ObjectId returns 400, non-existent returns 404.');

    // Test 7: PUT /api/feedback/:id (Update Entry)
    console.log('\n[Test 7] PUT /api/feedback/:id - Update feedback entry...');
    const updateRes = await makeRequest('PUT', `/api/feedback/${createdFeedbackId}`, {
      status: 'resolved',
      ownerNotes: 'Called customer and offered complimentary dessert.',
      rating: 5,
    });
    assert.strictEqual(updateRes.status, 200, 'Status should be 200 OK');
    assert.strictEqual(updateRes.body.success, true);
    assert.strictEqual(updateRes.body.data.status, 'resolved');
    assert.strictEqual(updateRes.body.data.ownerNotes, 'Called customer and offered complimentary dessert.');
    console.log('✓ Test 7 Passed: Successfully updated feedback entry.');

    // Test 8: DELETE /api/feedback/:id (Delete Entry)
    console.log('\n[Test 8] DELETE /api/feedback/:id - Delete feedback entry...');
    const deleteRes = await makeRequest('DELETE', `/api/feedback/${createdFeedbackId}`);
    assert.strictEqual(deleteRes.status, 200, 'Status should be 200 OK');
    assert.strictEqual(deleteRes.body.success, true);

    const verifyDeleteRes = await makeRequest('GET', `/api/feedback/${createdFeedbackId}`);
    assert.strictEqual(verifyDeleteRes.status, 404, 'Deleted feedback should return 404');
    console.log('✓ Test 8 Passed: Successfully deleted feedback entry.');

    console.log('\n=======================================================');
    console.log(' ALL FEEDBACK CRUD TESTS PASSED SUCCESSFULLY! ✓');
    console.log('=======================================================');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Feedback Test Suite Failed:', error);
    process.exit(1);
  }
}

runFeedbackTests();
