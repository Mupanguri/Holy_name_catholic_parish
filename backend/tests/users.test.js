/**
 * users.test.js
 * Tests: User addition, user profile management (CRUD), role enforcement
 * Covers: GET/POST/PUT/DELETE /api/users — super_admin only
 *         Cannot delete own account, duplicate username, password hashing
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
  hash: jest.fn().mockResolvedValue('$2b$12$hashedpw'),
  compare: jest.fn().mockResolvedValue(true),
}));

const request = require('supertest');
const bcrypt  = require('bcrypt');
const { app } = require('../server');
const { pool } = require('../db');
const {
  SUPER_ADMIN, SOCCOM_ADMIN,
  superAdminToken, soccomAdminToken,
} = require('./helpers');

beforeEach(() => {
  pool.query.mockResolvedValue({ rows: [], rowCount: 0 });
});

const NEW_USER = {
  id: 99,
  username: 'newuser',
  name: 'New User',
  email: 'new@holyname.org',
  role: 'soccom_admin',
};

// ── GET /api/users ────────────────────────────────────────────────────────────

describe('GET /api/users', () => {
  test('super_admin gets list of all users', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })          // authenticate
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN, SOCCOM_ADMIN] }); // user list

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
  });

  test('soccom_admin is forbidden from listing users', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] }); // authenticate

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${soccomAdminToken()}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/super admin/i);
  });

  test('unauthenticated request returns 401', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });
});

// ── POST /api/users (user addition) ──────────────────────────────────────────

describe('POST /api/users — user addition', () => {
  test('super_admin creates a new soccom_admin user', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })  // authenticate
      .mockResolvedValueOnce({ rows: [NEW_USER] })      // INSERT user
      .mockResolvedValueOnce({ rows: [] });             // INSERT log

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({
        username: 'newuser',
        password: 'securePass1',
        name: 'New User',
        email: 'new@holyname.org',
        role: 'soccom_admin',
      });

    expect(res.status).toBe(200);
    expect(res.body.username).toBe('newuser');
    expect(res.body.role).toBe('soccom_admin');
    expect(res.body.password).toBeUndefined();
  });

  test('password is hashed before storing', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [NEW_USER] })
      .mockResolvedValueOnce({ rows: [] });

    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({
        username: 'newuser', password: 'plaintext123',
        name: 'New User', email: 'new@holyname.org', role: 'soccom_admin',
      });

    expect(bcrypt.hash).toHaveBeenCalledWith('plaintext123', 12);
  });

  test('creates super_admin role when specified', async () => {
    const superUser = { ...NEW_USER, role: 'super_admin' };
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [superUser] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({
        username: 'newsuper', password: 'securePass1',
        name: 'New Super', email: 'super2@holyname.org', role: 'super_admin',
      });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('super_admin');
  });

  test('soccom_admin cannot create users', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] });

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ username: 'hack', password: 'pw', name: 'Hacker', role: 'super_admin' });

    expect(res.status).toBe(403);
  });

  test('returns 400 for duplicate username', async () => {
    const dupError = new Error('duplicate key');
    dupError.code = '23505';
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockRejectedValueOnce(dupError);

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ username: 'admin', password: 'pw123456', name: 'Dup', role: 'soccom_admin' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already exists/i);
  });

  test('returns 400 for invalid email format', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] });

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ username: 'valid', password: 'pw123456', name: 'Valid', email: 'not-an-email', role: 'soccom_admin' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/validation/i);
  });

  test('returns 400 for username too short (< 3 chars)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] });

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ username: 'ab', password: 'pw123456', name: 'Short', role: 'soccom_admin' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/validation/i);
  });

  test('returns 400 for password too short (< 6 chars)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] });

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ username: 'validname', password: 'abc', name: 'Valid', role: 'soccom_admin' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/validation/i);
  });

  test('returns 400 for invalid role value', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] });

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ username: 'validname', password: 'abc123', name: 'Valid', role: 'god_mode' });

    expect(res.status).toBe(400);
  });

  test('username with special chars returns 400', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] });

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ username: 'user name!', password: 'abc123', name: 'Valid', role: 'soccom_admin' });

    expect(res.status).toBe(400);
  });
});

// ── PUT /api/users/:id (user profile management) ─────────────────────────────

describe('PUT /api/users/:id — profile management', () => {
  test('super_admin can update user name and email', async () => {
    const updated = { ...SOCCOM_ADMIN, name: 'Updated Name', email: 'updated@test.com' };
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })  // authenticate
      .mockResolvedValueOnce({ rows: [updated] })       // UPDATE user
      .mockResolvedValueOnce({ rows: [] });             // INSERT log

    const res = await request(app)
      .put('/api/users/2')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ username: 'soccomadmin', name: 'Updated Name', email: 'updated@test.com', role: 'soccom_admin' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Name');
  });

  test('super_admin can change user role', async () => {
    const promoted = { ...SOCCOM_ADMIN, role: 'super_admin' };
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [promoted] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .put('/api/users/2')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ username: 'soccomadmin', name: 'SocCom Admin', role: 'super_admin' });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('super_admin');
  });

  test('password is re-hashed when updated', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })
      .mockResolvedValueOnce({ rows: [] });

    await request(app)
      .put('/api/users/2')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ username: 'soccomadmin', name: 'SocCom Admin', role: 'soccom_admin', password: 'newpassword123' });

    expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 12);
  });

  test('returns 404 when user not found', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [] }); // UPDATE returns empty

    const res = await request(app)
      .put('/api/users/999')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ username: 'ghost', name: 'Ghost', role: 'soccom_admin' });

    expect(res.status).toBe(404);
  });

  test('soccom_admin cannot update users', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] });

    const res = await request(app)
      .put('/api/users/1')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ username: 'superadmin', name: 'Hacked', role: 'super_admin' });

    expect(res.status).toBe(403);
  });
});

// ── DELETE /api/users/:id ─────────────────────────────────────────────────────

describe('DELETE /api/users/:id', () => {
  test('super_admin can delete another user', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })  // authenticate
      .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // DELETE
      .mockResolvedValueOnce({ rows: [] });             // INSERT log

    const res = await request(app)
      .delete('/api/users/2')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('super_admin cannot delete their own account', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SUPER_ADMIN] }); // authenticate

    const res = await request(app)
      .delete(`/api/users/${SUPER_ADMIN.id}`)
      .set('Authorization', `Bearer ${superAdminToken()}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/own account/i);
  });

  test('soccom_admin cannot delete users', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] });

    const res = await request(app)
      .delete('/api/users/1')
      .set('Authorization', `Bearer ${soccomAdminToken()}`);

    expect(res.status).toBe(403);
  });

  test('unauthenticated request returns 401', async () => {
    const res = await request(app).delete('/api/users/2');
    expect(res.status).toBe(401);
  });
});
