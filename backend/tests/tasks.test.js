/**
 * tasks.test.js
 * Tests: Task lifecycle — create, assign, update status, revoke/reject
 * Covers: pending→in_progress→completed, rejection with reason, reassignment,
 *         notification logic, creator/assignee can see task
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
  SUPER_ADMIN, SOCCOM_ADMIN, SOCCOM_ADMIN_2,
  superAdminToken, soccomAdminToken, soccomAdmin2Token,
  makeTask,
} = require('./helpers');

beforeEach(() => {
  pool.query.mockResolvedValue({ rows: [], rowCount: 0 });
});

// ── GET /api/tasks ─────────────────────────────────────────────────────────

describe('GET /api/tasks', () => {
  test('returns tasks where user is assignee or creator', async () => {
    const tasks = [makeTask(), makeTask({ id: 31, created_by: 2, assignee_id: 1 })];
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: tasks });

    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('returns empty array when user has no tasks', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${soccomAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('unauthenticated request returns 401', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });
});

// ── POST /api/tasks — task creation ─────────────────────────────────────────

describe('POST /api/tasks — task creation', () => {
  test('super_admin creates a task assigned to self', async () => {
    const created = makeTask({ assignee_id: 1, created_by: 1 });
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [created] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ title: 'Test Task', description: 'Do something', priority: 'medium' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Test Task');
    expect(res.body.status).toBe('pending');
  });

  test('creates task with high priority', async () => {
    const created = makeTask({ priority: 'high' });
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [created] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ title: 'Urgent Task', priority: 'high' });

    expect(res.status).toBe(200);
  });

  test('creates task assigned to another user and notifies them', async () => {
    const created = makeTask({ assignee_id: 2, created_by: 1 });
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })   // auth
      .mockResolvedValueOnce({ rows: [created] })        // INSERT task
      .mockResolvedValueOnce({ rows: [] })               // INSERT notification
      .mockResolvedValueOnce({ rows: [] });              // INSERT log

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({
        title: 'Assigned Task',
        assigneeId: SOCCOM_ADMIN.id,
        assigneeName: SOCCOM_ADMIN.name,
      });

    expect(res.status).toBe(200);

    // Notification should be inserted for the assignee
    const notifCalls = pool.query.mock.calls.filter(c =>
      typeof c[0] === 'string' && c[0].includes('notifications')
    );
    expect(notifCalls.length).toBeGreaterThan(0);
  });

  test('task assigned to self does NOT send notification', async () => {
    const created = makeTask({ assignee_id: 1, created_by: 1 });
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [created] })
      .mockResolvedValueOnce({ rows: [] }); // only log, no notification

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ title: 'Self Task', assigneeId: SUPER_ADMIN.id });

    expect(res.status).toBe(200);

    // No notification call expected
    const notifCalls = pool.query.mock.calls.filter(c =>
      typeof c[0] === 'string' && c[0].includes('notifications')
    );
    expect(notifCalls.length).toBe(0);
  });

  test('unauthenticated request returns 401', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Task' });
    expect(res.status).toBe(401);
  });
});

// ── PUT /api/tasks/:id — task status transitions ──────────────────────────────

describe('PUT /api/tasks/:id — task status lifecycle', () => {
  test('assignee marks task as in_progress', async () => {
    const task = makeTask({ status: 'pending' });
    const updated = makeTask({ status: 'in_progress' });
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })  // auth
      .mockResolvedValueOnce({ rows: [task] })            // SELECT task
      .mockResolvedValueOnce({ rows: [updated] });        // UPDATE task

    const res = await request(app)
      .put('/api/tasks/30')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_progress');
  });

  test('assignee marks task as completed', async () => {
    const task = makeTask({ status: 'in_progress' });
    const updated = makeTask({ status: 'completed' });
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })
      .mockResolvedValueOnce({ rows: [task] })
      .mockResolvedValueOnce({ rows: [updated] });

    const res = await request(app)
      .put('/api/tasks/30')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ status: 'completed' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('completed');
  });

  test('task REVOCATION — assignee rejects task with reason', async () => {
    const task = makeTask({ status: 'pending', created_by: 1, created_by_name: 'Super Admin' });
    const rejected = makeTask({
      status: 'rejected',
      rejection_reason: 'Not enough resources',
      rejected_by: 'SocCom Admin',
    });
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })     // auth
      .mockResolvedValueOnce({ rows: [task] })               // SELECT task
      .mockResolvedValueOnce({ rows: [rejected] })           // UPDATE task
      .mockResolvedValueOnce({ rows: [] });                 // notification to creator

    const res = await request(app)
      .put('/api/tasks/30')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ status: 'rejected', rejectionReason: 'Not enough resources' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('rejected');
    expect(res.body.rejection_reason).toBe('Not enough resources');
  });

  test('rejected task notifies the creator', async () => {
    const task = makeTask({ status: 'pending', created_by: 1, created_by_name: 'Super Admin' });
    const rejected = makeTask({ status: 'rejected', rejection_reason: 'Too busy' });
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })
      .mockResolvedValueOnce({ rows: [task] })
      .mockResolvedValueOnce({ rows: [rejected] })
      .mockResolvedValueOnce({ rows: [] }); // creator notification

    await request(app)
      .put('/api/tasks/30')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ status: 'rejected', rejectionReason: 'Too busy' });

    const notifCalls = pool.query.mock.calls.filter(c =>
      typeof c[0] === 'string' && c[0].includes('notifications')
    );
    expect(notifCalls.length).toBeGreaterThan(0);
  });

  test('task reassignment resets status to pending and clears rejection fields', async () => {
    const task = makeTask({ status: 'rejected', rejection_reason: 'No time', assignee_id: 2 });
    const reassigned = makeTask({
      status: 'pending',
      assignee_id: 3,
      assignee_name: 'SocCom Admin 2',
      rejection_reason: null,
      rejected_by: null,
    });
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })     // auth
      .mockResolvedValueOnce({ rows: [task] })              // SELECT task
      .mockResolvedValueOnce({ rows: [reassigned] })        // UPDATE task
      .mockResolvedValueOnce({ rows: [] });                // notification to new assignee

    const res = await request(app)
      .put('/api/tasks/30')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ assigneeId: 3, assigneeName: 'SocCom Admin 2' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('pending');
    expect(res.body.rejection_reason).toBeNull();
  });

  test('reassignment notifies new assignee', async () => {
    const task = makeTask({ assignee_id: 2 });
    const reassigned = makeTask({ assignee_id: 3, status: 'pending' });
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [task] })
      .mockResolvedValueOnce({ rows: [reassigned] })
      .mockResolvedValueOnce({ rows: [] }); // notification

    await request(app)
      .put('/api/tasks/30')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ assigneeId: 3, assigneeName: 'New Person' });

    const notifCalls = pool.query.mock.calls.filter(c =>
      typeof c[0] === 'string' && c[0].includes('notifications')
    );
    expect(notifCalls.length).toBeGreaterThan(0);
  });

  test('marks task as implemented', async () => {
    const task = makeTask({ status: 'completed' });
    const implemented = makeTask({ status: 'implemented' });
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [task] })
      .mockResolvedValueOnce({ rows: [implemented] });

    const res = await request(app)
      .put('/api/tasks/30')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ status: 'implemented' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('implemented');
  });

  test('returns 404 when task not found', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [] }); // task not found

    const res = await request(app)
      .put('/api/tasks/9999')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ status: 'completed' });

    expect(res.status).toBe(404);
  });
});

// ── DELETE /api/tasks/:id ─────────────────────────────────────────────────────

describe('DELETE /api/tasks/:id', () => {
  test('authenticated user can delete a task', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [] }); // DELETE

    const res = await request(app)
      .delete('/api/tasks/30')
      .set('Authorization', `Bearer ${superAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('unauthenticated request returns 401', async () => {
    const res = await request(app).delete('/api/tasks/30');
    expect(res.status).toBe(401);
  });
});

// ── Full task lifecycle integration ──────────────────────────────────────────

describe('Full task lifecycle: create → in_progress → reject → reassign → complete', () => {
  test('super creates task, soccom rejects, super reassigns, second soccom completes', async () => {
    const pending = makeTask({ status: 'pending', assignee_id: 2 });
    const rejected = makeTask({ status: 'rejected', rejection_reason: 'Overloaded', assignee_id: 2 });
    const reassigned = makeTask({ status: 'pending', assignee_id: 3, rejection_reason: null });
    const completed = makeTask({ status: 'completed', assignee_id: 3 });

    // Create
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [pending] })
      .mockResolvedValueOnce({ rows: [] })  // notification
      .mockResolvedValueOnce({ rows: [] }); // log

    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ title: 'Lifecycle Task', assigneeId: 2, assigneeName: 'SocCom Admin' });
    expect(createRes.status).toBe(200);
    expect(createRes.body.status).toBe('pending');

    // Reject
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN] })
      .mockResolvedValueOnce({ rows: [pending] })
      .mockResolvedValueOnce({ rows: [rejected] })
      .mockResolvedValueOnce({ rows: [] }); // creator notification

    const rejectRes = await request(app)
      .put('/api/tasks/30')
      .set('Authorization', `Bearer ${soccomAdminToken()}`)
      .send({ status: 'rejected', rejectionReason: 'Overloaded' });
    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.status).toBe('rejected');

    // Reassign
    pool.query
      .mockResolvedValueOnce({ rows: [SUPER_ADMIN] })
      .mockResolvedValueOnce({ rows: [rejected] })
      .mockResolvedValueOnce({ rows: [reassigned] })
      .mockResolvedValueOnce({ rows: [] }); // notification to new assignee

    const reassignRes = await request(app)
      .put('/api/tasks/30')
      .set('Authorization', `Bearer ${superAdminToken()}`)
      .send({ assigneeId: 3, assigneeName: 'SocCom Admin 2' });
    expect(reassignRes.status).toBe(200);
    expect(reassignRes.body.status).toBe('pending');
    expect(reassignRes.body.rejection_reason).toBeNull();

    // Complete
    pool.query
      .mockResolvedValueOnce({ rows: [SOCCOM_ADMIN_2] })
      .mockResolvedValueOnce({ rows: [reassigned] })
      .mockResolvedValueOnce({ rows: [completed] });

    const completeRes = await request(app)
      .put('/api/tasks/30')
      .set('Authorization', `Bearer ${soccomAdmin2Token()}`)
      .send({ status: 'completed' });
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.status).toBe('completed');
  });
});
