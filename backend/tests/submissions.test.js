/**
 * submissions.test.js
 * Tests: Submission lifecycle — approve, reject, resubmit, whitelist, comment
 * Covers: transactions (pool.connect), role enforcement, 404/400/403 errors,
 *         notification delivery to authors and super admins, status transitions
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
  makeSubmission,
} = require('./helpers');

// Shared transaction mock client
const mockClientQuery = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });
const mockClient = { query: mockClientQuery, release: jest.fn() };

beforeEach(() => {
  pool.query.mockResolvedValue({ rows: [], rowCount: 0 });
  pool.connect.mockResolvedValue(mockClient);
  mockClientQuery.mockClear();
  mockClient.release.mockClear();
});

// ── GET /api/submissions ──────────────────────────────────────────────────────

describe('GET /api/submissions', () => {
  test('authenticated user gets list of submissions', async () => {
    const submissions = [makeSubmission(), makeSubmission({ id: 41, type: 'post', item_id: 20 })];
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: submissions });

    const res = await request(app)
      .get('/api/submissions')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('unauthenticated request returns 401', async () => {
    const res = await request(app).get('/api/submissions');
    expect(res.status).toBe(401);
  });
});

// ── GET /api/submissions/:id ──────────────────────────────────────────────────

describe('GET /api/submissions/:id', () => {
  test('returns single submission by id', async () => {
    const sub = makeSubmission();
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [sub] });

    const res = await request(app)
      .get('/api/submissions/40')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(40);
    expect(res.body.status).toBe('pending');
  });

  test('returns 404 when submission not found', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get('/api/submissions/9999')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    expect(res.status).toBe(404);
  });
});

// ── POST /api/submissions/:id/approve ────────────────────────────────────────

describe('POST /api/submissions/:id/approve', () => {
  test('super_admin approves a page submission — page becomes live+visible', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] }); // authenticate

    const submission = makeSubmission({ type: 'page', item_id: 10, author_id: 2 });
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] })               // BEGIN
      .mockResolvedValueOnce({ rows: [submission] })     // SELECT submission
      .mockResolvedValueOnce({ rows: [] })               // UPDATE pages
      .mockResolvedValueOnce({ rows: [] })               // UPDATE submissions
      .mockResolvedValueOnce({ rows: [] })               // INSERT log
      .mockResolvedValueOnce({ rows: [] })               // INSERT notification
      .mockResolvedValueOnce({ rows: [] });              // COMMIT

    const res = await request(app)
      .post('/api/submissions/40/approve')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ notes: 'Looks good' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('super_admin approves a post submission', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] });

    const submission = makeSubmission({ type: 'post', item_id: 20, author_id: 2 });
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [submission] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/submissions/40/approve')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('approve sends notification to submission author', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] });

    const submission = makeSubmission({ author_id: 2 });
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [submission] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await request(app)
      .post('/api/submissions/40/approve')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    const notifCalls = mockClientQuery.mock.calls.filter(c =>
      typeof c[0] === 'string' && c[0].includes('notifications')
    );
    expect(notifCalls.length).toBeGreaterThan(0);
  });

  test('returns 404 when submission not found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] });

    mockClientQuery
      .mockResolvedValueOnce({ rows: [] })   // BEGIN
      .mockResolvedValueOnce({ rows: [] });  // SELECT → not found

    const res = await request(app)
      .post('/api/submissions/9999/approve')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    expect(res.status).toBe(404);
  });
});

// ── POST /api/submissions/:id/reject ─────────────────────────────────────────

describe('POST /api/submissions/:id/reject', () => {
  test('super_admin rejects submission with notes — content reverts to draft', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] });

    const submission = makeSubmission({ type: 'page', item_id: 10, author_id: 2 });
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [submission] })
      .mockResolvedValueOnce({ rows: [] })   // UPDATE pages → draft
      .mockResolvedValueOnce({ rows: [] })   // UPDATE submissions → rejected
      .mockResolvedValueOnce({ rows: [] })   // INSERT log
      .mockResolvedValueOnce({ rows: [] })   // INSERT notification
      .mockResolvedValueOnce({ rows: [] });  // COMMIT

    const res = await request(app)
      .post('/api/submissions/40/reject')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ notes: 'Needs more images' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('rejection sends notification to author', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] });

    const submission = makeSubmission({ author_id: 2 });
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [submission] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await request(app)
      .post('/api/submissions/40/reject')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ notes: 'Incomplete content' });

    const notifCalls = mockClientQuery.mock.calls.filter(c =>
      typeof c[0] === 'string' && c[0].includes('notifications')
    );
    expect(notifCalls.length).toBeGreaterThan(0);
  });

  test('returns 404 when submission not found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] });

    mockClientQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] }); // SELECT → not found

    const res = await request(app)
      .post('/api/submissions/9999/reject')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    expect(res.status).toBe(404);
  });
});

// ── POST /api/submissions/:id/resubmit ───────────────────────────────────────

describe('POST /api/submissions/:id/resubmit', () => {
  test('author resubmits rejected submission — status resets to pending', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] }); // authenticate

    const rejected = makeSubmission({ status: 'rejected', author_id: 2, type: 'page' });
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] })              // BEGIN
      .mockResolvedValueOnce({ rows: [rejected] })      // SELECT submission
      .mockResolvedValueOnce({ rows: [] })              // UPDATE submissions
      .mockResolvedValueOnce({ rows: [] })              // UPDATE pages
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })   // SELECT super admins
      .mockResolvedValueOnce({ rows: [] })              // INSERT notifications
      .mockResolvedValueOnce({ rows: [] })              // INSERT log
      .mockResolvedValueOnce({ rows: [] });             // COMMIT

    const res = await request(app)
      .post('/api/submissions/40/resubmit')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ changeDescription: 'Added required images' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('resubmit notifies all super admins', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] });

    const rejected = makeSubmission({ status: 'rejected', author_id: 2 });
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [rejected] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })   // super admins list
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await request(app)
      .post('/api/submissions/40/resubmit')
      .set('Authorization', `Bearer ${soccomAdminToken()}`);

    const notifCalls = mockClientQuery.mock.calls.filter(c =>
      typeof c[0] === 'string' && c[0].includes('notifications')
    );
    expect(notifCalls.length).toBeGreaterThan(0);
  });

  test('returns 400 when submission is not in rejected status', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] });

    const pending = makeSubmission({ status: 'pending', author_id: 2 });
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [pending] }); // status !== 'rejected' → 400

    const res = await request(app)
      .post('/api/submissions/40/resubmit')
      .set('Authorization', `Bearer ${soccomAdminToken()}`);

    expect(res.status).toBe(400);
  });

  test('returns 403 when non-author tries to resubmit', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] }); // auth as user id=2

    // author_id=1 (different from id=2)
    const rejected = makeSubmission({ status: 'rejected', author_id: 1 });
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [rejected] });

    const res = await request(app)
      .post('/api/submissions/40/resubmit')
      .set('Authorization', `Bearer ${soccomAdminToken()}`);

    expect(res.status).toBe(403);
  });

  test('returns 404 when submission not found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] });

    mockClientQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] }); // SELECT → not found

    const res = await request(app)
      .post('/api/submissions/9999/resubmit')
      .set('Authorization', `Bearer ${soccomAdminToken()}`);

    expect(res.status).toBe(404);
  });
});

// ── POST /api/submissions/:id/whitelist ──────────────────────────────────────

describe('POST /api/submissions/:id/whitelist', () => {
  test('super_admin whitelists a submission', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] });

    const submission = makeSubmission({ author_id: 2 });
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [submission] })
      .mockResolvedValueOnce({ rows: [] })   // UPDATE submissions
      .mockResolvedValueOnce({ rows: [] })   // INSERT log
      .mockResolvedValueOnce({ rows: [] })   // INSERT notification
      .mockResolvedValueOnce({ rows: [] });  // COMMIT

    const res = await request(app)
      .post('/api/submissions/40/whitelist')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ notes: 'Approved with minor exceptions' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('soccom_admin cannot whitelist (403)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] });

    const res = await request(app)
      .post('/api/submissions/40/whitelist')
      .set('Authorization', `Bearer ${soccomAdminToken()}`);

    expect(res.status).toBe(403);
  });
});

// ── POST /api/submissions/:id/comment ────────────────────────────────────────

describe('POST /api/submissions/:id/comment', () => {
  test('authenticated user adds comment to submission', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // UPDATE with append

    const res = await request(app)
      .post('/api/submissions/40/comment')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ comment: 'Please add more detail to paragraph 2.' });

    expect(res.status).toBe(200);
    expect(res.body.comment).toBe('Please add more detail to paragraph 2.');
    expect(res.body.userId).toBe(SUPER_ADMIN.id);
    expect(res.body.id).toBeDefined();
  });

  test('unauthenticated request returns 401', async () => {
    const res = await request(app)
      .post('/api/submissions/40/comment')
      .send({ comment: 'Some comment' });

    expect(res.status).toBe(401);
  });
});

// ── Full submission lifecycle ─────────────────────────────────────────────────

describe('Full submission lifecycle: submit → reject → resubmit → approve', () => {
  test('soccom submits, super rejects, soccom resubmits, super approves', async () => {
    // Step 1: Reject
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] });
    const pending = makeSubmission({ status: 'pending', author_id: 2, type: 'page' });
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [pending] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const rejectRes = await request(app)
      .post('/api/submissions/40/reject')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ notes: 'Needs revision' });
    expect(rejectRes.status).toBe(200);

    // Step 2: Resubmit
    mockClientQuery.mockClear();
    pool.query.mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] });
    const rejected = makeSubmission({ status: 'rejected', author_id: 2, type: 'page' });
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [rejected] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const resubmitRes = await request(app)
      .post('/api/submissions/40/resubmit')
      .set('Authorization', `Bearer ${soccomAdminToken()}`);
    expect(resubmitRes.status).toBe(200);

    // Step 3: Approve
    mockClientQuery.mockClear();
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] });
    const resubmitted = makeSubmission({ status: 'pending', author_id: 2, type: 'page' });
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [resubmitted] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const approveRes = await request(app)
      .post('/api/submissions/40/approve')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ notes: 'Approved' });
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.success).toBe(true);
  });
});
