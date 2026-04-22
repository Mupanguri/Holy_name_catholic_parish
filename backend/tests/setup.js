// Must be set before server.js is imported in any test
process.env.JWT_SECRET = 'test-secret-key-for-holy-name-parish-2024';
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // use random port so tests don't conflict
