/**
 * Jest setup file to handle Node.js compatibility issues
 */

// Note: fs-extra mocking moved to individual test files for better control
// This allows each test file to define its own mocking strategy

// Global test setup
beforeAll(() => {
  process.env.NODE_ENV = 'test';
});