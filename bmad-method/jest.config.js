module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  collectCoverageFrom: [
    'tools/**/*.js',
    'expansion-packs/**/*.js',
    'bmad-core/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!tools/installer/node_modules/**'
  ],
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './tools/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './tools/lib/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './bmad-core/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  verbose: true,
  // Ignore the installer package.json to avoid naming collision
  modulePathIgnorePatterns: ['<rootDir>/tools/installer/'],
  // Test pattern matching
  // Enable coverage tracking for new file patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/dist/',
    '/coverage/',
    '/.git/',
    '/logs/',
    '/scripts/python/',
    '\\.md$',
    '\\.yaml$',
    '\\.yml$'
  ],
  // Test timeout for long-running tests
  testTimeout: 30000,
  // Setup files for test environment
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  // Report slow tests
  slowTestThreshold: 5,
  // Error on deprecated features
  errorOnDeprecated: true
};