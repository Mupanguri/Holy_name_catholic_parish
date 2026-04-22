/**
 * notifications.test.js
 * Tests: Notification delivery and management
 * Covers: GET list, unread count, mark read, mark all read, delete,
 *         ownership enforcement (user can only act on their own notifications)
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
  compare: jest.fn().mockResolvedValue(true),
}));

const request = require('supertest');
const { app } = require('../server');
const { pool } = require('../db');
const {
  SUPER_ADMIN, SOCCOM_ADMIN,
  superAdminToken, soccomAdminToken,
  makeNotification,
} = require('./helpers');

beforeEach(() => {
  pool.query.mockResolvedValue({ rows: [], rowCount: 0 });
});

// ── GET /api/notifications/unread-count ──────────────────────────────────────

describe('GET /api/notifications/unread-count', () => {
  test('returns unread count for authenticated user', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [{ count: '3' }] });

    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBeDefined();
  });

  test('returns 0 when no unread notifications', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [{ count: '0' }] });

    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    expect(res.status).toBe(200);
  });

  test('unauthenticated request returns 401', async () => {
    const res = await request(app).get('/api/notifications/unread-count');
    expect(res.status).toBe(401);
  });
});

// ── GET /api/notifications ────────────────────────────────────────────────────

describe('GET /api/notifications', () => {
  test('returns notifications for authenticated user', async () => {
    const notifications = [
      makeNotification({ user_id: 1 }),
      makeNotification({ id: 51, user_id: 1, is_read: true }),
    ];
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: notifications });

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('returns empty array when user has no notifications', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${soccomAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('query scopes notifications to requesting user only', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [] });

    await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    const sql = pool.query.mock.calls[1][0];
    expect(sql).toMatch(/user_id/i);
  });

  test('unauthenticated request returns 401', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });
});

// ── POST /api/notifications/:id/read ─────────────────────────────────────────

describe('POST /api/notifications/:id/read', () => {
  test('marks notification as read', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [{ id: 50 }], rowCount: 1 }); // UPDATE RETURNING

    const res = await request(app)
      .post('/api/notifications/50/read')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('returns 404 when notification not found or belongs to another user', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // no rows → ownership check failed

    const res = await request(app)
      .post('/api/notifications/50/read')
      .set('Authorization', `Bearer ${soccomAdminToken()}`);

    expect(res.status).toBe(404);
  });

  test('unauthenticated request returns 401', async () => {
    const res = await request(app).post('/api/notifications/50/read');
    expect(res.status).toBe(401);
  });
});

// ── POST /api/notifications/read-all ─────────────────────────────────────────

describe('POST /api/notifications/read-all', () => {
  test('marks all notifications as read', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [], rowCount: 5 });

    const res = await request(app)
      .post('/api/notifications/read-all')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('succeeds even when no notifications exist (rowCount 0)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .post('/api/notifications/read-all')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('unauthenticated request returns 401', async () => {
    const res = await request(app).post('/api/notifications/read-all');
    expect(res.status).toBe(401);
  });
});

// ── DELETE /api/notifications/:id ────────────────────────────────────────────

describe('DELETE /api/notifications/:id', () => {
  test('deletes own notification', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [{ id: 50 }], rowCount: 1 });

    const res = await request(app)
      .delete('/api/notifications/50')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("returns 404 when notification doesn't belong to requesting user", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // WHERE id=$1 AND user_id=$2 returns nothing

    const res = await request(app)
      .delete('/api/notifications/50')
      .set('Authorization', `Bearer ${soccomAdminToken()}`);

    expect(res.status).toBe(404);
  });

  test('unauthenticated request returns 401', async () => {
    const res = await request(app).delete('/api/notifications/50');
    expect(res.status).toBe(401);
  });
});
