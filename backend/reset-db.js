// Reset Database Script - Drops and recreates database with hashed passwords
require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "windows",
    database: "postgres" // Connect to default db first
});

const resetDatabase = async () => {
    const dbName = process.env.DB_NAME || "soccom";

    try {
        // Drop and recreate database
        console.log("🔄 Dropping database...");
        await pool.query(`DROP DATABASE IF EXISTS ${dbName}`);

        console.log("🆕 Creating database...");
        await pool.query(`CREATE DATABASE ${dbName}`);

        console.log("✅ Database recreated!");

        // Close connection to default db
        await pool.end();

        // Connect to the new database
        const appPool = new Pool({
            host: process.env.DB_HOST || "localhost",
            port: process.env.DB_PORT || 5432,
            user: process.env.DB_USER || "postgres",
            password: process.env.DB_PASSWORD || "windows",
            database: dbName,
        });

        // Create tables
        console.log("📋 Creating tables...");
        const createTablesSQL = `
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                approved_by VARCHAR(255),
                approved_at TIMESTAMP
            );

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

            CREATE TABLE IF NOT EXISTS media (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(50),
                url TEXT,
                category VARCHAR(100),
                uploaded_by VARCHAR(255),
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS submissions (
                id SERIAL PRIMARY KEY,
                type VARCHAR(50) NOT NULL,
                item_id INTEGER NOT NULL,
                title TEXT,
                content TEXT,
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

            CREATE TABLE IF NOT EXISTS logs (
                id SERIAL PRIMARY KEY,
                action VARCHAR(100) NOT NULL,
                user_name VARCHAR(255),
                details JSONB,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Indexes
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
        `;

        await appPool.query(createTablesSQL);
        console.log("✅ Tables created!");

        // Seed users with hashed passwords
        console.log("👤 Seeding users with hashed passwords...");
        const hashedAdminPassword = await bcrypt.hash('admin123', 12);
        const hashedSoccomPassword = await bcrypt.hash('soccom123', 12);

        await appPool.query(`
            INSERT INTO users (username, password, name, email, role) VALUES
            ('superadmin', $1, 'Father John', 'superadmin@holyname.org', 'super_admin'),
            ('soccom', $2, 'SocCom Admin', 'soccom@holyname.org', 'soccom_admin')
        `, [hashedAdminPassword, hashedSoccomPassword]);

        console.log("✅ Users seeded!");
        console.log("\n🎉 Database reset complete!");
        console.log("\n📝 Login Credentials:");
        console.log("   Super Admin: superadmin / admin123");
        console.log("   SocCom Admin: soccom / soccom123");
        console.log("\n⚠️  IMPORTANT: Change these passwords after first login!");

        await appPool.end();

    } catch (error) {
        console.error("❌ Error resetting database:", error.message);
    }
};

resetDatabase();
