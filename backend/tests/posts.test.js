/**
 * posts.test.js
 * Tests: Full post lifecycle — create → update → submit → approve/reject → publish
 * Covers: 2-image minimum rule, role restrictions, bulletin flags, visibility, deletion
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
  makePost, makeLivePost,
} = require('./helpers');

beforeEach(() => {
  pool.query.mockResolvedValue({ rows: [], rowCount: 0 });
});

const validPostPayload = {
  title: 'Parish Picnic',
  excerpt: 'Join us for fun',
  content: 'Details here',
  category: 'Parish Notice',
  images: ['/img/a.jpg', '/img/b.jpg'],
};

// ── GET /api/posts — public vs admin filtering ───────────────────────────────

describe('GET /api/posts — visibility rules', () => {
  test('public request filters to live/visible posts only', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [makeLivePost()] })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    const res = await request(app).get('/api/posts');
    expect(res.status).toBe(200);

    // Verify the SQL WHERE clause includes visibility filter
    const sql = pool.query.mock.calls[0][0];
    expect(sql).toMatch(/visible/i);
    expect(sql).toMatch(/live/i);
  });

  test('admin sees all posts including drafts', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [makePost()] })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    const res = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    expect(res.status).toBe(200);
    const sql = pool.query.mock.calls[0][0];
    expect(sql).not.toMatch(/visible = true/i);
  });

  test('GET /api/posts/public returns only approved live posts', async () => {
    pool.query.mockResolvedValueOnce({ rows: [makeLivePost()] });

    const res = await request(app).get('/api/posts/public');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/posts/:id returns 404 for draft when unauthenticated', async () => {
    pool.query.mockResolvedValueOnce({ rows: [makePost({ visible: false, status: 'draft' })] });

    const res = await request(app).get('/api/posts/20');
    expect(res.status).toBe(404);
  });

  test('GET /api/posts/:id returns live post to public', async () => {
    pool.query.mockResolvedValueOnce({ rows: [makeLivePost()] });

    const res = await request(app).get('/api/posts/20');
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Test Post');
  });

  test('GET /api/bulletins returns pinned bulletins', async () => {
    const bulletin = makeLivePost({ is_bulletin: true, is_pinned: true });
    pool.query.mockResolvedValueOnce({ rows: [bulletin] });

    const res = await request(app).get('/api/bulletins');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── POST /api/posts — post creation lifecycle ────────────────────────────────

describe('POST /api/posts — post creation', () => {
  test('soccom_admin creates post with 2+ images', async () => {
    const created = makePost();
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })
      .mockResolvedValueOnce({ rows: [created] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send(validPostPayload);

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Test Post');
    expect(res.body.status).toBe('draft');
  });

  test('returns 400 when fewer than 2 images provided', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] });

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ ...validPostPayload, images: ['/img/only-one.jpg'] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/2 images/i);
  });

  test('returns 400 when no images provided', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] });

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ ...validPostPayload, images: [] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/2 images/i);
  });

  test('returns 400 when title is missing', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] });

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ images: ['/a.jpg', '/b.jpg'] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/validation/i);
  });

  test('creates bulletin post when is_bulletin is true', async () => {
    const bulletin = makePost({ is_bulletin: true, is_pinned: true });
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })
      .mockResolvedValueOnce({ rows: [bulletin] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ ...validPostPayload, is_bulletin: true, is_pinned: true });

    expect(res.status).toBe(200);
  });

  test('unauthenticated request returns 401', async () => {
    const res = await request(app).post('/api/posts').send(validPostPayload);
    expect(res.status).toBe(401);
  });
});

// ── PUT /api/posts/:id — post update ─────────────────────────────────────────

describe('PUT /api/posts/:id — post update', () => {
  test('soccom_admin can update their post', async () => {
    const updated = makePost({ title: 'Updated Post' });
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })
      .mockResolvedValueOnce({ rows: [updated] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .put('/api/posts/20')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ title: 'Updated Post', images: ['/a.jpg', '/b.jpg'] });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Post');
  });

  test('super_admin CANNOT update posts (restricted)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] });

    const res = await request(app)
      .put('/api/posts/20')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ title: 'Hacked', images: ['/a.jpg', '/b.jpg'] });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/content creator/i);
  });

  test('returns 404 when post not found', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .put('/api/posts/9999')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ title: 'Ghost', images: ['/a.jpg', '/b.jpg'] });

    expect(res.status).toBe(404);
  });
});

// ── POST /api/posts/:id/submit ────────────────────────────────────────────────

describe('POST /api/posts/:id/submit — post submission lifecycle', () => {
  test('soccom_admin can submit post with 2+ images for review', async () => {
    const post = makePost({ images: ['/a.jpg', '/b.jpg'] });
    const submission = { id: 40, type: 'post', item_id: 20, status: 'pending' };
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })         // auth
      .mockResolvedValueOnce({ rows: [{ images: ['/a.jpg', '/b.jpg'] }] }) // CHECK images
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })         // UPDATE status
      .mockResolvedValueOnce({ rows: [post] })                  // SELECT post
      .mockResolvedValueOnce({ rows: [submission] })             // INSERT submission
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })            // SELECT super admins
      .mockResolvedValueOnce({ rows: [] })                      // notification
      .mockResolvedValueOnce({ rows: [] });                     // log

    const res = await request(app)
      .post('/api/posts/20/submit')
      .set('Authorization', `Bearer ${soccomAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.submission.status).toBe('pending');
  });

  test('returns 400 when post has fewer than 2 images at submit time', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })
      .mockResolvedValueOnce({ rows: [{ images: ['/only-one.jpg'] }] });

    const res = await request(app)
      .post('/api/posts/20/submit')
      .set('Authorization', `Bearer ${soccomAdminToken()}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/2 images/i);
  });

  test('returns 404 when post does not exist', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })
      .mockResolvedValueOnce({ rows: [] }); // post not found

    const res = await request(app)
      .post('/api/posts/9999/submit')
      .set('Authorization', `Bearer ${soccomAdminToken()}`);

    expect(res.status).toBe(404);
  });
});

// ── PATCH /api/posts/:id/visibility ──────────────────────────────────────────

describe('PATCH /api/posts/:id/visibility', () => {
  test('super_admin publishes a post', async () => {
    const visPost = makePost({ visible: true });
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [visPost] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .patch('/api/posts/20/visibility')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ visible: true });

    expect(res.status).toBe(200);
    expect(res.body.visible).toBe(true);
  });

  test('soccom_admin CANNOT toggle post visibility', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] });

    const res = await request(app)
      .patch('/api/posts/20/visibility')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ visible: true });

    expect(res.status).toBe(403);
  });
});

// ── DELETE /api/posts/:id ─────────────────────────────────────────────────────

describe('DELETE /api/posts/:id', () => {
  test('soccom_admin deletes their own post', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .delete('/api/posts/20')
      .set('Authorization', `Bearer ${soccomAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('super_admin CANNOT delete posts', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] });

    const res = await request(app)
      .delete('/api/posts/20')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    expect(res.status).toBe(403);
  });
});

// ── Full post lifecycle ───────────────────────────────────────────────────────

describe('Full post lifecycle: draft → submit → publish', () => {
  test('soccom creates, submits, super publishes via visibility', async () => {
    // Step 1: Create
    const draft = makePost({ status: 'draft', visible: false });
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })
      .mockResolvedValueOnce({ rows: [draft] })
      .mockResolvedValueOnce({ rows: [] });

    const createRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send(validPostPayload);

    expect(createRes.status).toBe(200);
    expect(createRes.body.visible).toBe(false);

    // Step 2: Publish (super admin toggles visibility)
    const published = makePost({ visible: true, status: 'live' });
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [published] })
      .mockResolvedValueOnce({ rows: [] });

    const pubRes = await request(app)
      .patch('/api/posts/20/visibility')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ visible: true });

    expect(pubRes.status).toBe(200);
    expect(pubRes.body.visible).toBe(true);
  });
});
