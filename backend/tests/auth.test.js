/**
 * auth.test.js
 * Tests: POST /api/auth/login, GET /api/auth/me
 * Covers: valid login, wrong password, unknown user, missing fields,
 *         token expiry, no-token, valid token (both roles)
 */

jest.mock('../db', () => ({
  pool: { query: jest.fn(), connect: jest.fn() },
  createDatabase: jest.fn().mockResolvedValue(undefined),
  initDatabase: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../utils/logger', () => ({
  info: jest.fn(), error: jest.fn(), warn: jest.fn(),
  auth: jest.fn(), success: jest.fn(), startup: jest.fn(),
  performance: jest.fn(), middleware: () => (_req, _res, next) => next(),
}));
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$hashed'),
  compare: jest.fn(),
}));

const request = require('supertest');
const bcrypt  = require('bcrypt');
const { app } = require('../server');
const { pool } = require('../db');
const {
  SUPER_ADMIN, SOCCOM_ADMIN,
  superAdminToken, soccomAdminToken, expiredToken,
} = require('./helpers');

// Default: any unmatched pool.query resolves safely
beforeEach(() => {
  pool.query.mockResolvedValue({ rows: [], rowCount: 0 });
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  test('returns 200 + token on valid super_admin credentials', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] }); // SELECT user
    bcrypt.compare.mockResolvedValueOnce(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'superadmin', password: 'correct-password' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('super_admin');
    expect(res.body.user.password).toBeUndefined(); // password must not leak
  });

  test('returns 200 + token on valid soccom_admin credentials', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] });
    bcrypt.compare.mockResolvedValueOnce(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'soccomadmin', password: 'correct-password' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('soccom_admin');
  });

  test('returns 401 on wrong password', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] });
    bcrypt.compare.mockResolvedValueOnce(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'superadmin', password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.token).toBeUndefined();
  });

  test('returns 401 for unknown username', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // no user found

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nobody', password: 'whatever' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('returns 400 when username is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'somepassword' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'superadmin' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('returns 400 when both fields missing', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  test('response token decodes to correct payload', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] });
    bcrypt.compare.mockResolvedValueOnce(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'superadmin', password: 'correct-password' });

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded.userId).toBe(SUPER_ADMIN.id);
    expect(decoded.role).toBe('super_admin');
    expect(decoded.username).toBe('superadmin');
  });

  test('token expires in 4 hours', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] });
    bcrypt.compare.mockResolvedValueOnce(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'superadmin', password: 'correct-password' });

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    const expirySeconds = decoded.exp - decoded.iat;
    expect(expirySeconds).toBe(4 * 60 * 60); // 14400 seconds
  });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  test('returns 200 + user info for valid super_admin token', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] }); // authenticate lookup

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(SUPER_ADMIN.id);
    expect(res.body.user.role).toBe('super_admin');
  });

  test('returns 200 + user info for valid soccom_admin token', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${soccomAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('soccom_admin');
  });

  test('returns 401 with no Authorization header', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  test('returns 401 with malformed Bearer token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer notavalidtoken');
    expect(res.status).toBe(401);
  });

  test('returns 401 with expired token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken()}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/expired/i);
  });

  test('returns 401 when user no longer exists in DB', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // user deleted from DB

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    expect(res.status).toBe(401);
  });

  test('returns 401 when Authorization header has wrong scheme', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Basic dXNlcjpwYXNz');
    expect(res.status).toBe(401);
  });
});
