const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// ── Test fixture users ────────────────────────────────────────────────────────
const SUPER_ADMIN = {
  id: 1,
  username: 'superadmin',
  name: 'Super Admin',
  email: 'superadmin@holyname.org',
  role: 'super_admin',
  password: '$2b$12$hashedpassword',
};

const SOCCOM_ADMIN = {
  id: 2,
  username: 'soccomadmin',
  name: 'SocCom Admin',
  email: 'soccom@holyname.org',
  role: 'soccom_admin',
  password: '$2b$12$hashedpassword',
};

const SOCCOM_ADMIN_2 = {
  id: 3,
  username: 'soccomadmin2',
  name: 'SocCom Admin 2',
  email: 'soccom2@holyname.org',
  role: 'soccom_admin',
  password: '$2b$12$hashedpassword',
};

// ── JWT helpers ───────────────────────────────────────────────────────────────
const makeToken = (user) =>
  jwt.sign(
    { userId: user.id, role: user.role, username: user.username },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

const superAdminToken = () => makeToken(SUPER_ADMIN);
const soccomAdminToken = () => makeToken(SOCCOM_ADMIN);
const soccomAdmin2Token = () => makeToken(SOCCOM_ADMIN_2);
const expiredToken = () =>
  jwt.sign({ userId: 1, role: 'super_admin', username: 'test' }, JWT_SECRET, { expiresIn: '-1s' });

// ── Fixture data ──────────────────────────────────────────────────────────────
const makePage = (overrides = {}) => ({
  id: 10,
  title: 'Test Page',
  slug: 'test-page',
  path: '/test-page',
  content: 'Hello world',
  template_id: null,
  author_id: 2,
  author_name: 'SocCom Admin',
  status: 'draft',
  visible: false,
  branch: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

const makeLivePage = (overrides = {}) =>
  makePage({ status: 'live', visible: true, ...overrides });

const makePost = (overrides = {}) => ({
  id: 20,
  title: 'Test Post',
  excerpt: 'Excerpt',
  content: 'Content',
  category: 'Parish Notice',
  images: ['/img/a.jpg', '/img/b.jpg'],
  author_id: 2,
  author_name: 'SocCom Admin',
  status: 'draft',
  visible: false,
  is_bulletin: false,
  is_pinned: false,
  pdf_url: null,
  event_date: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

const makeLivePost = (overrides = {}) =>
  makePost({ status: 'live', visible: true, ...overrides });

const makeTask = (overrides = {}) => ({
  id: 30,
  title: 'Test Task',
  description: 'Do something',
  priority: 'medium',
  due_date: '2025-12-31',
  assignee_id: 2,
  assignee_name: 'SocCom Admin',
  created_by: 1,
  created_by_name: 'Super Admin',
  status: 'pending',
  rejection_reason: null,
  rejected_by: null,
  rejected_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

const makeSubmission = (overrides = {}) => ({
  id: 40,
  type: 'page',
  item_id: 10,
  title: 'Test Page',
  content: 'Content',
  change_description: 'Initial submission',
  author_id: 2,
  author_name: 'SocCom Admin',
  submitted_at: new Date().toISOString(),
  status: 'pending',
  notes: '',
  comments: [],
  approved_by: null,
  approved_at: null,
  rejected_by: null,
  rejected_at: null,
  rejection_notes: null,
  ...overrides,
});

const makeNotification = (overrides = {}) => ({
  id: 50,
  user_id: 1,
  user_name: 'Super Admin',
  title: 'Test Notification',
  message: 'You have a new submission',
  type: 'info',
  related_type: 'submission',
  related_id: 40,
  is_read: false,
  created_at: new Date().toISOString(),
  ...overrides,
});

// ── Mock pool builder ──────────────────────────────────────────────────────────
// Creates a fresh mock pool + client with default empty responses.
// Individual tests override with mockResolvedValueOnce for specific queries.
const makeMockPool = () => {
  const mockClientQuery = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });
  const mockClient = {
    query: mockClientQuery,
    release: jest.fn(),
  };
  const mockQuery = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });
  const mockPool = {
    query: mockQuery,
    connect: jest.fn().mockResolvedValue(mockClient),
  };
  return { mockPool, mockClient, mockClientQuery, mockQuery };
};

module.exports = {
  SUPER_ADMIN,
  SOCCOM_ADMIN,
  SOCCOM_ADMIN_2,
  makeToken,
  superAdminToken,
  soccomAdminToken,
  soccomAdmin2Token,
  expiredToken,
  makePage,
  makeLivePage,
  makePost,
  makeLivePost,
  makeTask,
  makeSubmission,
  makeNotification,
  makeMockPool,
};
