require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
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
      .allow('', null),
    content: Joi.string().max(50000).allow('', null),
    path: Joi.string().max(255).allow('', null),
    parentId: Joi.number().integer().positive().allow(null),
    templateId: Joi.string().max(100).allow('', null),
    visible: Joi.boolean().default(false),
    status: Joi.string().valid('draft', 'published').default('draft'),
    sections: Joi.any(), // Allow sections array from frontend
    changeDescription: Joi.string().max(1000).allow('', null),
    branch: Joi.string().max(100).allow('', null),
    attached_documents: Joi.array().items(Joi.object()).allow(null),
    attached_videos: Joi.array().items(Joi.object()).allow(null),
  }),

  pageUpdate: Joi.object({
    title: Joi.string().min(1).max(255),
    slug: Joi.string()
      .min(1)
      .max(255)
      .pattern(/^[a-z0-9/-]+$/),
    content: Joi.string().max(50000).allow('', null),
    path: Joi.string().max(255).allow('', null),
    parentId: Joi.number().integer().positive().allow(null),
    templateId: Joi.string().max(100).allow('', null),
    changeDescription: Joi.string().max(1000).allow('', null),
    preview_image: Joi.string().max(500).allow('', null),
    attached_documents: Joi.array().items(Joi.object()).allow(null),
    attached_videos: Joi.array().items(Joi.object()).allow(null),
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
    preview_image: Joi.string().max(500).allow('', null),
    attached_documents: Joi.array().items(Joi.object()).allow(null),
    attached_videos: Joi.array().items(Joi.object()).allow(null),
    image_layouts: Joi.object().allow(null),
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
    preview_image: Joi.string().max(500).allow('', null),
    attached_documents: Joi.array().items(Joi.object()).allow(null),
    attached_videos: Joi.array().items(Joi.object()).allow(null),
    image_layouts: Joi.object().allow(null),
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

  videoLinkCreate: Joi.object({
    url: Joi.string().uri({ scheme: ['http', 'https'] }).max(500).required(),
    title: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000).allow('', null),
    thumbnail: Joi.string().uri({ scheme: ['http', 'https'] }).max(500).allow('', null),
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

// ============ SECURITY HEADERS (helmet) ============
app.use(helmet({
  // Allow uploaded files (images, PDFs) to be loaded cross-origin by the React frontend
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // Disable CSP for API-only server; React SPA on Vercel manages its own CSP
  contentSecurityPolicy: false,
  // HSTS: tell browsers to always use HTTPS
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// ============ STATIC FILE SERVING ============
// Images served inline; all other uploads (PDFs, docs, SVGs) forced to download
// to prevent in-browser rendering of potentially malicious files.
const INLINE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads'), {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.svg') {
      // SVG can run scripts when rendered inline — force download
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', 'attachment');
    } else if (!INLINE_EXTS.has(ext)) {
      res.setHeader('Content-Disposition', 'attachment');
    }
  },
}));

// ============ MULTER FILE UPLOAD SETUP ============
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const SAFE_EXT_MAP = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif',
  'image/webp': '.webp', 'image/svg+xml': '.svg',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'text/plain': '.txt', 'text/csv': '.csv',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Use MIME-derived extension only — prevents path traversal via crafted filenames
    const safeExt = SAFE_EXT_MAP[file.mimetype] || '.bin';
    cb(null, uuidv4() + safeExt);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
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

const isTestEnv = () => process.env.NODE_ENV === 'test';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts, please try again later' },
  skip: () => isTestEnv(),
});

// Stricter limiter for write operations (POST/PUT/DELETE)
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many write requests, please try again later' },
  skip: () => isTestEnv(),
});

// Strict limiter for user management operations
const userManagementLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many user management requests, please try again later' },
  skip: () => isTestEnv(),
});

// Strict limiter for public contact form
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Too many messages sent. Please try again later.' },
  skip: () => isTestEnv(),
});

// ============ SECURITY: CORS ============
// ============ CORS CONFIGURATION ============
const allowedOrigins = [
  'http://localhost:3000',
  'http://23.20.179.157',
  'https://holy-name-catholic-parish-htwr.vercel.app',
  'https://holy-name-catholic-parish.onrender.com',
  process.env.FRONTEND_URL,         // set in .env on AWS: FRONTEND_URL=https://23.20.179.157
  process.env.FRONTEND_WWW_URL,     // set in .env on AWS: FRONTEND_WWW_URL=https://23.20.179.157
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // In production, require an explicit origin. Allow no-origin only in development (curl, tools).
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error('CORS: requests without an origin are not allowed in production'));
      }
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin ${origin} not allowed`));
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
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

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
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await db.pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = result.rows[0];
    next();
  } catch (error) {
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

// Non-blocking auth check — returns true if request carries a valid token.
// Used to conditionally filter draft content from public API responses.
const isAuthenticated = req => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return false;
    jwt.verify(header.substring(7), JWT_SECRET);
    return true;
  } catch {
    return false;
  }
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
    const result = await db.pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      logger.auth('LOGIN_FAILED', null, { username, reason: 'User not found' });
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      logger.auth('LOGIN_FAILED', user.id, { username, reason: 'Invalid password' });
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: '4h' }
    );

    logger.auth('LOGIN_SUCCESS', user.id, { username, role: user.role });

    res.json({
      success: true,
      user: { id: user.id, name: user.name, role: user.role, email: user.email },
      token,
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// ============ SEED SYSTEM PAGES (Super Admin Only) ============
// Seeds all hardcoded React component pages into the DB so admins can manage them
app.post('/api/admin/seed-pages', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    // List of all hardcoded pages with their hierarchy
    // Format: { title, slug, path, page_type, branch, parent_slug }
    const systemPages = [
      // ---- TOP-LEVEL SECTIONS ----
      { title: 'Home', slug: 'home', path: '/', page_type: 'leaf', branch: null },
      { title: 'About', slug: 'about', path: '/about', page_type: 'leaf', branch: null },
      { title: 'News & Posts', slug: 'posts', path: '/posts', page_type: 'leaf', branch: null },
      { title: 'Communities', slug: 'communities', path: '/communities', page_type: 'branch', branch: null },
      { title: 'Events', slug: 'events', path: '/events', page_type: 'branch', branch: null },
      { title: 'Gallery', slug: 'gallery', path: '/gallery', page_type: 'leaf', branch: null },
      { title: 'Programs', slug: 'programs', path: '/programs', page_type: 'leaf', branch: null },
      { title: 'Library', slug: 'library', path: '/library', page_type: 'leaf', branch: null },
      { title: 'International Outreach', slug: 'international-outreach', path: '/international-outreach', page_type: 'leaf', branch: null },
      {
        title: 'Contact Us',
        slug: 'contact',
        path: '/contact',
        page_type: 'leaf',
        branch: null,
        content: JSON.stringify({
          title: 'Contact Us',
          subtitle: 'Get in touch with Holy Name Parish',
          contacts: [
            {
              field: 'Contacts', color: 'bg-blue-parish', hoverColor: 'hover:bg-blue-dark',
              subFields: [
                { subField: 'Parish Office', numbers: [{ number: '+263 242 306345', email: 'holynamemabelreign@gmail.com' }] },
                { subField: 'Parish Priest', numbers: [{ name: 'Fr Ndhlalambi', number: '+263772402220', email: 'jndhlalambi@gmail.com' }] },
                { subField: 'Assistant Parish Priest', numbers: [{ name: 'Fr Jingisoni', number: '+263772300024', email: 'giftjingison@gmail.com' }] },
              ],
            },
            {
              field: 'Guilds', color: 'bg-[#2E7D32]', hoverColor: 'hover:bg-[#1B5E20]',
              subFields: [
                { subField: 'Emily Mari', numbers: [{ name: 'Emily Mari', number: '+263777163212' }] },
                { subField: 'Sacred Heart Youth Guild', numbers: [{ name: 'Chairperson: Arthur Hukama', number: '+263 783808377' }] },
                { subField: 'Hosi Yedenga', numbers: [{ name: 'Mrs M Choto', number: '+263772847374' }, { name: 'Mrs P Mautsa', number: '+263733756454' }] },
              ],
            },
            {
              field: 'Sections', color: 'bg-[#C9A84C]', hoverColor: 'hover:bg-[#b8973f]', textColor: 'text-gray-900',
              subFields: [
                { subField: 'Parachute Regiment', numbers: [{ name: 'Mr V Mudimu', number: '+263773382139' }] },
                { subField: 'Bloomingdale', numbers: [{ name: 'Mr Chisuro', number: '+263781907444' }] },
                { subField: 'Meyrick Park', numbers: [{ name: 'Mrs Thoko Nyandoro', number: '+263772423383' }] },
              ],
            },
            {
              field: 'Groups', color: 'bg-[#BA0021]', hoverColor: 'hover:bg-[#9a001c]',
              subFields: [
                { subField: 'SOCCOM', numbers: [{ name: 'Mr D Kunaka', number: '+263 775063153' }, { name: 'Hunter Mupfurutsa', number: '+263 789864886' }] },
                { subField: 'Catechesis', numbers: [{ name: 'Mr Felix Manyimbiri', number: '+263772392965' }] },
                { subField: 'Ministry of Matrimony', numbers: [{ name: 'Mr Felix Manyimbiri', number: '+263772392965' }] },
                { subField: 'Family Apostolate', numbers: [{ name: 'Ms Leonora Mawire', number: '+263 774161458' }] },
              ],
            },
          ],
        }),
      },

      // ---- SECTIONS ----
      { title: 'Parachute Regiment', slug: 'communities/sections/parachute-regiment', path: '/communities/sections/parachute-regiment', page_type: 'leaf', branch: 'sections', parent_slug: 'communities' },
      { title: 'Avondale West', slug: 'communities/sections/avondale-west', path: '/communities/sections/avondale-west', page_type: 'leaf', branch: 'sections', parent_slug: 'communities' },
      { title: 'Bloomingdale', slug: 'communities/sections/bloomingdale', path: '/communities/sections/bloomingdale', page_type: 'leaf', branch: 'sections', parent_slug: 'communities' },
      { title: 'Meyrick Park', slug: 'communities/sections/meyrick-park', path: '/communities/sections/meyrick-park', page_type: 'leaf', branch: 'sections', parent_slug: 'communities' },
      { title: 'Cotswold Hills', slug: 'communities/sections/cotswold-hills', path: '/communities/sections/cotswold-hills', page_type: 'leaf', branch: 'sections', parent_slug: 'communities' },
      { title: 'Mabelreign Central', slug: 'communities/sections/mabelreign-central', path: '/communities/sections/mabelreign-central', page_type: 'leaf', branch: 'sections', parent_slug: 'communities' },
      { title: 'Haig Park', slug: 'communities/sections/haig-park', path: '/communities/sections/haig-park', page_type: 'leaf', branch: 'sections', parent_slug: 'communities' },

      // ---- CHOIR ----
      {
        title: 'English Choir', slug: 'communities/choir/english', path: '/communities/choir/english', page_type: 'leaf', branch: 'choir', parent_slug: 'communities',
        content: JSON.stringify([
          { id: 'intro', title: 'Introduction', data: { heading: 'Holy Name Mabelreign English Choir', body: 'Singing is a vital part of liturgy, enhancing worship and uplifting the congregation. The English Choir at Holy Name Mabelreign has played a key role in bringing vibrancy to the English Mass, fostering active participation and praise.' } },
          { id: 'history', title: 'History', data: { heading: 'History', body: 'Established in the early 1980s, the choir has undergone significant changes, from the early days of organ music to the integration of guitars and youth participation. Notable leaders and musicians, such as Mrs. Nyahasha and Mr. Chichi, have shaped its growth, making the choir a vital part of parish life.' } },
          { id: 'achievements', title: 'Achievements', data: { heading: 'Achievements', body: 'Recorded and released a CD in 2014 under the leadership of Mrs. Stella Muza.\nCompiled a local hymn book with 25 copies for choir members.\nPrepared for a second CD recording in collaboration with St. John\'s High School.' } },
          { id: 'membership', title: 'Membership', data: { heading: 'Membership Dynamics', body: 'The English Choir has around 30 active members, with a fluid membership as individuals join or leave. Youth involvement remains a focus, with notable young talents actively participating.' } },
          { id: 'collab', title: 'Collaboration', data: { heading: 'Collaboration', body: 'The choir collaborates with the Shona Choir for combined Masses and community events, such as weddings and interdenominational services during Christmas and Easter. They also host an annual Christmas carol service.' } },
        ]),
      },
      { title: 'Shona Choir', slug: 'communities/choir/shona', path: '/communities/choir/shona', page_type: 'leaf', branch: 'choir', parent_slug: 'communities' },

      // ---- COMMITTEES ----
      { title: 'Main Governing Committee', slug: 'communities/committees/main-gov', path: '/communities/committees/main-gov', page_type: 'leaf', branch: 'committees', parent_slug: 'communities' },
      { title: 'Family Apostolate', slug: 'communities/committees/family-apostolate', path: '/communities/committees/family-apostolate', page_type: 'leaf', branch: 'committees', parent_slug: 'communities' },
      { title: 'Youth Council', slug: 'communities/committees/youth-council', path: '/communities/committees/youth-council', page_type: 'branch', branch: 'committees', parent_slug: 'communities' },
      { title: 'Altar Servers', slug: 'communities/committees/altar-servers', path: '/communities/committees/altar-servers', page_type: 'branch', branch: 'committees', parent_slug: 'communities' },
      { title: 'Missionary Childhood', slug: 'communities/committees/missionary-childhood', path: '/communities/committees/missionary-childhood', page_type: 'branch', branch: 'committees', parent_slug: 'communities' },

      // ---- SUPPORT TEAMS ----
      { title: 'SocCom', slug: 'communities/support-teams/soccom', path: '/communities/support-teams/soccom', page_type: 'leaf', branch: 'support-teams', parent_slug: 'communities' },
      { title: 'Catechesis', slug: 'communities/support-teams/catechesis', path: '/communities/support-teams/catechesis', page_type: 'leaf', branch: 'support-teams', parent_slug: 'communities' },
      { title: 'CCR', slug: 'communities/support-teams/ccr', path: '/communities/support-teams/ccr', page_type: 'leaf', branch: 'support-teams', parent_slug: 'communities' },

      // ---- ADULT GUILDS ----
      { title: 'Chemwoyo Guild', slug: 'communities/adult-guilds/chemwoyo', path: '/communities/adult-guilds/chemwoyo', page_type: 'leaf', branch: 'adult-guilds', parent_slug: 'communities' },
      { title: 'Cha Mariya Guild', slug: 'communities/adult-guilds/chamariya', path: '/communities/adult-guilds/chamariya', page_type: 'leaf', branch: 'adult-guilds', parent_slug: 'communities' },
      { title: 'St Anne Guild', slug: 'communities/adult-guilds/st-anne', path: '/communities/adult-guilds/st-anne', page_type: 'branch', branch: 'adult-guilds', parent_slug: 'communities' },
      { title: 'St Joachim Guild', slug: 'communities/adult-guilds/st-joachim', path: '/communities/adult-guilds/st-joachim', page_type: 'branch', branch: 'adult-guilds', parent_slug: 'communities' },
      { title: 'St Joseph Guild', slug: 'communities/adult-guilds/st-joseph', path: '/communities/adult-guilds/st-joseph', page_type: 'branch', branch: 'adult-guilds', parent_slug: 'communities' },

      // ---- YOUTH GUILDS ----
      { title: 'Moyo Musande Guild', slug: 'communities/youth-guilds/musande', path: '/communities/youth-guilds/musande', page_type: 'leaf', branch: 'youth-guilds', parent_slug: 'communities' },
      { title: 'Agnes & Alois Guild', slug: 'communities/youth-guilds/agnes-alois', path: '/communities/youth-guilds/agnes-alois', page_type: 'branch', branch: 'youth-guilds', parent_slug: 'communities' },
      { title: 'St Peter & Mary Guild', slug: 'communities/youth-guilds/st-peter-mary', path: '/communities/youth-guilds/st-peter-mary', page_type: 'branch', branch: 'youth-guilds', parent_slug: 'communities' },
      { title: 'St Mary Youth Guild', slug: 'communities/youth-guilds/st-mary-youth', path: '/communities/youth-guilds/st-mary-youth', page_type: 'branch', branch: 'youth-guilds', parent_slug: 'communities' },
      { title: 'CYA', slug: 'communities/youth-guilds/cya', path: '/communities/youth-guilds/cya', page_type: 'branch', branch: 'youth-guilds', parent_slug: 'communities' },

      // ---- EVENTS ----
      { title: 'Special Events', slug: 'events/special-events', path: '/events/special-events', page_type: 'leaf', branch: null, parent_slug: 'events' },
    ];

    let seeded = 0;
    let skipped = 0;

    for (const pg of systemPages) {
      // Resolve parent_id if parent_slug given
      let parentId = null;
      if (pg.parent_slug) {
        const parentRow = await db.pool.query('SELECT id FROM pages WHERE slug = $1', [pg.parent_slug]);
        if (parentRow.rows.length > 0) parentId = parentRow.rows[0].id;
      }

      const existing = await db.pool.query('SELECT id FROM pages WHERE slug = $1', [pg.slug]);
      if (existing.rows.length > 0) {
        // Update page_type and content for existing system pages
        await db.pool.query(
          `UPDATE pages SET page_type = $1, parent_id = COALESCE(parent_id, $2),
           content = COALESCE(NULLIF(content, ''), $3)
           WHERE slug = $4`,
          [pg.page_type, parentId, pg.content || null, pg.slug]
        );
        skipped++;
        continue;
      }

      await db.pool.query(
        `INSERT INTO pages (title, slug, path, page_type, parent_id, content, author_id, author_name, status, visible, branch)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [pg.title, pg.slug, pg.path, pg.page_type, parentId, pg.content || null, req.user.id, 'System', 'live', true, pg.branch]
      );
      seeded++;
    }

    res.json({ message: `Seeded ${seeded} system pages, updated ${skipped} existing.`, seeded, skipped });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/bulk-publish — make all seeded/system pages live and visible
app.post('/api/admin/bulk-publish', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    // Publish pages that are authored by 'System' (seeded) or have no content (stub pages)
    // Also accepts optional array of specific slugs to target
    const { slugs } = req.body; // optional: array of slug strings

    let result;
    if (Array.isArray(slugs) && slugs.length > 0) {
      const placeholders = slugs.map((_, i) => `$${i + 1}`).join(',');
      result = await db.pool.query(
        `UPDATE pages SET status = 'live', visible = true, updated_at = CURRENT_TIMESTAMP
         WHERE slug IN (${placeholders}) RETURNING id, title, slug`,
        slugs
      );
    } else {
      // Default: publish all pages seeded by 'System' that are not already live
      result = await db.pool.query(
        `UPDATE pages SET status = 'live', visible = true, updated_at = CURRENT_TIMESTAMP
         WHERE author_name = 'System' AND (status != 'live' OR visible = false)
         RETURNING id, title, slug`
      );
    }

    res.json({ message: `Published ${result.rows.length} pages.`, pages: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const branch = req.query.branch || null;
    const admin = isAuthenticated(req);

    let where = '';
    const params = [];

    if (branch) {
      where = 'WHERE branch = $1';
      params.push(branch);
    }

    // Public requests only see published/visible pages — admins see all
    if (!admin) {
      const cond = "visible = true AND status = 'live'";
      where = where ? `${where} AND ${cond}` : `WHERE ${cond}`;
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
    const p = result.rows[0];
    if (!isAuthenticated(req) && (!p.visible || p.status !== 'live')) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.json(p);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pages/by-path?path= — look up a page by its full URL path
// Strips leading slash and tries: slug match, path match, or path without leading slash
app.get('/api/pages/by-path', async (req, res) => {
  try {
    const rawPath = (req.query.path || '').replace(/^\//, '');
    if (!rawPath) return res.status(400).json({ error: 'path query param required' });

    const result = await db.pool.query(
      `SELECT * FROM pages WHERE slug = $1 OR path = $2 OR path = $3 LIMIT 1`,
      [rawPath, rawPath, `/${rawPath}`]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }
    const p = result.rows[0];
    if (!isAuthenticated(req) && (!p.visible || p.status !== 'live')) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.json(p);
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
    const p = result.rows[0];
    if (!isAuthenticated(req) && (!p.visible || p.status !== 'live')) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.json(p);
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
    const { title, slug, path, content, templateId, visible, status, parentId, branch,
      attached_documents, attached_videos } =
      req.validatedBody;
    try {
      // Auto-generate slug from title when not provided
      const baseSlug =
        slug ||
        title
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '') ||
        `page-${Date.now()}`;

      let finalSlug = baseSlug;
      let finalPath = path || null;

      // If parentId is provided, auto-generate slug based on parent hierarchy
      if (parentId) {
        const parentResult = await db.pool.query('SELECT slug, path FROM pages WHERE id = $1', [
          parentId,
        ]);

        if (parentResult.rows.length > 0) {
          const parent = parentResult.rows[0];
          // Generate nested slug: parent-slug/child-slug
          const childSlug = baseSlug;
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
        'INSERT INTO pages (title, slug, path, parent_id, content, template_id, author_id, author_name, status, visible, branch, attached_documents, attached_videos) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
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
          JSON.stringify(attached_documents || []),
          JSON.stringify(attached_videos || []),
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
    const { title, slug, path, content, templateId, parentId, branch, preview_image, attached_documents, attached_videos } = req.validatedBody;
    try {
      const result = await db.pool.query(
        `UPDATE pages SET title=$1, slug=$2, path=$3, content=$4, template_id=$5, parent_id=$6, branch=$7,
         preview_image=$8, attached_documents=$9, attached_videos=$10,
         updated_at=CURRENT_TIMESTAMP WHERE id=$11 RETURNING *`,
        [title, slug, path, content, templateId, parentId || null, branch || null,
          preview_image || null, JSON.stringify(attached_documents || []), JSON.stringify(attached_videos || []),
          req.params.id]
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
app.patch(
  '/api/pages/:id/visibility',
  authenticate,
  requireSuperAdminOnly,
  validate(schemas.visibilityToggle),
  async (req, res) => {
    try {
      const { visible } = req.validatedBody;
      const result = await db.pool.query(
        'UPDATE pages SET visible = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [visible, req.params.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Page not found' });
      }
      await db.pool.query('INSERT INTO logs (action, user_name, details) VALUES ($1, $2, $3)', [
        'PAGE_VISIBILITY_TOGGLE',
        req.user.username,
        JSON.stringify({ pageId: req.params.id, visible }),
      ]);
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// DELETE /api/pages/:id - SocCom Admin or Super Admin can delete
app.delete('/api/pages/:id', authenticate, requireSoccomAdmin, async (req, res) => {
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
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const admin = isAuthenticated(req);

    // Public requests only see live/visible posts — admins see all
    const filter = admin ? '' : "WHERE visible = true AND status = 'live'";
    const [dataResult, countResult] = await Promise.all([
      db.pool.query(
        `SELECT * FROM posts ${filter} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      db.pool.query(`SELECT COUNT(*) FROM posts ${filter}`),
    ]);
    res.json({
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count, 10),
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
    const params = [];
    if (user.role === 'soccom_admin') {
      params.push(user.id);
      query += ` WHERE p.author_id = $${params.length}`;
    }

    query += ` ORDER BY p.created_at DESC`;

    const result = await db.pool.query(query, params);
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
    const post = result.rows[0];
    if (!isAuthenticated(req) && (!post.visible || post.status !== 'live')) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
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
      title, excerpt, content, category, images,
      visible, status, is_bulletin, is_pinned, pdf_url, event_date,
      preview_image, attached_documents, attached_videos, image_layouts,
    } = req.validatedBody;

    const imgList = images || [];
    if (imgList.length < 2) {
      return res.status(400).json({ error: 'Posts must include at least 2 images.' });
    }

    try {
      const result = await db.pool.query(
        `INSERT INTO posts (title, excerpt, content, category, images, author_id, author_name,
              status, visible, is_bulletin, is_pinned, pdf_url, event_date,
              preview_image, attached_documents, attached_videos, image_layouts)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
        [
          title, excerpt, content, category, imgList,
          req.user.id, req.user.name,
          status || 'draft', visible || false,
          is_bulletin || false, is_pinned || false,
          pdf_url || null, event_date || null,
          preview_image || null,
          JSON.stringify(attached_documents || []),
          JSON.stringify(attached_videos || []),
          JSON.stringify(image_layouts || {}),
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
      title, excerpt, content, category, images,
      is_bulletin, is_pinned, pdf_url, event_date,
      preview_image, attached_documents, attached_videos, image_layouts,
    } = req.validatedBody;
    try {
      const result = await db.pool.query(
        `UPDATE posts SET title=$1, excerpt=$2, content=$3, category=$4, images=$5,
              is_bulletin=$6, is_pinned=$7, pdf_url=$8, event_date=$9,
              preview_image=$10, attached_documents=$11, attached_videos=$12,
              image_layouts=$13, updated_at=CURRENT_TIMESTAMP WHERE id=$14 RETURNING *`,
        [
          title, excerpt, content, category, images || [],
          is_bulletin || false, is_pinned || false, pdf_url || null, event_date || null,
          preview_image || null,
          JSON.stringify(attached_documents || []),
          JSON.stringify(attached_videos || []),
          JSON.stringify(image_layouts || {}),
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
app.patch(
  '/api/posts/:id/visibility',
  authenticate,
  requireSuperAdminOnly,
  validate(schemas.visibilityToggle),
  async (req, res) => {
    try {
      const { visible } = req.validatedBody;
      const result = await db.pool.query(
        'UPDATE posts SET visible = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [visible, req.params.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }
      await db.pool.query('INSERT INTO logs (action, user_name, details) VALUES ($1, $2, $3)', [
        'POST_VISIBILITY_TOGGLE',
        req.user.username,
        JSON.stringify({ postId: req.params.id, visible }),
      ]);
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

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
    const postCheck = await db.pool.query('SELECT images FROM posts WHERE id = $1', [req.params.id]);
    if (postCheck.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    const postImages = postCheck.rows[0].images || [];
    if (postImages.length < 2) {
      return res.status(400).json({ error: 'Posts must include at least 2 images before submitting for approval.' });
    }

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
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
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

// Multer instance for mass image upload (images only, no size limit)
const massUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const imgMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    cb(null, imgMimes.includes(file.mimetype));
  },
});

// POST /api/media/mass-upload - SocCom Admin uploads up to 300 images (stored as pending)
app.post(
  '/api/media/mass-upload',
  authenticate,
  requireSoccomAdminOnly,
  (req, res, next) => {
    massUpload.array('files', 300)(req, res, err => {
      if (err) return res.status(400).json({ error: err.message || 'File upload error' });
      next();
    });
  },
  async (req, res) => {
    try {
      const files = req.files || [];
      let uploaded = 0;
      for (const file of files) {
        const url = `/uploads/${file.filename}`;
        await db.pool.query(
          'INSERT INTO media (name, type, url, size, category, uploaded_by, status, upload_type) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
          [file.originalname, 'image', url, String(file.size), 'images', req.user.name, 'pending', 'mass']
        );
        uploaded++;
      }

      if (uploaded > 0) {
        const superAdmins = await db.pool.query("SELECT id, name FROM users WHERE role = 'super_admin'");
        for (const admin of superAdmins.rows) {
          await db.pool.query(
            `INSERT INTO notifications (user_id, user_name, title, message, type, related_type, related_id)
             VALUES ($1, $2, $3, $4, 'submission', 'media', $5)`,
            [
              admin.id,
              admin.name,
              'Mass Upload Pending Approval',
              `${req.user.name} uploaded ${uploaded} image${uploaded !== 1 ? 's' : ''} and is awaiting your approval.`,
              0,
            ]
          );
        }
      }

      res.json({ success: true, uploaded });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// POST /api/admin/mass-approve-media - Super Admin approves all pending mass-uploaded images
app.post('/api/admin/mass-approve-media', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const result = await db.pool.query(
      "UPDATE media SET status='approved' WHERE status='pending' AND upload_type='mass' RETURNING id"
    );
    res.json({ success: true, approved: result.rows.length });
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

app.post('/api/documents/upload', authenticate, writeLimiter, upload.fields([{ name: 'file', maxCount: 1 }, { name: 'cover_image', maxCount: 1 }]), async (req, res) => {
  try {
    const { name, type, category, notes } = req.body;
    const file = req.files?.file?.[0];
    const coverFile = req.files?.cover_image?.[0];
    const coverImageUrl = coverFile ? `/uploads/${coverFile.filename}` : null;
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
             (name, original_name, type, mime_type, size, url, category, author_id, author_name, status, version, parent_revision_id, notes, cover_image, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10, $11, $12, $13, NOW())
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
        coverImageUrl,
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
      query += ` AND status = $${params.length}`;
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

// Get all video links (Super Admin sees all, SocCom sees approved + their own pending)
app.get('/api/video-links', authenticate, async (req, res) => {
  try {
    let query;
    let params;

    if (req.user.role === 'soccom_admin') {
      // SocCom admin sees approved links AND their own pending/rejected submissions
      query = "SELECT * FROM video_links WHERE status = 'approved' OR author_id = $1 ORDER BY created_at DESC";
      params = [req.user.id];
    } else {
      // Super admin sees everything
      query = 'SELECT * FROM video_links ORDER BY created_at DESC';
      params = [];
    }

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

// Allowed video platform hostnames — prevents SSRF via internal URLs
const VIDEO_ALLOWED_HOSTS = new Set([
  'www.youtube.com', 'youtube.com', 'youtu.be', 'm.youtube.com',
  'www.tiktok.com', 'tiktok.com', 'vm.tiktok.com',
  'www.instagram.com', 'instagram.com',
  'www.facebook.com', 'facebook.com', 'fb.watch', 'fb.com', 'm.facebook.com',
  'drive.google.com',
  'www.snapchat.com', 'snapchat.com',
  'vimeo.com', 'www.vimeo.com', 'player.vimeo.com',
  'twitter.com', 'www.twitter.com', 'x.com', 'www.x.com',
]);

// Submit video link for approval (SocCom Admin only)
app.post('/api/video-links', authenticate, requireSoccomAdmin, validate(schemas.videoLinkCreate), async (req, res) => {
  try {
    const { url, title, description, thumbnail } = req.validatedBody;

    // Validate URL is from an allowed video platform (prevents SSRF + stored XSS)
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid video URL' });
    }
    if (!VIDEO_ALLOWED_HOSTS.has(parsedUrl.hostname)) {
      return res.status(400).json({
        error: 'Video URL must be from a supported platform: YouTube, TikTok, Instagram, Facebook, Vimeo, Twitter/X, Google Drive, or Snapchat',
      });
    }

    // Detect platform using the validated hostname (not string.includes — prevents bypass)
    const hostname = parsedUrl.hostname;
    let platform = 'other';
    if (hostname.includes('youtube') || hostname === 'youtu.be') platform = 'youtube';
    else if (hostname.includes('tiktok')) platform = 'tiktok';
    else if (hostname.includes('instagram')) platform = 'instagram';
    else if (hostname.includes('facebook') || hostname === 'fb.watch' || hostname === 'fb.com') platform = 'facebook';
    else if (hostname === 'drive.google.com') platform = 'google_drive';
    else if (hostname.includes('snapchat')) platform = 'snapchat';
    else if (hostname.includes('vimeo')) platform = 'vimeo';
    else if (hostname.includes('twitter') || hostname.includes('x.com')) platform = 'twitter';

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
          'INSERT INTO media (name, type, url, category, uploaded_by, cover_image, uploaded_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
          [doc.name, doc.type, doc.url, category, doc.author_name, doc.cover_image || null]
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
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/notifications', authenticate, async (req, res) => {
  try {
    const result = await db.pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notifications/:id/read', authenticate, async (req, res) => {
  try {
    const result = await db.pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notifications/read-all', authenticate, async (req, res) => {
  try {
    await db.pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/notifications/:id', authenticate, async (req, res) => {
  try {
    const result = await db.pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
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
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const subResult = await client.query('SELECT * FROM submissions WHERE id = $1', [
      req.params.id,
    ]);
    if (subResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Submission not found' });
    }
    const submission = subResult.rows[0];
    const approvalDate = new Date();

    if (submission.type === 'page') {
      await client.query(
        "UPDATE pages SET status = 'live', visible = true, approved_by = $1, approved_at = $2 WHERE id = $3",
        [req.user.name, approvalDate, submission.item_id]
      );
    } else if (submission.type === 'post') {
      await client.query(
        "UPDATE posts SET status = 'live', visible = true, approved_by = $1, approved_at = $2 WHERE id = $3",
        [req.user.name, approvalDate, submission.item_id]
      );
    }

    await client.query(
      "UPDATE submissions SET status = 'approved', approved_by = $1, approved_at = $2, notes = $3 WHERE id = $4",
      [req.user.name, approvalDate, notes || '', req.params.id]
    );
    await client.query('INSERT INTO logs (action, user_name, details) VALUES ($1, $2, $3)', [
      'SUBMISSION_APPROVE',
      req.user.username,
      JSON.stringify({ submissionId: req.params.id }),
    ]);
    await client.query(
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

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.post('/api/submissions/:id/reject', authenticate, async (req, res) => {
  const { notes } = req.body;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const subResult = await client.query('SELECT * FROM submissions WHERE id = $1', [
      req.params.id,
    ]);
    if (subResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Submission not found' });
    }
    const submission = subResult.rows[0];
    const rejectionDate = new Date();

    if (submission.type === 'page') {
      await client.query("UPDATE pages SET status = 'draft', visible = false WHERE id = $1", [
        submission.item_id,
      ]);
    } else if (submission.type === 'post') {
      await client.query("UPDATE posts SET status = 'draft', visible = false WHERE id = $1", [
        submission.item_id,
      ]);
    }

    await client.query(
      "UPDATE submissions SET status = 'rejected', rejected_by = $1, rejected_at = $2, rejection_notes = $3 WHERE id = $4",
      [req.user.name, rejectionDate, notes || '', req.params.id]
    );
    await client.query('INSERT INTO logs (action, user_name, details) VALUES ($1, $2, $3)', [
      'SUBMISSION_REJECT',
      req.user.username,
      JSON.stringify({ submissionId: req.params.id }),
    ]);
    await client.query(
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

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.post('/api/submissions/:id/resubmit', authenticate, async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const subResult = await client.query('SELECT * FROM submissions WHERE id = $1', [
      req.params.id,
    ]);
    if (subResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Submission not found' });
    }
    const submission = subResult.rows[0];

    if (submission.status !== 'rejected') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Only rejected submissions can be resubmitted' });
    }
    if (submission.author_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Only the original author can resubmit' });
    }

    await client.query(
      "UPDATE submissions SET status = 'pending', submitted_at = CURRENT_TIMESTAMP, rejected_by = NULL, rejected_at = NULL, rejection_notes = NULL WHERE id = $1",
      [req.params.id]
    );

    if (submission.type === 'page') {
      await client.query("UPDATE pages SET status = 'pending', visible = false WHERE id = $1", [
        submission.item_id,
      ]);
    } else if (submission.type === 'post') {
      await client.query("UPDATE posts SET status = 'pending', visible = false WHERE id = $1", [
        submission.item_id,
      ]);
    }

    const superAdmins = await client.query(
      "SELECT id, name FROM users WHERE role = 'super_admin'"
    );
    if (superAdmins.rows.length > 0) {
      const notifValues = superAdmins.rows
        .map((_, i) => {
          const base = i * 5;
          return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, 'submission', 'submission', $${base + 5})`;
        })
        .join(', ');
      const notifParams = superAdmins.rows.flatMap(admin => [
        admin.id,
        admin.name,
        'Submission Resubmitted',
        `${req.user.name} resubmitted "${submission.title}" for review`,
        req.params.id,
      ]);
      await client.query(
        `INSERT INTO notifications (user_id, user_name, title, message, type, related_type, related_id) VALUES ${notifValues}`,
        notifParams
      );
    }

    await client.query('INSERT INTO logs (action, user_name, details) VALUES ($1, $2, $3)', [
      'SUBMISSION_RESUBMIT',
      req.user.username,
      JSON.stringify({ submissionId: req.params.id }),
    ]);

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// POST /api/submissions/:id/whitelist - Super Admin holds content (acknowledged but not published)
app.post('/api/submissions/:id/whitelist', authenticate, requireSuperAdminOnly, async (req, res) => {
  const { notes } = req.body;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const subResult = await client.query('SELECT * FROM submissions WHERE id = $1', [req.params.id]);
    if (subResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Submission not found' });
    }
    const submission = subResult.rows[0];

    await client.query(
      "UPDATE submissions SET status = 'whitelisted', approved_by = $1, approved_at = $2, notes = $3 WHERE id = $4",
      [req.user.name, new Date(), notes || '', req.params.id]
    );
    await client.query('INSERT INTO logs (action, user_name, details) VALUES ($1, $2, $3)', [
      'SUBMISSION_WHITELIST',
      req.user.username,
      JSON.stringify({ submissionId: req.params.id, notes }),
    ]);
    await client.query(
      `INSERT INTO notifications (user_id, user_name, title, message, type, related_type, related_id)
       VALUES ($1, $2, $3, $4, 'warning', 'submission', $5)`,
      [
        submission.author_id,
        submission.author_name,
        'Submission On Hold',
        `Your ${submission.type} "${submission.title}" has been reviewed and is on hold. ${notes ? 'Note: ' + notes : 'The reviewer may publish it at a later date.'}`,
        req.params.id,
      ]
    );
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
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
  try {
    const existing = await db.pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const oldTask = existing.rows[0];

    // Merge: only override fields that were explicitly provided in the request
    const title = req.body.title !== undefined ? req.body.title : oldTask.title;
    const description = req.body.description !== undefined ? req.body.description : oldTask.description;
    const priority = req.body.priority !== undefined ? req.body.priority : oldTask.priority;
    const dueDate = req.body.dueDate !== undefined ? req.body.dueDate : oldTask.due_date;
    const status = req.body.status !== undefined ? req.body.status : oldTask.status;
    const rejectionReason = req.body.rejectionReason !== undefined ? req.body.rejectionReason : oldTask.rejection_reason;
    const assigneeId = req.body.assigneeId !== undefined ? req.body.assigneeId : oldTask.assignee_id;
    const assigneeName = req.body.assigneeName !== undefined ? req.body.assigneeName : oldTask.assignee_name;

    // Set rejection metadata when status is 'rejected'
    const isNowRejected = status === 'rejected' && oldTask.status !== 'rejected';
    const rejectedBy = isNowRejected ? req.user.name : (status !== 'rejected' ? null : oldTask.rejected_by);
    const rejectedAt = isNowRejected ? new Date() : (status !== 'rejected' ? null : oldTask.rejected_at);

    // When reassigning, clear rejection fields and reset status to pending
    const isReassign = req.body.assigneeId !== undefined && req.body.assigneeId !== oldTask.assignee_id;
    const finalStatus = isReassign ? 'pending' : status;
    const finalRejectReason = isReassign ? null : (finalStatus === 'rejected' ? rejectionReason : null);
    const finalRejectedBy = isReassign ? null : rejectedBy;
    const finalRejectedAt = isReassign ? null : rejectedAt;

    const result = await db.pool.query(
      `UPDATE tasks
         SET title = $1, description = $2, priority = $3, due_date = $4,
             status = $5, rejection_reason = $6, rejected_by = $7, rejected_at = $8,
             assignee_id = $9, assignee_name = $10,
             updated_at = CURRENT_TIMESTAMP
       WHERE id = $11 RETURNING *`,
      [title, description, priority, dueDate, finalStatus,
        finalRejectReason, finalRejectedBy, finalRejectedAt,
        assigneeId, assigneeName, req.params.id]
    );

    // ── Notifications ──
    const statusChanged = finalStatus !== oldTask.status;
    const assigneeChanged = isReassign;

    // Notify new assignee on reassignment
    if (assigneeChanged && assigneeId) {
      await db.pool.query(
        `INSERT INTO notifications (user_id, user_name, title, message, type, related_type, related_id)
         VALUES ($1, $2, $3, $4, 'task', 'task', $5)`,
        [assigneeId, assigneeName,
          'Task Assigned to You',
          `${req.user.name} has reassigned the task "${title}" to you.`,
          req.params.id]
      );
    }

    if (statusChanged && !assigneeChanged) {
      const notifyLabels = {
        completed: 'completed',
        in_progress: 'started working on',
        implemented: 'marked as implemented',
        pending: 'reset to pending',
        rejected: 'rejected',
      };
      const statusLabel = notifyLabels[finalStatus] || finalStatus;

      // Notify task creator
      if (oldTask.created_by && oldTask.created_by !== req.user.id) {
        const msg = finalStatus === 'rejected'
          ? `${req.user.name} rejected "${title}"${rejectionReason ? `: "${rejectionReason}"` : '.'}`
          : `${req.user.name} has ${statusLabel} the task: "${title}"`;
        await db.pool.query(
          `INSERT INTO notifications (user_id, user_name, title, message, type, related_type, related_id)
           VALUES ($1, $2, $3, $4, 'task', 'task', $5)`,
          [oldTask.created_by, oldTask.created_by_name,
          finalStatus === 'rejected' ? 'Task Rejected' : 'Task Status Updated',
            msg, req.params.id]
        );
      }

      // Notify the assignee if a third party changed the status
      if (oldTask.assignee_id && oldTask.assignee_id !== req.user.id && oldTask.assignee_id !== oldTask.created_by) {
        await db.pool.query(
          `INSERT INTO notifications (user_id, user_name, title, message, type, related_type, related_id)
           VALUES ($1, $2, $3, $4, 'task', 'task', $5)`,
          [oldTask.assignee_id, oldTask.assignee_name,
            'Task Updated',
          `The task "${title}" was ${statusLabel} by ${req.user.name}.`,
          req.params.id]
        );
      }
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

app.get('/api/logs/screen-analysis', authenticate, requireSuperAdmin, async (req, res) => {
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

const ALLOWED_LOG_ACTIONS = new Set([
  'SCREEN_ANALYSIS', 'PAGE_VIEW', 'USER_ACTION', 'CLICK', 'BUTTON_CLICK', 'LINK_CLICK',
]);

app.get('/api/logs/frontend', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit, 10) || 100));
    const type = req.query.type;

    if (type && !ALLOWED_LOG_ACTIONS.has(type)) {
      return res.status(400).json({ error: 'Invalid log type filter' });
    }

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
    res.status(500).json({ error: 'Failed to retrieve logs' });
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

app.post('/send-email', emailLimiter, (req, res) => {
  const { name, email, message } = req.body;

  // Validate required fields
  if (!name || typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100) {
    return res.status(400).json({ success: false, message: 'A valid name is required (max 100 chars)' });
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ success: false, message: 'A valid email address is required' });
  }
  if (!message || typeof message !== 'string' || message.trim().length < 1 || message.trim().length > 2000) {
    return res.status(400).json({ success: false, message: 'A message is required (max 2000 chars)' });
  }

  const safeName = name.trim().replace(/[\r\n]/g, ' ');
  const safeEmail = email.trim().replace(/[\r\n]/g, '');
  const safeMessage = message.trim();

  const mailOptions = {
    from: process.env.EMAIL,
    to: process.env.RECEIVER_EMAIL,
    replyTo: safeEmail,
    subject: `New Message from ${safeName}`,
    text: `Name: ${safeName}\nEmail: ${safeEmail}\nMessage:\n${safeMessage}`,
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) {
      logger.error('Error sending email:', error);
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
    return res.status(400).json({ error: 'File too large. Maximum size is 25MB' });
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

if (require.main === module) {
  startServer();
}

module.exports = { app };
