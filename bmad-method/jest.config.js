module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'tools/**/*.js',
    'expansion-packs/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  // Ignore the installer package.json to avoid naming collision
  modulePathIgnorePatterns: ['<rootDir>/tools/installer/']
};