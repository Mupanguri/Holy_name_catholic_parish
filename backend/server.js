require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const logger = require('./utils/logger');

// ============ SECURITY: JWT SECRET ============
// MUST be set via environment variable in production. Server will refuse to start without it.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set.');
  console.error('Please add JWT_SECRET to your .env file before starting the server.');
  process.exit(1);
}

// ============ INPUT VALIDATION SCHEMAS ============
const schemas = {
  pageCreate: Joi.object({
    title: Joi.string().min(1).max(255).required(),
    slug: Joi.string()
      .min(1)
      .max(255)
      .pattern(/^[a-z0-9-]+$/)
      .required(),
    content: Joi.string().max(50000).allow('', null),
    path: Joi.string().max(255).allow('', null),
    parentId: Joi.number().integer().positive().allow(null),
    templateId: Joi.string().max(100).allow('', null),
    visible: Joi.boolean().default(false),
    status: Joi.string().valid('draft', 'published').default('draft'),
    sections: Joi.any(), // Allow sections array from frontend
    changeDescription: Joi.string().max(1000).allow('', null),
    branch: Joi.string().max(100).allow('', null), // Branch field for community pages
  }),

  pageUpdate: Joi.object({
    title: Joi.string().min(1).max(255),
    slug: Joi.string()
      .min(1)
      .max(255)
      .pattern(/^[a-z0-9-]+$/),
    content: Joi.string().max(50000).allow('', null),
    path: Joi.string().max(255).allow('', null),
    parentId: Joi.number().integer().positive().allow(null),
    templateId: Joi.string().max(100).allow('', null),
    changeDescription: Joi.string().max(1000).allow('', null),
    sections: Joi.any(),
    branch: Joi.string().max(100).allow('', null),
  }),

  postCreate: Joi.object({
    title: Joi.string().min(1).max(255).required(),
    excerpt: Joi.string().max(500).allow('', null),
    content: Joi.string().max(100000).allow('', null),
    category: Joi.string().max(100).allow('', null),
    images: Joi.array().items(Joi.string()),
    visible: Joi.boolean().default(false),
    status: Joi.string().valid('draft', 'published').default('draft'),
    is_bulletin: Joi.boolean().default(false),
    is_pinned: Joi.boolean().default(false),
    pdf_url: Joi.string().max(500).allow('', null),
    event_date: Joi.string().allow('', null),
  }),

  postUpdate: Joi.object({
    title: Joi.string().min(1).max(255),
    excerpt: Joi.string().max(500).allow(''),
    content: Joi.string().max(100000).allow(''),
    category: Joi.string().max(100).allow(''),
    images: Joi.array().items(Joi.string()),
    is_bulletin: Joi.boolean().default(false),
    is_pinned: Joi.boolean().default(false),
    pdf_url: Joi.string().max(500).allow('', null),
    event_date: Joi.string().allow('', null),
  }),

  userCreate: Joi.object({
    username: Joi.string()
      .min(3)
      .max(50)
      .pattern(/^[a-zA-Z0-9_]+$/)
      .required(),
    password: Joi.string().min(6).max(100).required(),
    name: Joi.string().min(1).max(255).required(),
    email: Joi.string().email().max(255).allow(''),
    role: Joi.string().valid('super_admin', 'soccom_admin').default('soccom_admin'),
  }),

  userUpdate: Joi.object({
    username: Joi.string()
      .min(3)
      .max(50)
      .pattern(/^[a-zA-Z0-9_]+$/),
    password: Joi.string().min(6).max(100).allow(''),
    name: Joi.string().min(1).max(255),
    email: Joi.string().email().max(255).allow(''),
    role: Joi.string().valid('super_admin', 'soccom_admin'),
  }),

  mediaCreate: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    type: Joi.string().valid('image', 'video', 'document').required(),
    url: Joi.string().uri().max(500).required(),
    category: Joi.string().max(100).allow(''),
  }),

  login: Joi.object({
    username: Joi.string().min(1).max(100).required(),
    password: Joi.string().min(1).max(100).required(),
  }),

  // Submission review validation
  reviewSubmission: Joi.object({
    notes: Joi.string().max(1000).allow(''),
  }),

  // Visibility toggle validation
  visibilityToggle: Joi.object({
    visible: Joi.boolean().required(),
  }),
};

// Validation middleware
const validate = schema => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(d => d.message).join(', ');
    return res.status(400).json({ error: `Validation error: ${errors}` });
  }
  req.validatedBody = value;
  next();
};

// Centralized error handling helper
const handleError = (error, res, context = 'API endpoint') => {
  // Log the full error for debugging
  logger.error(`${context}:`, error);

  // Don't expose internal error details to clients
  if (error.code === '23505') {
    // PostgreSQL unique violation
    return res.status(409).json({ error: 'A record with this value already exists' });
  }
  if (error.code === '23503') {
    // PostgreSQL foreign key violation
    return res.status(400).json({ error: 'Invalid reference to related record' });
  }
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Authentication token expired' });
  }

  // Generic error response
  return res.status(500).json({ error: 'An internal server error occurred' });
};

// ============ APP SETUP ============
const app = express();
const PORT = process.env.PORT || 5000;

// ============ STATIC FILE SERVING ============
// Serve uploaded files from public/uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

// ============ MULTER FILE UPLOAD SETUP ============
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ];
    const allowedExts = /jpeg|jpg|png|gif|webp|svg|pdf|doc|docx|ppt|pptx|xls|xlsx|txt|csv$/i;
    const extname = allowedExts.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimes.includes(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: images, PDF, Word, PowerPoint, Excel, CSV'));
    }
  },
});

// ============ RATE LIMITING ============
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests, please try again later' },
  skip: req => req.path.includes('/api/logs') || req.path.includes('/api/media'),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts, please try again later' },
});

// Stricter limiter for write operations (POST/PUT/DELETE)
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many write requests, please try again later' },
});

// Strict limiter for user management operations
const userManagementLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many user management requests, please try again later' },
});

// ============ SECURITY: CORS ============
// ============ CORS CONFIGURATION ============
const allowedOrigins = [
  'http://localhost:3000',
  'https://holy-name-catholic-parish-htwr.vercel.app',
  'https://holy-name-catholic-parish.onrender.com'
];

const corsOptions = {
  origin: function(origin, callback) {
    // Allow all origins for now - can tighten later
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin'],
  optionsSuccessStatus: 204,
};

// ============ MIDDLEWARE ============
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(generalLimiter);
app.use(logger.middleware());
app.use(bodyParser.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', async () => {
    const duration = Date.now() - start;
    logger.performance('HTTP_REQUEST', duration, {
      method: req.method,
      path: req.path,
      status: res.statusCode,
    });
    try {
      if (db.pool) {
        await db.pool.query('INSERT INTO logs (action, user_name, details) VALUES ($1, $2, $3)', [
          'REQUEST',
          null,
          JSON.stringify({
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration: `${duration}ms`,
          }),
        ]);
      }
    } catch (e) {
      logger.warn('Database logging failed:', e.message);
    }
  });
  next();
});

// ============ AUTH MIDDLEWARE ============
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('DEBUG: Auth header:', authHeader ? authHeader.substring(0, 30) + '...' : 'none');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('DEBUG: Token decoded:', decoded);
    const result = await db.pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    console.log('DEBUG: User found:', result.rows.length > 0);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = result.rows[0];
    next();
  } catch (error) {
    console.log('DEBUG: Auth error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};

// SocCom Admin can create/edit/delete content but NOT review/publish
const requireSoccomAdmin = (req, res, next) => {
  if (req.user.role !== 'soccom_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// SocCom Admin ONLY - Super Admin cannot create content (strict)
const requireSoccomAdminOnly = (req, res, next) => {
  if (req.user.role !== 'soccom_admin') {
    return res.status(403).json({ error: 'Content creator access required' });
  }
  next();
};

// Both Super Admin and SocCom Admin can delete media
const requireMediaManager = (req, res, next) => {
  if (req.user.role !== 'soccom_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Super Admin CANNOT create content - only review and publish
const requireSuperAdminOnly = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res
      .status(403)
      .json({ error: 'Super admin only - content creators cannot access this' });
  }
  next();
};

// ============ AUTH ROUTES ============

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { username, password } = req.body;
  logger.info('Login attempt', { username, ip: req.ip });

  if (!username || !password) {
    logger.warn('Login failed: Missing credentials');
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    console.log('DEBUG: Login for user:', username, 'password length:', password?.length);
    const result = await db.pool.query('SELECT * FROM users WHERE username = $1', [username]);
    console.log('DEBUG: User found:', result.rows.length > 0);

    if (result.rows.length === 0) {
      logger.auth('LOGIN_FAILED', null, { username, reason: 'User not found' });
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    console.log('DEBUG: Stored password hash:', user.password.substring(0, 20) + '...');
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('DEBUG: Password valid:', isValidPassword);

    if (!isValidPassword) {
      logger.auth('LOGIN_FAILED', user.id, { username, reason: 'Invalid password' });
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.auth('LOGIN_SUCCESS', user.id, { username, role: user.role });

    res.json({
      success: true,
      user: { id: user.id, name: user.name, role: user.role, email: user.email },
      token,
    });
  } catch (error) {
    console.log('DEBUG: Login error:', error.message);
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// ============ USER MANAGEMENT (Super Admin Only) ============

app.get('/api/users', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const result = await db.pool.query(
      'SELECT id, username, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post(
  '/api/users',
  authenticate,
  requireSuperAdmin,
  userManagementLimiter,
  validate(schemas.userCreate),
  async (req, res) => {
    const { username, password, name, email, role } = req.validatedBody;
    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      const result = await db.pool.query(
        'INSERT INTO users (username, password, name, email, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, name, email, role',
        [username, hashedPassword, name, email, role || 'soccom_admin']
      );
      await db.pool.query('INSERT INTO logs (action, user_name, details) VALUES ($1, $2, $3)', [
        'USER_CREATE',
        req.user.username,
        JSON.stringify({ userId: result.rows[0].id, username }),
      ]);
      res.json(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') {
        res.status(400).json({ error: 'Username already exists' });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }
);

app.put(
  '/api/users/:id',
  authenticate,
  requireSuperAdmin,
  validate(schemas.userUpdate),
  async (req, res) => {
    const { username, password, name, email, role } = req.validatedBody;
    try {
      let query, params;
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 12);
        query =
          'UPDATE users SET username = $1, password = $2, name = $3, email = $4, role = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING id, username, name, email, role';
        params = [username, hashedPassword, name, email, role, req.params.id];
      } else {
        query =
          'UPDATE users SET username = $1, name = $2, email = $3, role = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, username, name, email, role';
        params = [username, name, email, role, req.params.id];
      }
      const result = await db.pool.query(query, params);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      await db.pool.query('INSERT INTO logs (action, user_name, details) VALUES ($1, $2, $3)', [
        'USER_UPDATE',
        req.user.username,
        JSON.stringify({ userId: req.params.id }),
      ]);
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

app.delete('/api/users/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    await db.pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    await db.pool.query('INSERT INTO logs (action, user_name, details) VALUES ($1, $2, $3)', [
      'USER_DELETE',
      req.user.username,
      JSON.stringify({ userId: req.params.id }),
    ]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ TEMPLATES ROUTES ============

// Get all available page templates
app.get('/api/templates', async (req, res) => {
  try {
    // Return template configuration - in production this could come from DB
    // For now, return the template categories and paths
    const templates = {
      categories: [
        { id: 'programs', label: 'Programs' },
        { id: 'contact', label: 'Contact' },
        { id: 'guilds', label: 'Guilds' },
        { id: 'youth', label: 'Youth' },
        { id: 'sections', label: 'Sections' },
        { id: 'events', label: 'Events' },
      ],
      paths: [
        { label: 'Programs', value: '/programs', children: [] },
        { label: 'Contact', value: '/contact', children: [] },
        {
          label: 'Guilds',
          value: '/about',
          children: [
            { label: 'Adult Guilds', value: '/about/adult-guilds', children: [] },
            { label: 'Youth Guilds', value: '/about/youth-guilds', children: [] },
          ],
        },
        {
          label: 'Youth',
          value: '/about',
          children: [
            { label: 'Youth Council', value: '/about/youth-council', children: [] },
            { label: 'CYA', value: '/about/cya', children: [] },
          ],
        },
        {
          label: 'Sections',
          value: '/sections',
          children: [
            { label: 'Parachute Regiment', value: '/sections/parachuteregime', children: [] },
            { label: 'Avondale West', value: '/sections/avondalew', children: [] },
            { label: 'Bloomingdale', value: '/sections/bloom', children: [] },
          ],
        },
      ],
    };
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PAGES ROUTES ============

app.get('/api/pages', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const branch = req.query.branch || null;

    let where = '';
    const params = [];

    if (branch) {
      where = 'WHERE branch = $1';
      params.push(branch);
    }

    const dataParams = [...params, limit, offset];
    const countParams = [...params];

    const whereClause = where ? where : 'WHERE 1=1';

    const [dataResult, countResult] = await Promise.all([
      db.pool.query(
        `SELECT * FROM pages ${whereClause} ORDER BY created_at DESC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams
      ),
      db.pool.query(`SELECT COUNT(*) FROM pages ${whereClause}`, countParams),
    ]);

    res.json({
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pages/tree - Get all pages as tree structure for branch selection
app.get('/api/pages/tree', async (req, res) => {
  try {
    const result = await db.pool.query(
      'SELECT id, title, slug, path, parent_id FROM pages ORDER BY path'
    );

    // Build tree structure from flat list
    const pages = result.rows;
    const pageMap = new Map();
    const roots = [];

    // First pass: create map
    pages.forEach(p => {
      pageMap.set(p.id, { ...p, children: [] });
    });

    // Second pass: build tree
    pages.forEach(p => {
      const node = pageMap.get(p.id);
      if (p.parent_id && pageMap.has(p.parent_id)) {
        pageMap.get(p.parent_id).children.push(node);
      } else {
        roots.push(node);
      }
    });

    res.json(roots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/pages/slug/:slug', async (req, res) => {
  try {
    const result = await db.pool.query('SELECT * FROM pages WHERE slug = $1', [req.params.slug]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/pages/:id', async (req, res) => {
  try {
    const result = await db.pool.query('SELECT * FROM pages WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/pages - SocCom Admin creates content (Super Admin cannot create)
app.post(
  '/api/pages',
  authenticate,
  requireSoccomAdmin,
  writeLimiter,
  validate(schemas.pageCreate),
  async (req, res) => {
    const { title, slug, path, content, templateId, visible, status, parentId, branch } =
      req.validatedBody;
    try {
      let finalSlug = slug;
      let finalPath = path;

      // If parentId is provided, auto-generate slug based on parent hierarchy
      if (parentId) {
        const parentResult = await db.pool.query('SELECT slug, path FROM pages WHERE id = $1', [
          parentId,
        ]);

        if (parentResult.rows.length > 0) {
          const parent = parentResult.rows[0];
          // Generate nested slug: parent-slug/child-slug
          const childSlug =
            slug ||
            title
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '');
          finalSlug = `${parent.slug}/${childSlug}`;
          // Build full path: parent-path/child-path
          finalPath = parent.path ? `${parent.path}/${childSlug}` : `/${childSlug}`;
        }
      }

      // Check for duplicate slug before inserting
      const existingPage = await db.pool.query('SELECT id FROM pages WHERE slug = $1', [finalSlug]);
      if (existingPage.rows.length > 0) {
        return res.status(400).json({
          error:
            'A page with this URL slug already exists. Please use a different title or edit the existing page.',
        });
      }

      const result = await db.pool.query(
        'INSERT INTO pages (title, slug, path, parent_id, content, template_id, author_id, author_name, status, visible, branch) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
        [
          title,
          finalSlug,
          finalPath,
          parentId || null,
          content,
          templateId,
          req.user.id,
          req.user.name,
          status || 'draft',
          visible || false,
          branch || null,
        ]
      );
      await db.pool.query('INSERT INTO logs (action, user_name, details) VALUES ($1, $2, $3)', [
        'PAGE_CREATE',
        req.user.username,
        JSON.stringify({ pageId: result.rows[0].id, title, parentId }),
      ]);
      res.json(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') {
        // PostgreSQL unique violation
        return res.status(400).json({
          error: 'A page with this URL slug already exists. Please use a different title.',
        });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

// PUT /api/pages/:id — any SocCom Admin can edit community pages
app.put(
  '/api/pages/:id',
  authenticate,
  requireSoccomAdmin,
  validate(schemas.pageUpdate),
  async (req, res) => {
    const { title, slug, path, content, templateId, parentId, branch } = req.validatedBody;
    try {
      const result = await db.pool.query(
        'UPDATE pages SET title = $1, slug = $2, path = $3, content = $4, template_id = $5, parent_id = $6, branch = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
        [title, slug, path, content, templateId, parentId || null, branch || null, req.params.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Page not found' });
      }
      await db.pool.query('INSERT INTO logs (action, user_name, details) VALUES ($1, $2, $3)', [
        'PAGE_UPDATE',
        req.user.username,
        JSON.stringify({ pageId: req.params.id }),
      ]);
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// PATCH /api/pages/:id/visibility - Super Admin only (publishing control)
app.patch('/api/pages/:id/visibility', authenticate, requireSuperAdminOnly, async (req, res) => {
  try {
    const result = await db.pool.query(
      'UPDATE pages SET visible = NOT visible, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }
    await db.pool.query('INSERT INTO logs (action, user_name, details) VALUES ($1, $2, $3)', [
      'PAGE_VISIBILITY_TOGGLE',
      req.user.username,
      JSON.stringify({ pageId: req.params.id, visible: result.rows[0].visible }),
    ]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/pages/:id - SocCom Admin ONLY deletes content (Super Admin cannot delete)
app.delete('/api/pages/:id', authenticate, requireSoccomAdminOnly, async (req, res) => {
  try {
    await db.pool.query('DELETE FROM pages WHERE id = $1', [req.params.id]);
    await db.pool.query('INSERT INTO logs (action, user_name, details) VALUES ($1, $2, $3)', [
      'PAGE_DELETE',
      req.user.username,
      JSON.stringify({ pageId: req.params.id }),
    ]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/pages/:id/submit - SocCom Admin submits for review
app.post('/api/pages/:id/submit', authenticate, requireSoccomAdmin, async (req, res) => {
  const { changeDescription } = req.body;
  try {
    await db.pool.query(
      "UPDATE pages SET status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [req.params.id]
    );
    const pageResult = await db.pool.query('SELECT * FROM pages WHERE id = $1', [req.params.id]);
    const submissionResult = await db.pool.query(
      "INSERT INTO submissions (type, item_id, title, content, change_description, author_id, author_name, status) VALUES ('page', $1, $2, $3, $4, $5, $6, 'pending') RETURNING *",
      [
        req.params.id,
        pageResult.rows[0].title,
        pageResult.rows[0].content,
        changeDescription || '',
        req.user.id,
        req.user.name,
      ]
    );
    const superAdmins = await db.pool.query(
      "SELECT id, name FROM users WHERE role = 'super_admin'"
    );
    for (const admin of superAdmins.rows) {
      await db.pool.query(
        `INSERT INTO notifications (user_id, user_name, title, message, type, related_type, related_id)
                 VALUES ($1, $2, $3, $4, 'submission', 'submission', $5)`,
        [
          admin.id,
          admin.name,
          'New Page Submission',
          `${req.user.name} submitted "${pageResult.rows[0].title}" for review`,
          submissionResult.rows[0].id,
        ]
      );
    }
    await db.pool.query('INSERT INTO logs (action, user_name, details) VALUES ($1, $2, $3)', [
      'PAGE_SUBMIT',
      req.user.username,
      JSON.stringify({ pageId: req.params.id }),
    ]);
    res.json({ success: true, submission: submissionResult.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ POSTS ROUTES ============

app.get('/api/posts', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const [dataResult, countResult] = await Promise.all([
      db.pool.query('SELECT * FROM posts ORDER BY created_at DESC LIMIT $1 OFFSET $2', [
        limit,
        offset,
      ]),
      db.pool.query('SELECT COUNT(*) FROM posts'),
    ]);
    res.json({
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get public posts only (approved, not rejected/pending) - for website display
app.get('/api/posts/public', async (req, res) => {
  try {
    const result = await db.pool.query(`
            SELECT p.* 
            FROM posts p
            LEFT JOIN submissions s ON s.item_id = p.id AND s.type = 'post'
            WHERE (p.status = 'live' OR p.visible = true)
            AND (s.status IS NULL OR s.status = 'approved')
            AND (s.status != 'rejected' OR s.status IS NULL)
            AND (s.status != 'pending' OR s.status IS NULL)
            ORDER BY p.created_at DESC
        `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get posts with their submission status (for admins to see their own posts)
// SocCom admins only see their own posts, Super admins see all
app.get('/api/posts/with-submission-status', authenticate, async (req, res) => {
  try {
    const user = req.user;
    let query = `
            SELECT p.*, s.status as submission_status, s.rejection_notes, s.rejected_at, s.rejected_by
            FROM posts p
            LEFT JOIN submissions s ON s.item_id = p.id AND s.type = 'post'
        `;

    // SocCom admins only see their own posts, super admins see all
    if (user.role === 'soccom_admin') {
      query += ` WHERE p.author_id = ${user.id}`;
    }

    query += ` ORDER BY p.created_at DESC`;

    const result = await db.pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ BULLETINS & PDF UPLOAD ============

// GET /api/bulletins — public, returns pinned bulletins + upcoming events
app.get('/api/bulletins', async (req, res) => {
  try {
    const result = await db.pool.query(`
            SELECT * FROM posts
            WHERE (status = 'live' OR visible = true)
              AND (is_bulletin = true OR category = 'Parish Notice' OR category = 'Event Report')
            ORDER BY is_pinned DESC, is_bulletin DESC, event_date ASC NULLS LAST, created_at DESC
            LIMIT 30
        `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/posts/:id - Get single post by ID
app.get('/api/posts/:id', async (req, res) => {
  try {
    const result = await db.pool.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/posts - SocCom Admin creates posts
app.post(
  '/api/posts',
  authenticate,
  requireSoccomAdmin,
  writeLimiter,
  validate(schemas.postCreate),
  async (req, res) => {
    const {
      title,
      excerpt,
      content,
      category,
      images,
      visible,
      status,
      is_bulletin,
      is_pinned,
      pdf_url,
      event_date,
    } = req.validatedBody;
    try {
      const result = await db.pool.query(
        `INSERT INTO posts (title, excerpt, content, category, images, author_id, author_name,
              status, visible, is_bulletin, is_pinned, pdf_url, event_date)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
        [
          title,
          excerpt,
          content,
          category,
          images || [],
          req.user.id,
          req.user.name,
          status || 'draft',
          visible || false,
          is_bulletin || false,
          is_pinned || false,
          pdf_url || null,
          event_date || null,
        ]
      );
      await db.pool.query('INSERT INTO logs (action, user_name, details) VALUES ($1, $2, $3)', [
        'POST_CREATE',
        req.user.username,
        JSON.stringify({ postId: result.rows[0].id, title }),
      ]);
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// PUT /api/posts/:id - SocCom Admin ONLY edits posts (Super Admin cannot edit)
app.put(
  '/api/posts/:id',
  authenticate,
  requireSoccomAdminOnly,
  validate(schemas.postUpdate),
  async (req, res) => {
    const {
      title,
      excerpt,
      content,
      category,
      images,
      is_bulletin,
      is_pinned,
      pdf_url,
      event_date,
    } = req.validatedBody;
    try {
      const result = await db.pool.query(
        `UPDATE posts SET title=$1, excerpt=$2, content=$3, category=$4, images=$5,
              is_bulletin=$6, is_pinned=$7, pdf_url=$8, event_date=$9,
              updated_at=CURRENT_TIMESTAMP WHERE id=$10 RETURNING *`,
        [
          title,
          excerpt,
          content,
          category,
          images || [],
          is_bulletin || false,
          is_pinned || false,
          pdf_url || null,
          event_date || null,
          req.params.id,
        ]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }
      await db.pool.query('INSERT INTO logs (action, user_name, details) VALUES ($1, $2, $3)', [
        'POST_UPDATE',
        req.user.username,
        JSON.stringify({ postId: req.params.id }),
      ]);
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// PATCH /api/posts/:id/visibility - Super Admin only (publishing control)
app.patch('/api/posts/:id/visibility', authenticate, requireSuperAdminOnly, async (req, res) => {
  try {
    const result = await db.pool.query(
      'UPDATE posts SET visible = NOT visible, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    await db.pool.query('INSERT INTO logs (action, user_name, details) VALUES ($1, $2, $3)', [
      'POST_VISIBILITY_TOGGLE',
      req.user.username,
      JSON.stringify({ postId: req.params.id, visible: result.rows[0].visible }),
    ]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/posts/:id - SocCom Admin ONLY deletes posts (Super Admin cannot delete)
app.delete('/api/posts/:id', authenticate, requireSoccomAdminOnly, async (req, res) => {
  try {
    await db.pool.query('DELETE FROM posts WHERE id = $1', [req.params.id]);
    await db.pool.query('INSERT INTO logs (action, user_name, details) VALUES ($1, $2, $3)', [
      'POST_DELETE',
      req.user.username,
      JSON.stringify({ postId: req.params.id }),
    ]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/posts/:id/submit - SocCom Admin submits for review
app.post('/api/posts/:id/submit', authenticate, requireSoccomAdmin, async (req, res) => {
  try {
    await db.pool.query(
      "UPDATE posts SET status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [req.params.id]
    );
    const postResult = await db.pool.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
    const submissionResult = await db.pool.query(
      "INSERT INTO submissions (type, item_id, title, content, author_id, author_name, status) VALUES ('post', $1, $2, $3, $4, $5, 'pending') RETURNING *",
      [
        req.params.id,
        postResult.rows[0].title,
        postResult.rows[0].content,
        req.user.id,
        req.user.name,
      ]
    );
    const superAdmins = await db.pool.query(
      "SELECT id, name FROM users WHERE role = 'super_admin'"
    );
    for (const admin of superAdmins.rows) {
      await db.pool.query(
        `INSERT INTO notifications (user_id, user_name, title, message, type, related_type, related_id)
                 VALUES ($1, $2, $3, $4, 'submission', 'submission', $5)`,
        [
          admin.id,
          admin.name,
          'New Post Submission',
          `${req.user.name} submitted "${postResult.rows[0].title}" for review`,
          submissionResult.rows[0].id,
        ]
      );
    }
    await db.pool.query('INSERT INTO logs (action, user_name, details) VALUES ($1, $2, $3)', [
      'POST_SUBMIT',
      req.user.username,
      JSON.stringify({ postId: req.params.id }),
    ]);
    res.json({ success: true, submission: submissionResult.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ MEDIA ROUTES ============

app.get('/api/media', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const [dataResult, countResult] = await Promise.all([
      db.pool.query('SELECT * FROM media ORDER BY uploaded_at DESC LIMIT $1 OFFSET $2', [
        limit,
        offset,
      ]),
      db.pool.query('SELECT COUNT(*) FROM media'),
    ]);
    res.json({
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/media/import - SocCom Admin ONLY imports media (Super Admin cannot import)
app.post('/api/media/import', authenticate, requireSoccomAdminOnly, async (req, res) => {
  try {
    const publicImagesPath = path.join(__dirname, '..', 'public', 'images');
    if (!fs.existsSync(publicImagesPath)) {
      return res.status(404).json({ error: 'Images folder not found' });
    }
    const files = fs.readdirSync(publicImagesPath);
    const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file));
    let imported = 0;
    for (const file of imageFiles) {
      const url = `/images/${file}`;
      const exists = await db.pool.query('SELECT id FROM media WHERE url = $1', [url]);
      if (exists.rows.length > 0) continue;
      await db.pool.query(
        'INSERT INTO media (name, type, url, category, uploaded_by, uploaded_at) VALUES ($1, $2, $3, $4, $5, NOW())',
        [file, 'image', url, 'images', req.user.username]
      );
      imported++;
    }
    res.json({ success: true, imported, total: imageFiles.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/media - SocCom Admin ONLY uploads media (Super Admin cannot upload)
app.post(
  '/api/media',
  authenticate,
  requireSoccomAdminOnly,
  writeLimiter,
  validate(schemas.mediaCreate),
  async (req, res) => {
    const { name, type, url, category } = req.validatedBody;
    try {
      const result = await db.pool.query(
        'INSERT INTO media (name, type, url, category, uploaded_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, type, url, category, req.user.name]
      );
      await db.pool.query('INSERT INTO logs (action, user_name, details) VALUES ($1, $2, $3)', [
        'MEDIA_UPLOAD',
        req.user.username,
        JSON.stringify({ mediaId: result.rows[0].id, name }),
      ]);
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// DELETE /api/media/:id - SocCom Admin ONLY deletes media (Super Admin cannot delete)
app.delete('/api/media/:id', authenticate, requireMediaManager, async (req, res) => {
  try {
    await db.pool.query('DELETE FROM media WHERE id = $1', [req.params.id]);
    await db.pool.query('INSERT INTO logs (action, user_name, details) VALUES ($1, $2, $3)', [
      'MEDIA_DELETE',
      req.user.username,
      JSON.stringify({ mediaId: req.params.id }),
    ]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ DOCUMENT REVISIONS ============

app.post('/api/documents/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    const { name, type, category, notes } = req.body;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let parentId = null;
    let newVersion = 1;

    if (req.body.parent_revision_id) {
      parentId = parseInt(req.body.parent_revision_id);
      const parent = await db.pool.query('SELECT * FROM document_revisions WHERE id = $1', [
        parentId,
      ]);
      if (parent.rows.length > 0) {
        newVersion = parent.rows[0].version + 1;
        const sizeDiff = file.size - parent.rows[0].size;
        if (sizeDiff !== 0) {
          await db.pool.query(
            `INSERT INTO notifications (user_id, user_name, title, message, type, related_type, related_id)
                         VALUES ($1, $2, $3, $4, 'warning', 'document', $5)`,
            [
              parent.rows[0].author_id,
              parent.rows[0].author_name,
              'Document Size Changed',
              `Your document "${parent.rows[0].name}" was edited. Size changed by ${formatBytes(sizeDiff)}. Version: ${newVersion}`,
              parentId,
            ]
          );
        }
      }
    }

    const result = await db.pool.query(
      `INSERT INTO document_revisions
             (name, original_name, type, mime_type, size, url, category, author_id, author_name, status, version, parent_revision_id, notes, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10, $11, $12, NOW())
             RETURNING *`,
      [
        name || file.originalname,
        file.originalname,
        type || 'document',
        file.mimetype,
        file.size,
        '/uploads/' + file.filename,
        category || 'documents',
        req.user.id,
        req.user.name,
        newVersion,
        parentId,
        notes || '',
      ]
    );

    const superAdmins = await db.pool.query(
      "SELECT id, name FROM users WHERE role = 'super_admin'"
    );
    for (const admin of superAdmins.rows) {
      await db.pool.query(
        `INSERT INTO notifications (user_id, user_name, title, message, type, related_type, related_id)
                 VALUES ($1, $2, $3, $4, 'info', 'document', $5)`,
        [
          admin.id,
          admin.name,
          'New Document Submitted',
          `${req.user.name} submitted "${name || file.originalname}" for review`,
          result.rows[0].id,
        ]
      );
    }

    res.json({ success: true, document: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SECURITY FIX: Corrected SQL injection vulnerability in dynamic query building.
// Previously used string concatenation instead of proper parameterized placeholders.
app.get('/api/documents', authenticate, async (req, res) => {
  try {
    const { status, author_id } = req.query;
    let query = 'SELECT * FROM document_revisions WHERE 1=1';
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND status = ${params.length}`;
    }
    if (author_id) {
      params.push(author_id);
      query += ` AND author_id = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';
    const result = await db.pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/documents/pending', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const result = await db.pool.query(
      "SELECT * FROM document_revisions WHERE status = 'pending' ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ VIDEO LINKS ============

// Get all video links (Super Admin sees all, SocCom sees only approved)
app.get('/api/video-links', authenticate, async (req, res) => {
  try {
    let query = 'SELECT * FROM video_links WHERE 1=1';
    const params = [];

    // SocCom admin only sees approved video links
    if (req.user.role === 'soccom_admin') {
      params.push('approved');
      query += ' AND status = $1';
    }

    query += ' ORDER BY created_at DESC';
    const result = await db.pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending video links (Super Admin only)
app.get('/api/video-links/pending', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const result = await db.pool.query(
      "SELECT * FROM video_links WHERE status = 'pending' ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit video link for approval (SocCom Admin only)
app.post('/api/video-links', authenticate, requireSoccomAdmin, async (req, res) => {
  try {
    const { url, title, description, thumbnail } = req.body;

    if (!url || !title) {
      return res.status(400).json({ error: 'URL and title are required' });
    }

    // Detect platform from URL
    let platform = 'other';
    if (url.includes('youtube.com') || url.includes('youtu.be')) platform = 'youtube';
    else if (url.includes('tiktok.com')) platform = 'tiktok';
    else if (url.includes('instagram.com')) platform = 'instagram';
    else if (url.includes('drive.google.com')) platform = 'google_drive';
    else if (url.includes('snapchat.com')) platform = 'snapchat';

    const result = await db.pool.query(
      `INSERT INTO video_links (url, title, description, thumbnail, platform, author_id, author_name, status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
             RETURNING *`,
      [url, title, description || '', thumbnail || '', platform, req.user.id, req.user.name]
    );

    // Notify super admins
    const superAdmins = await db.pool.query(
      "SELECT id, name FROM users WHERE role = 'super_admin'"
    );
    for (const admin of superAdmins.rows) {
      await db.pool.query(
        `INSERT INTO notifications (user_id, user_name, title, message, type, related_type, related_id)
                 VALUES ($1, $2, $3, $4, 'info', 'video_link', $5)`,
        [
          admin.id,
          admin.name,
          'New Video Link Submitted',
          `A new video link "${title}" has been submitted for review.`,
          result.rows[0].id,
        ]
      );
    }

    res.json({ success: true, videoLink: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Review video link (Super Admin only)
app.post('/api/video-links/:id/review', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { action, notes } = req.body;
    const videoId = req.params.id;

    const videoResult = await db.pool.query('SELECT * FROM video_links WHERE id = $1', [videoId]);
    if (videoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video link not found' });
    }

    const video = videoResult.rows[0];
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    await db.pool.query(
      'UPDATE video_links SET status = $1, reviewed_by = $2, reviewed_at = NOW(), review_notes = $3 WHERE id = $4',
      [newStatus, req.user.username, notes || '', videoId]
    );

    // Notify the submitter
    await db.pool.query(
      `INSERT INTO notifications (user_id, user_name, title, message, type, related_type, related_id)
             VALUES ($1, $2, $3, $4, $5, 'video_link', $6)`,
      [
        video.author_id,
        video.author_name,
        `Video Link ${newStatus === 'approved' ? 'Approved' : 'Rejected'}`,
        `Your video link "${video.title}" has been ${newStatus}. ${notes || ''}`,
        newStatus,
        videoId,
      ]
    );

    res.json({ success: true, status: newStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/documents/:id/review', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { action, notes } = req.body;
    const docId = req.params.id;

    const docResult = await db.pool.query('SELECT * FROM document_revisions WHERE id = $1', [
      docId,
    ]);
    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = docResult.rows[0];
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    await db.pool.query(
      'UPDATE document_revisions SET status = $1, reviewed_by = $2, reviewed_at = NOW(), review_notes = $3 WHERE id = $4',
      [newStatus, req.user.username, notes || '', docId]
    );

    // If approved, add to media table so it appears in gallery/library
    if (newStatus === 'approved') {
      // Check if already exists in media
      const existingMedia = await db.pool.query('SELECT id FROM media WHERE url = $1', [doc.url]);
      if (existingMedia.rows.length === 0) {
        // Determine category based on file type
        let category = 'images';
        if (doc.type === 'video') category = 'videos';
        else if (doc.type === 'document') category = 'documents';

        await db.pool.query(
          'INSERT INTO media (name, type, url, category, uploaded_by, uploaded_at) VALUES ($1, $2, $3, $4, $5, NOW())',
          [doc.name, doc.type, doc.url, category, doc.author_name]
        );
      }
    }

    await db.pool.query(
      `INSERT INTO notifications (user_id, user_name, title, message, type, related_type, related_id)
             VALUES ($1, $2, $3, $4, $5, 'document', $6)`,
      [
        doc.author_id,
        doc.author_name,
        action === 'approve' ? 'Document Approved' : 'Document Rejected',
        action === 'approve'
          ? `Your document "${doc.name}" (v${doc.version}) has been approved!`
          : `Your document "${doc.name}" (v${doc.version}) was not approved. Reason: ${notes || 'No reason provided'}`,
        action === 'approve' ? 'success' : 'error',
        docId,
      ]
    );

    res.json({ success: true, status: newStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ NOTIFICATIONS ============

app.get('/api/notifications/unread-count', authenticate, async (req, res) => {
  try {
    const result = await db.pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE (user_id = $1 OR user_name = $2) AND is_read = false',
      [req.user.id, req.user.username]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/notifications', authenticate, async (req, res) => {
  try {
    const result = await db.pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 OR user_name = $2 ORDER BY created_at DESC LIMIT 50',
      [req.user.id, req.user.username]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notifications/:id/read', authenticate, async (req, res) => {
  try {
    await db.pool.query('UPDATE notifications SET is_read = true WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notifications/read-all', authenticate, async (req, res) => {
  try {
    await db.pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 OR user_name = $2',
      [req.user.id, req.user.username]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/notifications/:id', authenticate, async (req, res) => {
  try {
    await db.pool.query('DELETE FROM notifications WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SUBMISSIONS ROUTES ============

// Get all submissions - super_admin sees all, soccom_admin sees all for approval
app.get('/api/submissions', authenticate, async (req, res) => {
  try {
    // Allow both super_admin and soccom_admin to view submissions
    const result = await db.pool.query('SELECT * FROM submissions ORDER BY submitted_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single submission by ID
app.get('/api/submissions/:id', authenticate, async (req, res) => {
  try {
    const result = await db.pool.query('SELECT * FROM submissions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/submissions/pending', authenticate, async (req, res) => {
  try {
    const result = await db.pool.query(
      "SELECT * FROM submissions WHERE status = 'pending' ORDER BY submitted_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/submissions/:id/approve', authenticate, async (req, res) => {
  const { notes } = req.body;
  try {
    const subResult = await db.pool.query('SELECT * FROM submissions WHERE id = $1', [
      req.params.id,
    ]);
    if (subResult.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    const submission = subResult.rows[0];
    const approvalDate = new Date();

    if (submission.type === 'page') {
      await db.pool.query(
        "UPDATE pages SET status = 'live', visible = true, approved_by = $1, approved_at = $2 WHERE id = $3",
        [req.user.name, approvalDate, submission.item_id]
      );
    } else if (submission.type === 'post') {
      await db.pool.query(
        "UPDATE posts SET status = 'live', visible = true, approved_by = $1, approved_at = $2 WHERE id = $3",
        [req.user.name, approvalDate, submission.item_id]
      );
    }

    await db.pool.query(
      "UPDATE submissions SET status = 'approved', approved_by = $1, approved_at = $2, notes = $3 WHERE id = $4",
      [req.user.name, approvalDate, notes || '', req.params.id]
    );
    await db.pool.query('INSERT INTO logs (action, user_name, details) VALUES ($1, $2, $3)', [
      'SUBMISSION_APPROVE',
      req.user.username,
      JSON.stringify({ submissionId: req.params.id }),
    ]);
    await db.pool.query(
      `INSERT INTO notifications (user_id, user_name, title, message, type, related_type, related_id)
             VALUES ($1, $2, $3, $4, 'success', 'submission', $5)`,
      [
        submission.author_id,
        submission.author_name,
        'Submission Approved',
        `Your ${submission.type} "${submission.title}" has been approved and published!`,
        req.params.id,
      ]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/submissions/:id/reject', authenticate, async (req, res) => {
  const { notes } = req.body;
  try {
    const subResult = await db.pool.query('SELECT * FROM submissions WHERE id = $1', [
      req.params.id,
    ]);
    if (subResult.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    const submission = subResult.rows[0];
    const rejectionDate = new Date();

    if (submission.type === 'page') {
      await db.pool.query("UPDATE pages SET status = 'draft', visible = false WHERE id = $1", [
        submission.item_id,
      ]);
    } else if (submission.type === 'post') {
      await db.pool.query("UPDATE posts SET status = 'draft', visible = false WHERE id = $1", [
        submission.item_id,
      ]);
    }

    await db.pool.query(
      "UPDATE submissions SET status = 'rejected', rejected_by = $1, rejected_at = $2, rejection_notes = $3 WHERE id = $4",
      [req.user.name, rejectionDate, notes || '', req.params.id]
    );
    await db.pool.query('INSERT INTO logs (action, user_name, details) VALUES ($1, $2, $3)', [
      'SUBMISSION_REJECT',
      req.user.username,
      JSON.stringify({ submissionId: req.params.id }),
    ]);
    await db.pool.query(
      `INSERT INTO notifications (user_id, user_name, title, message, type, related_type, related_id)
             VALUES ($1, $2, $3, $4, 'error', 'submission', $5)`,
      [
        submission.author_id,
        submission.author_name,
        'Submission Rejected',
        `Your ${submission.type} "${submission.title}" was rejected. Notes: ${notes || 'No notes provided'}`,
        req.params.id,
      ]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/submissions/:id/resubmit', authenticate, async (req, res) => {
  try {
    const subResult = await db.pool.query('SELECT * FROM submissions WHERE id = $1', [
      req.params.id,
    ]);
    if (subResult.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    const submission = subResult.rows[0];

    if (submission.status !== 'rejected') {
      return res.status(400).json({ error: 'Only rejected submissions can be resubmitted' });
    }
    if (submission.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the original author can resubmit' });
    }

    await db.pool.query(
      "UPDATE submissions SET status = 'pending', submitted_at = CURRENT_TIMESTAMP, rejected_by = NULL, rejected_at = NULL, rejection_notes = NULL WHERE id = $1",
      [req.params.id]
    );

    if (submission.type === 'page') {
      await db.pool.query("UPDATE pages SET status = 'pending', visible = false WHERE id = $1", [
        submission.item_id,
      ]);
    } else if (submission.type === 'post') {
      await db.pool.query("UPDATE posts SET status = 'pending', visible = false WHERE id = $1", [
        submission.item_id,
      ]);
    }

    const superAdmins = await db.pool.query(
      "SELECT id, name FROM users WHERE role = 'super_admin'"
    );
    for (const admin of superAdmins.rows) {
      await db.pool.query(
        `INSERT INTO notifications (user_id, user_name, title, message, type, related_type, related_id)
                 VALUES ($1, $2, $3, $4, 'submission', 'submission', $5)`,
        [
          admin.id,
          admin.name,
          'Submission Resubmitted',
          `${req.user.name} resubmitted "${submission.title}" for review`,
          req.params.id,
        ]
      );
    }

    await db.pool.query('INSERT INTO logs (action, user_name, details) VALUES ($1, $2, $3)', [
      'SUBMISSION_RESUBMIT',
      req.user.username,
      JSON.stringify({ submissionId: req.params.id }),
    ]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/submissions/:id/comment', authenticate, async (req, res) => {
  const { comment } = req.body;
  try {
    const commentObj = {
      id: uuidv4(),
      userId: req.user.id,
      userName: req.user.name,
      comment,
      createdAt: new Date().toISOString(),
    };
    await db.pool.query('UPDATE submissions SET comments = comments || $1 WHERE id = $2', [
      JSON.stringify([commentObj]),
      req.params.id,
    ]);
    res.json(commentObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/posts/upload-pdf — SocCom uploads a bulletin PDF
app.post(
  '/api/posts/upload-pdf',
  authenticate,
  requireSoccomAdmin,
  upload.single('pdf'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const url = '/uploads/' + req.file.filename;
      res.json({ success: true, url });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============ TASKS ROUTES ============

app.get('/api/tasks', authenticate, async (req, res) => {
  try {
    const result = await db.pool.query(
      'SELECT * FROM tasks WHERE assignee_id = $1 OR created_by = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', authenticate, async (req, res) => {
  const { title, description, priority, dueDate, assigneeId, assigneeName } = req.body;
  const taskAssigneeId = assigneeId || req.user.id;
  const taskAssigneeName = assigneeName || req.user.name;
  try {
    const result = await db.pool.query(
      "INSERT INTO tasks (title, description, priority, due_date, assignee_id, assignee_name, created_by, created_by_name, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending') RETURNING *",
      [
        title,
        description,
        priority || 'medium',
        dueDate,
        taskAssigneeId,
        taskAssigneeName,
        req.user.id,
        req.user.name,
      ]
    );
    if (taskAssigneeId !== req.user.id) {
      await db.pool.query(
        `INSERT INTO notifications (user_id, user_name, title, message, type, related_type, related_id)
                 VALUES ($1, $2, $3, $4, 'task', 'task', $5)`,
        [
          taskAssigneeId,
          taskAssigneeName,
          'New Task Assigned',
          `You have been assigned a new task: "${title}"`,
          result.rows[0].id,
        ]
      );
    }
    await db.pool.query('INSERT INTO logs (action, user_name, details) VALUES ($1, $2, $3)', [
      'TASK_CREATE',
      req.user.username,
      JSON.stringify({ taskId: result.rows[0].id }),
    ]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tasks/:id', authenticate, async (req, res) => {
  const { title, description, priority, dueDate, status } = req.body;
  try {
    const result = await db.pool.query(
      'UPDATE tasks SET title = $1, description = $2, priority = $3, due_date = $4, status = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [title, description, priority, dueDate, status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tasks/:id', authenticate, async (req, res) => {
  try {
    await db.pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ LOGS ROUTES (Super Admin Only) ============

app.get('/api/logs', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const result = await db.pool.query('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/logs/frontend', async (req, res) => {
  const { level, type, message, data, timestamp, userId, username, url, userAgent } = req.body;
  logger.info(`[FRONTEND] ${message}`, { type, data, userId, username, url });
  // Don't try to write to DB on every log - just return success
  res.json({ success: true });
});

app.get('/api/logs/screen-analysis', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const result = await db.pool.query(
      "SELECT * FROM logs WHERE action = 'SCREEN_ANALYSIS' ORDER BY timestamp DESC LIMIT $1",
      [limit]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Failed to get screen analysis logs:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/logs/frontend', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const type = req.query.type;
    const params = [limit];
    let query = `SELECT * FROM logs WHERE action IN ('SCREEN_ANALYSIS', 'PAGE_VIEW', 'USER_ACTION', 'CLICK', 'BUTTON_CLICK', 'LINK_CLICK')`;

    if (type) {
      params.push(type);
      query += ` AND action = $${params.length}`;
    }

    query += ` ORDER BY timestamp DESC LIMIT $1`;
    const result = await db.pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Failed to get frontend logs:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============ EMAIL ROUTE ============

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

app.post('/send-email', (req, res) => {
  const { name, email, message } = req.body;
  const mailOptions = {
    from: email,
    to: process.env.RECEIVER_EMAIL,
    subject: `New Message from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ success: false, message: 'Error sending email' });
    }
    res.status(200).json({ success: true, message: 'Email sent successfully' });
  });
});

// ============ HEALTH CHECK ============

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ HELPER FUNCTIONS ============

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============ GLOBAL ERROR HANDLER ============

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  if (err.message === 'Invalid file type. Allowed: images, PDF, Word, PowerPoint, Excel, CSV') {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 50MB' });
  }
  logger.error('UNHANDLED_ERROR', err.message, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// ============ START SERVER ============

const startServer = async () => {
  try {
    logger.info('Starting server...');

    logger.info('Checking/creating database...');
    await db.createDatabase();
    logger.success('Database ready!');

    logger.info('Initializing database tables...');
    await db.initDatabase();
    logger.success('Database tables initialized!');

    app.listen(PORT, () => {
      logger.startup('Backend Server', PORT);
      console.log('========================================');
      console.log('Holy Name Church - Backend Server');
      console.log(`Port: ${PORT}`);
      console.log(`Database: PostgreSQL (${process.env.DB_NAME})`);
      console.log('Log files: backend/logs/');
      console.log('========================================');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
