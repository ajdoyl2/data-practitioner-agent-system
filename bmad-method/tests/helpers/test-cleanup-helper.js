/**
 * Test Cleanup Helper
 * Provides cleanup utilities for tests
 */

const fs = require('fs-extra');
const path = require('path');

/**
 * Cleanup test services and temporary files
 */
async function cleanupTestServices() {
  // Cleanup any test files
  const testTempDir = path.join(__dirname, '../temp');
  if (await fs.pathExists(testTempDir)) {
    await fs.remove(testTempDir);
  }
  
  // Reset environment variables that might have been set during tests
  delete process.env.TEST_MODE;
  delete process.env.TEST_API_KEY;
  
  console.log('Test cleanup completed');
}

/**
 * Cleanup test databases and data files
 */
async function cleanupTestData() {
  const testDataDir = path.join(__dirname, '../fixtures/test-data');
  if (await fs.pathExists(testDataDir)) {
    await fs.remove(testDataDir);
  }
}

/**
 * Setup test environment
 */
async function setupTestEnvironment() {
  // Set test mode flag
  process.env.TEST_MODE = 'true';
  
  // Ensure test directories exist
  const testTempDir = path.join(__dirname, '../temp');
  await fs.ensureDir(testTempDir);
  
  const testDataDir = path.join(__dirname, '../fixtures/test-data');
  await fs.ensureDir(testDataDir);
}

module.exports = {
  cleanupTestServices,
  cleanupTestData,
  setupTestEnvironment
};