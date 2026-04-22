module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: ['./tests/setup.js'],
  clearMocks: true,
  testTimeout: 15000,
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary'],
  collectCoverageFrom: ['server.js'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  // Don't log to console during tests
  silent: false,
};
