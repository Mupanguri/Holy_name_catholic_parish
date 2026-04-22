/**
 * security.test.js
 * OWASP Top 10 / ASVS / NIST 800-53 security verification
 *
 * A01 — Broken Access Control: role enforcement, draft content exposure
 * A03 — Injection: SQL injection in path params, XSS payload handling
 * A07 — Authentication Failures: JWT tampering, expired tokens, wrong scheme
 * A10 — SSRF: video link domain whitelist
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
const jwt = require('jsonwebtoken');
const { app } = require('../server');
const { pool } = require('../db');
const {
  SUPER_ADMIN, SOCCOM_ADMIN,
  superAdminToken, soccomAdminToken,
  makePost, makeLivePost, makePage, makeLivePage,
} = require('./helpers');

beforeEach(() => {
  pool.query.mockResolvedValue({ rows: [], rowCount: 0 });
});

// ── A01: Broken Access Control — Role Enforcement ────────────────────────────

describe('A01 — Role Enforcement', () => {
  test('soccom_admin cannot list users (403)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] });

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${soccomAdminToken()}`);

    expect(res.status).toBe(403);
  });

  test('soccom_admin cannot create users (403)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] });

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ username: 'hacker', password: 'pw123456', name: 'Hacker', role: 'super_admin' });

    expect(res.status).toBe(403);
  });

  test('super_admin cannot edit posts (403 — content creator restricted)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] });

    const res = await request(app)
      .put('/api/posts/20')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ title: 'Injected Title', images: ['/a.jpg', '/b.jpg'] });

    expect(res.status).toBe(403);
  });

  test('super_admin cannot delete posts (403)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] });

    const res = await request(app)
      .delete('/api/posts/20')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    expect(res.status).toBe(403);
  });

  test('soccom_admin cannot toggle post visibility (403)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] });

    const res = await request(app)
      .patch('/api/posts/20/visibility')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ visible: true });

    expect(res.status).toBe(403);
  });

  test('unauthenticated user cannot edit pages (401)', async () => {
    const res = await request(app)
      .put('/api/pages/10')
      .send({ title: 'Hacked', content: 'content', slug: 'hacked', path: '/hacked' });

    expect(res.status).toBe(401);
  });
});

// ── A01: Draft Content Exposure ───────────────────────────────────────────────

describe('A01 — Draft Content Exposure', () => {
  test('GET /api/posts without auth filters to visible/live posts', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [makeLivePost()] })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    await request(app).get('/api/posts');

    const sql = pool.query.mock.calls[0][0];
    expect(sql).toMatch(/visible/i);
  });

  test('GET /api/pages without auth filters to visible/live pages', async () => {
    pool.query.mockResolvedValueOnce({ rows: [makeLivePage()] });

    await request(app).get('/api/pages');

    const sql = pool.query.mock.calls[0][0];
    expect(sql).toMatch(/visible/i);
  });

  test('GET /api/posts/:id returns 404 for draft to unauthenticated user', async () => {
    pool.query.mockResolvedValueOnce({ rows: [makePost({ visible: false, status: 'draft' })] });

    const res = await request(app).get('/api/posts/20');
    expect(res.status).toBe(404);
  });

  test('GET /api/pages/:id returns 404 for draft to unauthenticated user', async () => {
    pool.query.mockResolvedValueOnce({ rows: [makePage({ visible: false, status: 'draft' })] });

    const res = await request(app).get('/api/pages/10');
    expect(res.status).toBe(404);
  });

  test('authenticated admin can access draft page', async () => {
    const draft = makePage({ visible: false, status: 'draft' });
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [draft] });

    const res = await request(app)
      .get('/api/pages/10')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    expect(res.status).toBe(200);
  });
});

// ── A07: Authentication Failures ─────────────────────────────────────────────

describe('A07 — Authentication Failures', () => {
  test('JWT signed with wrong secret returns 401', async () => {
    const tamperedToken = jwt.sign(
      { userId: 1, role: 'super_admin', username: 'superadmin' },
      'wrong-secret-key',
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tamperedToken}`);

    expect(res.status).toBe(401);
  });

  test('JWT with role escalation in payload is rejected (signature invalid)', async () => {
    // Attempt to forge a super_admin token for a soccom user
    const forgedToken = jwt.sign(
      { userId: 2, role: 'super_admin', username: 'soccomadmin' },
      'wrong-secret',
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${forgedToken}`);

    expect(res.status).toBe(401);
  });

  test('no Authorization header returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('Basic auth scheme (not Bearer) returns 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Basic dXNlcjpwYXNz');
    expect(res.status).toBe(401);
  });

  test('malformed JWT string returns 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer this.is.not.a.valid.jwt');
    expect(res.status).toBe(401);
  });

  test('token for deleted user returns 401', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // user not in DB

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    expect(res.status).toBe(401);
  });

  test('login with SQL injection in username field returns 401', async () => {
    // Parameterized queries prevent injection — no user with that exact string exists
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: "admin' OR '1'='1", password: 'anything' });

    expect(res.status).toBe(401);
  });
});

// ── A03: Injection — Path Parameter Handling ─────────────────────────────────

describe('A03 — Injection via Path Parameters', () => {
  test('non-numeric post ID returns 404 or 400 (no SQL injection)', async () => {
    // Express route param :id — parameterized queries prevent injection
    // even if the string reaches the DB layer
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/posts/abc');
    // Must not return 200 or 500 — injection must not succeed
    expect([400, 404]).toContain(res.status);
  });

  test('XSS payload in task title is stored safely (not executed)', async () => {
    const xssPayload = '<script>alert(document.cookie)</script>';
    const created = {
      id: 30, title: xssPayload, status: 'pending',
      assignee_id: 1, created_by: 1,
    };
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [created] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ title: xssPayload, priority: 'low' });

    // Server stores it as plain text — client-side rendering must escape it
    // Response must be 200 (stored), not 500 (crash)
    expect(res.status).toBe(200);
    expect(res.body.title).toBe(xssPayload);
  });

  test('XSS payload in post title is stored safely', async () => {
    const xssPayload = '"><img src=x onerror=alert(1)>';
    const created = makePost({ title: xssPayload });
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })
      .mockResolvedValueOnce({ rows: [created] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({
        title: xssPayload,
        content: 'Content',
        category: 'Parish Notice',
        images: ['/a.jpg', '/b.jpg'],
      });

    expect(res.status).toBe(200);
    // Title returned as-is (raw text) — escaping is the frontend's responsibility
    expect(res.body.title).toBe(xssPayload);
  });
});

// ── A10: SSRF — Video Link Domain Whitelist ───────────────────────────────────

describe('A10 — SSRF via Video Links', () => {
  test('internal IP address as video URL is rejected (400)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] });

    const res = await request(app)
      .post('/api/video-links')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({
        url: 'http://169.254.169.254/latest/meta-data/',
        title: 'SSRF Test',
      });

    expect(res.status).toBe(400);
  });

  test('localhost video URL is rejected (400)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] });

    const res = await request(app)
      .post('/api/video-links')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({
        url: 'http://localhost:5000/api/users',
        title: 'Internal SSRF',
      });

    expect(res.status).toBe(400);
  });

  test('javascript: URI as video URL is rejected (400)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] });

    const res = await request(app)
      .post('/api/video-links')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({
        url: 'javascript:alert(document.cookie)',
        title: 'XSS via video',
      });

    expect(res.status).toBe(400);
  });

  test('arbitrary external domain is rejected (400)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] });

    const res = await request(app)
      .post('/api/video-links')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({
        url: 'https://evil-attacker.com/malware',
        title: 'Malicious Link',
      });

    expect(res.status).toBe(400);
  });

  test('valid YouTube URL is accepted (200)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [{ id: 1, url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', platform: 'youtube', title: 'Test Video' }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/video-links')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Parish Video',
      });

    expect(res.status).toBe(200);
  });

  test('valid TikTok URL is accepted (200)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [{ id: 2, url: 'https://www.tiktok.com/@user/video/123', platform: 'tiktok', title: 'TikTok' }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/video-links')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({
        url: 'https://www.tiktok.com/@user/video/123',
        title: 'TikTok Video',
      });

    expect(res.status).toBe(200);
  });
});

// ── A05: Security Misconfiguration — Sensitive Endpoints ─────────────────────

describe('A05 — Sensitive Log Endpoints Require Authentication', () => {
  test('GET /api/logs/screen-analysis requires auth (401 without token)', async () => {
    const res = await request(app).get('/api/logs/screen-analysis');
    expect(res.status).toBe(401);
  });

  test('GET /api/logs/frontend requires auth (401 without token)', async () => {
    const res = await request(app).get('/api/logs/frontend');
    expect(res.status).toBe(401);
  });

  test('GET /api/logs/screen-analysis requires super_admin (403 for soccom)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] });

    const res = await request(app)
      .get('/api/logs/screen-analysis')
      .set('Authorization', `Bearer ${soccomAdminToken()}`);

    expect(res.status).toBe(403);
  });
});
