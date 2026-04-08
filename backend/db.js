require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Get database name from environment
const dbName = process.env.DB_NAME || 'soccom';

// Validate required environment variables
if (!process.env.DB_USER || !process.env.DB_PASSWORD) {
  console.error('ERROR: Database credentials must be provided via environment variables');
  console.error('Required: DB_USER, DB_PASSWORD');
  console.error('Optional: DB_HOST, DB_PORT, DB_NAME');
}

// Create connection pool - require environment variables for production
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: dbName,
});

// Create database if not exists (for initial setup only)
const createDatabase = async () => {
  // First connect to postgres to check/create the database
  const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: 'postgres', // Only this needs to connect to default db
  });

  try {
    // Check if database exists
    const result = await adminPool.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);

    if (result.rows.length === 0) {
      // Create database
      await adminPool.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database '${dbName}' created successfully!`);
    }
    await adminPool.end(); // Close admin pool after use
  } catch (error) {
    console.log('Database check:', error.message);
    await adminPool.end();
  }
};

// Initialize database with tables
const initDatabase = async () => {
  // Tables already exist in soccom, just verify and return the pool
  // The main pool (exported) is already connected to soccom

  try {
    // Verify tables exist
    const result = await pool.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name IN (
                'users', 'pages', 'posts', 'media', 'submissions', 'tasks', 'logs'
            )
        `);

    if (result.rows.length >= 7) {
      console.log('All tables verified successfully!');
      return pool;
    }

    // If tables don't exist, create them
    console.log('Tables not found, creating...');
    const dbPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: dbName,
    });

    await createTables(dbPool);
    return pool;
  } catch (error) {
    console.error('Error initializing database:', error.message);
    throw error;
  }
};

// Create tables - separated for clarity
const createTables = async dbPool => {
  const createTablesSQL = `
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            role VARCHAR(50) DEFAULT 'soccom_admin',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Pages table
        CREATE TABLE IF NOT EXISTS pages (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            path VARCHAR(255),
            parent_id INTEGER REFERENCES pages(id) ON DELETE SET NULL,
            content TEXT,
            template_id VARCHAR(100),
            author_id INTEGER,
            author_name VARCHAR(255),
            status VARCHAR(50) DEFAULT 'draft',
            visible BOOLEAN DEFAULT false,
            branch VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            approved_by VARCHAR(255),
            approved_at TIMESTAMP
        );

        -- Posts table
        CREATE TABLE IF NOT EXISTS posts (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            excerpt TEXT,
            content TEXT,
            category VARCHAR(100),
            author_id INTEGER,
            author_name VARCHAR(255),
            images TEXT[],
            status VARCHAR(50) DEFAULT 'draft',
            visible BOOLEAN DEFAULT false,
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            approved_by VARCHAR(255),
            approved_at TIMESTAMP
        );

        -- Media table
        CREATE TABLE IF NOT EXISTS media (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(50),
            url TEXT,
            size VARCHAR(50),
            category VARCHAR(100),
            uploaded_by VARCHAR(255),
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Submissions table
        CREATE TABLE IF NOT EXISTS submissions (
            id SERIAL PRIMARY KEY,
            type VARCHAR(50) NOT NULL,
            item_id INTEGER NOT NULL,
            title TEXT,
            content TEXT,
            change_description TEXT,
            author_id INTEGER,
            author_name VARCHAR(255),
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status VARCHAR(50) DEFAULT 'pending',
            notes TEXT,
            comments JSONB DEFAULT '[]',
            approved_by VARCHAR(255),
            approved_at TIMESTAMP,
            rejected_by VARCHAR(255),
            rejected_at TIMESTAMP,
            rejection_notes TEXT
        );

        -- Tasks table
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            priority VARCHAR(50) DEFAULT 'medium',
            due_date DATE,
            assignee_id INTEGER,
            assignee_name VARCHAR(255),
            created_by INTEGER,
            created_by_name VARCHAR(255),
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Logs table
        CREATE TABLE IF NOT EXISTS logs (
            id SERIAL PRIMARY KEY,
            action VARCHAR(100) NOT NULL,
            user_name VARCHAR(255),
            details JSONB,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Document Revisions table (for document upload & review workflow)
        CREATE TABLE IF NOT EXISTS document_revisions (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            original_name VARCHAR(255),
            type VARCHAR(50) NOT NULL,
            mime_type VARCHAR(100),
            size INTEGER,
            url TEXT NOT NULL,
            category VARCHAR(100),
            author_id INTEGER,
            author_name VARCHAR(255),
            status VARCHAR(50) DEFAULT 'pending',
            version INTEGER DEFAULT 1,
            parent_revision_id INTEGER,
            notes TEXT,
            reviewed_by VARCHAR(255),
            reviewed_at TIMESTAMP,
            review_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Video Links table (for YouTube, TikTok, Instagram, etc.)
        CREATE TABLE IF NOT EXISTS video_links (
            id SERIAL PRIMARY KEY,
            url TEXT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            thumbnail TEXT,
            platform VARCHAR(50),
            author_id INTEGER,
            author_name VARCHAR(255),
            status VARCHAR(50) DEFAULT 'pending',
            reviewed_by VARCHAR(255),
            reviewed_at TIMESTAMP,
            review_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Notifications table
        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            user_name VARCHAR(255),
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) DEFAULT 'info',
            related_type VARCHAR(50),
            related_id INTEGER,
            is_read BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create indexes for better query performance
        CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
        CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);
        CREATE INDEX IF NOT EXISTS idx_pages_visible ON pages(visible);
        CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
        CREATE INDEX IF NOT EXISTS idx_posts_visible ON posts(visible);
        CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
        CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
        CREATE INDEX IF NOT EXISTS idx_submissions_type ON submissions(type);
        CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
        CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_logs_action ON logs(action);
        -- Document revisions indexes
        CREATE INDEX IF NOT EXISTS idx_document_revisions_status ON document_revisions(status);
        CREATE INDEX IF NOT EXISTS idx_document_revisions_author ON document_revisions(author_id);
        -- Notifications indexes
        CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
    `;

  try {
    await dbPool.query(createTablesSQL);
    console.log('All tables created successfully!');

    // Add missing columns if they don't exist (for existing databases)
    try {
      await dbPool.query(`ALTER TABLE media ADD COLUMN IF NOT EXISTS size VARCHAR(50)`);
      console.log('Media table size column verified');
    } catch (e) {
      // Ignore if column already exists
    }

    // Bulletin fields migration
    try {
      await dbPool.query(
        `ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_bulletin BOOLEAN DEFAULT false`
      );
      await dbPool.query(
        `ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false`
      );
      await dbPool.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS pdf_url TEXT`);
      await dbPool.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_date DATE`);
      console.log('Bulletin columns verified');
    } catch (e) {
      console.log('Bulletin migration note:', e.message);
    }

    // Community pages migration - add level and branch columns
    // Using a safer approach that works across PostgreSQL versions
    try {
      // Check if level column exists
      const levelCheck = await dbPool.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'pages' AND column_name = 'level'"
      );
      if (levelCheck.rows.length === 0) {
        await dbPool.query(`ALTER TABLE pages ADD COLUMN level INTEGER DEFAULT 1`);
        console.log('Added level column to pages table');
      }

      // Check if branch column exists
      const branchCheck = await dbPool.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'pages' AND column_name = 'branch'"
      );
      if (branchCheck.rows.length === 0) {
        await dbPool.query(`ALTER TABLE pages ADD COLUMN branch VARCHAR(50)`);
        console.log('Added branch column to pages table');
      }
      console.log('Community pages columns verified');
    } catch (e) {
      console.log('Community pages migration note:', e.message);
    }

    // Seed initial data
    await seedDatabase(dbPool);

    return dbPool;
  } catch (error) {
    console.error('Error creating tables:', error.message);
    throw error;
  }
};

// Seed initial data
const seedDatabase = async dbPool => {
  // Check if users already exist
  const userCheck = await dbPool.query('SELECT COUNT(*) FROM users');

  if (parseInt(userCheck.rows[0].count) === 0) {
    // Use environment variables for seeds or generate random passwords
    const adminPass = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
    const soccomPass = process.env.SEED_SOCCOM_PASSWORD || 'ChangeMe456!';

    // Warn about default passwords
    if (!process.env.SEED_ADMIN_PASSWORD) {
      console.warn(
        'WARNING: Using default seed password for admin. Set SEED_ADMIN_PASSWORD in .env for production!'
      );
    }

    // Hash passwords before seeding
    const hashedAdminPassword = await bcrypt.hash(adminPass, 12);
    const hashedSoccomPassword = await bcrypt.hash(soccomPass, 12);

    // Seed default users
    const seedUsers = `
            INSERT INTO users (username, password, name, email, role) VALUES
            ('superadmin', $1, 'Father John', 'superadmin@holyname.org', 'super_admin'),
            ('soccom', $2, 'SocCom Admin', 'soccom@holyname.org', 'soccom_admin')
            ON CONFLICT (username) DO NOTHING;
        `;
    await dbPool.query(seedUsers, [hashedAdminPassword, hashedSoccomPassword]);
    console.log('Default users seeded!');
    console.log('IMPORTANT: Change these passwords immediately in production!');
  }
};

module.exports = {
  pool,
  dbName,
  createDatabase,
  initDatabase,
};
