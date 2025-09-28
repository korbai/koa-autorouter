module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'index.js',
    '!node_modules/**',
    '!test/**'
  ],
  testMatch: [
    '**/test/**/*.test.js'
  ],
  verbose: true
};