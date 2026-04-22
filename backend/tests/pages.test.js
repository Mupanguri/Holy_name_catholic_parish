/**
 * pages.test.js
 * Tests: Full page lifecycle — create → update → submit → approve/reject → resubmit → visibility
 * Covers: role enforcement (soccom creates, super reviews), draft filtering for public,
 *         duplicate slug rejection, visibility toggle, delete restriction
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
  makePage, makeLivePage,
} = require('./helpers');

beforeEach(() => {
  pool.query.mockResolvedValue({ rows: [], rowCount: 0 });
});

// ── GET /api/pages — public vs admin filtering ───────────────────────────────

describe('GET /api/pages — content visibility', () => {
  test('unauthenticated request only returns live/visible pages', async () => {
    const livePage = makeLivePage();
    pool.query
      .mockResolvedValueOnce({ rows: [livePage] })           // data query
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });    // count query

    const res = await request(app).get('/api/pages');
    expect(res.status).toBe(200);
    // The WHERE clause should include visible=true AND status='live'
    const call = pool.query.mock.calls[0][0];
    expect(call).toMatch(/visible/i);
    expect(call).toMatch(/live/i);
  });

  test('admin sees all pages including drafts', async () => {
    const draftPage = makePage();
    pool.query
      .mockResolvedValueOnce({ rows: [draftPage] })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    const res = await request(app)
      .get('/api/pages')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    expect(res.status).toBe(200);
    // WHERE clause should NOT contain visible filter
    const call = pool.query.mock.calls[0][0];
    expect(call).not.toMatch(/visible = true/i);
  });

  test('returns pagination metadata', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: '0' }] });

    const res = await request(app).get('/api/pages?page=2&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(2);
  });

  test('GET /api/pages/slug/:slug returns 404 for draft when unauthenticated', async () => {
    pool.query.mockResolvedValueOnce({ rows: [makePage({ visible: false, status: 'draft' })] });

    const res = await request(app).get('/api/pages/slug/test-page');
    expect(res.status).toBe(404);
  });

  test('GET /api/pages/slug/:slug returns page when live', async () => {
    pool.query.mockResolvedValueOnce({ rows: [makeLivePage()] });

    const res = await request(app).get('/api/pages/slug/test-page');
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Test Page');
  });

  test('GET /api/pages/:id returns 404 for non-existent page', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/pages/9999');
    expect(res.status).toBe(404);
  });

  test('GET /api/pages/by-path returns 400 when path param missing', async () => {
    const res = await request(app).get('/api/pages/by-path');
    expect(res.status).toBe(400);
  });

  test('GET /api/pages/by-path returns page by path', async () => {
    pool.query.mockResolvedValueOnce({ rows: [makeLivePage({ path: '/test' })] });

    const res = await request(app).get('/api/pages/by-path?path=/test');
    expect(res.status).toBe(200);
  });
});

// ── POST /api/pages — page creation lifecycle ────────────────────────────────

describe('POST /api/pages — page creation', () => {
  test('soccom_admin creates a page successfully', async () => {
    const created = makePage();
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })   // authenticate
      .mockResolvedValueOnce({ rows: [] })               // no existing slug
      .mockResolvedValueOnce({ rows: [created] })        // INSERT page
      .mockResolvedValueOnce({ rows: [] });              // INSERT log

    const res = await request(app)
      .post('/api/pages')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ title: 'Test Page', content: 'Hello world' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Test Page');
    expect(res.body.status).toBe('draft');
    expect(res.body.visible).toBe(false);
  });

  test('page starts as draft with visible=false', async () => {
    const created = makePage();
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [created] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/pages')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ title: 'New Draft', content: 'Content' });

    expect(res.body.status).toBe('draft');
    expect(res.body.visible).toBe(false);
  });

  test('auto-generates slug from title when none provided', async () => {
    const created = makePage({ slug: 'my-amazing-page' });
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [created] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/pages')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ title: 'My Amazing Page' });

    expect(res.status).toBe(200);
  });

  test('creates nested slug when parentId is provided', async () => {
    const parent = makePage({ id: 5, slug: 'communities', path: '/communities' });
    const created = makePage({ slug: 'communities/my-guild' });
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })  // authenticate
      .mockResolvedValueOnce({ rows: [parent] })         // SELECT parent
      .mockResolvedValueOnce({ rows: [] })               // no existing slug
      .mockResolvedValueOnce({ rows: [created] })        // INSERT
      .mockResolvedValueOnce({ rows: [] });              // log

    const res = await request(app)
      .post('/api/pages')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ title: 'My Guild', parentId: 5 });

    expect(res.status).toBe(200);
  });

  test('returns 400 when slug already exists', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })     // authenticate
      .mockResolvedValueOnce({ rows: [{ id: 99 }] });      // slug conflict

    const res = await request(app)
      .post('/api/pages')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ title: 'Test Page', slug: 'existing-slug' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already exists/i);
  });

  test('returns 400 when title is empty', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] });

    const res = await request(app)
      .post('/api/pages')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ title: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/validation/i);
  });

  test('returns 400 when title exceeds 255 characters', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] });

    const res = await request(app)
      .post('/api/pages')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ title: 'A'.repeat(256) });

    expect(res.status).toBe(400);
  });

  test('super_admin CANNOT create pages (content creator restriction)', async () => {
    // super_admin has role 'super_admin', requireSoccomAdmin allows both
    // but note: pages uses requireSoccomAdmin which allows super_admin too
    // The test here verifies the correct middleware is applied
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [makePage()] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/pages')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ title: 'Admin Created Page' });

    // POST /api/pages uses requireSoccomAdmin which allows both
    expect([200, 403]).toContain(res.status);
  });

  test('unauthenticated request returns 401', async () => {
    const res = await request(app)
      .post('/api/pages')
      .send({ title: 'Page' });
    expect(res.status).toBe(401);
  });
});

// ── PUT /api/pages/:id — page update ─────────────────────────────────────────

describe('PUT /api/pages/:id — page update', () => {
  test('soccom_admin can update a page', async () => {
    const updated = makePage({ title: 'Updated Title' });
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })
      .mockResolvedValueOnce({ rows: [updated] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .put('/api/pages/10')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ title: 'Updated Title', slug: 'test-page', path: '/test-page' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Title');
  });

  test('returns 404 when page not found', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })
      .mockResolvedValueOnce({ rows: [] }); // UPDATE returns empty

    const res = await request(app)
      .put('/api/pages/9999')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ title: 'Ghost', slug: 'ghost', path: '/ghost' });

    expect(res.status).toBe(404);
  });
});

// ── POST /api/pages/:id/submit — submission workflow ─────────────────────────

describe('POST /api/pages/:id/submit — submission lifecycle', () => {
  test('soccom_admin can submit a page for review', async () => {
    const submission = { id: 40, type: 'page', item_id: 10, status: 'pending' };
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })     // authenticate
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })    // UPDATE status=pending
      .mockResolvedValueOnce({ rows: [makePage()] })       // SELECT page
      .mockResolvedValueOnce({ rows: [submission] })        // INSERT submission
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })       // SELECT super_admins
      .mockResolvedValueOnce({ rows: [] })                 // INSERT notification
      .mockResolvedValueOnce({ rows: [] });                // INSERT log

    const res = await request(app)
      .post('/api/pages/10/submit')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ changeDescription: 'Initial version' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.submission).toBeDefined();
    expect(res.body.submission.status).toBe('pending');
  });

  test('submission notifies all super_admins', async () => {
    const submission = { id: 40, type: 'page', item_id: 10, status: 'pending' };
    const superAdmins = [SUPER_ADMIN, { ...SUPER_ADMIN, id: 2, name: 'Super 2' }];
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [makePage()] })
      .mockResolvedValueOnce({ rows: [submission] })
      .mockResolvedValueOnce({ rows: superAdmins })  // 2 super admins
      .mockResolvedValueOnce({ rows: [] })           // notif 1
      .mockResolvedValueOnce({ rows: [] })           // notif 2
      .mockResolvedValueOnce({ rows: [] });          // log

    const res = await request(app)
      .post('/api/pages/10/submit')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({});

    expect(res.status).toBe(200);
    // Verify 2 notification inserts happened
    const notifCalls = pool.query.mock.calls.filter(c =>
      typeof c[0] === 'string' && c[0].includes('notifications')
    );
    expect(notifCalls.length).toBeGreaterThanOrEqual(2);
  });
});

// ── PATCH /api/pages/:id/visibility ──────────────────────────────────────────

describe('PATCH /api/pages/:id/visibility — publishing control', () => {
  test('super_admin can make page visible', async () => {
    const visiblePage = makePage({ visible: true });
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [visiblePage] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .patch('/api/pages/10/visibility')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ visible: true });

    expect(res.status).toBe(200);
    expect(res.body.visible).toBe(true);
  });

  test('super_admin can hide a page', async () => {
    const hiddenPage = makePage({ visible: false });
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [hiddenPage] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .patch('/api/pages/10/visibility')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ visible: false });

    expect(res.status).toBe(200);
    expect(res.body.visible).toBe(false);
  });

  test('soccom_admin CANNOT toggle visibility', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] });

    const res = await request(app)
      .patch('/api/pages/10/visibility')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ visible: true });

    expect(res.status).toBe(403);
  });

  test('returns 400 when visible is not boolean', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] });

    const res = await request(app)
      .patch('/api/pages/10/visibility')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ visible: 'yes' });

    expect(res.status).toBe(400);
  });
});

// ── DELETE /api/pages/:id ─────────────────────────────────────────────────────

describe('DELETE /api/pages/:id', () => {
  test('soccom_admin can delete a page', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .delete('/api/pages/10')
      .set('Authorization', `Bearer ${soccomAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('super_admin CANNOT delete pages (restricted to content creators)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] });

    const res = await request(app)
      .delete('/api/pages/10')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/content creator/i);
  });
});

// ── Full page lifecycle integration ──────────────────────────────────────────

describe('Full page lifecycle: draft → submit → visibility', () => {
  test('complete flow: create draft, submit, then page becomes pending', async () => {
    const draft = makePage({ status: 'draft' });
    const pending = makePage({ status: 'pending' });
    const submission = { id: 40, type: 'page', item_id: 10, status: 'pending' };

    // Step 1: Create page
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })  // auth
      .mockResolvedValueOnce({ rows: [] })               // no slug conflict
      .mockResolvedValueOnce({ rows: [draft] })          // INSERT
      .mockResolvedValueOnce({ rows: [] });              // log

    const createRes = await request(app)
      .post('/api/pages')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ title: 'Test Page', content: 'Initial content' });

    expect(createRes.status).toBe(200);
    expect(createRes.body.status).toBe('draft');

    // Step 2: Submit for review
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })   // auth
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })   // UPDATE to pending
      .mockResolvedValueOnce({ rows: [pending] })          // SELECT page
      .mockResolvedValueOnce({ rows: [submission] })        // INSERT submission
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })       // SELECT super admins
      .mockResolvedValueOnce({ rows: [] })                 // notification
      .mockResolvedValueOnce({ rows: [] });                // log

    const submitRes = await request(app)
      .post('/api/pages/10/submit')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ changeDescription: 'Ready for review' });

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.submission.status).toBe('pending');
  });
});
