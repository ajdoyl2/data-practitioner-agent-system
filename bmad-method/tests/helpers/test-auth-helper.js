/**
 * Test Authentication Helper
 * Provides test API keys and authentication helpers for tests
 */

const crypto = require('crypto');

/**
 * Generate a test API key with specified scope
 */
async function generateTestApiKey(scope = 'basic') {
  const testKey = `test_${crypto.randomBytes(16).toString('hex')}`;
  
  // Mock API key for testing - not connected to real auth service
  return {
    apiKey: testKey,
    scope: scope,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  };
}

/**
 * Create test authorization headers
 */
function createTestAuthHeaders(apiKey) {
  return {
    'X-API-Key': typeof apiKey === 'string' ? apiKey : apiKey.apiKey,
    'Content-Type': 'application/json'
  };
}

/**
 * Mock authentication middleware for tests
 */
function mockAuthMiddleware(req, res, next) {
  // Skip auth validation in tests
  req.auth = {
    apiKey: 'test_key',
    scope: 'orchestration_manage',
    valid: true
  };
  next();
}

module.exports = {
  generateTestApiKey,
  createTestAuthHeaders,
  mockAuthMiddleware
};