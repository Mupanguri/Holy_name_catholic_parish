/**
 * Database Migration Script
 * Run this script to add missing tables, indexes, columns, and constraints
 * 
 * Usage: node migrate.js
 */

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "windows",
    database: process.env.DB_NAME || "soccom",
});

const migrations = [
    // ========== CREATE TABLES IF NOT EXIST ==========
    {
        name: "Create document_revisions table",
        sql: `CREATE TABLE IF NOT EXISTS document_revisions (
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
        );`
    },
    {
        name: "Create notifications table",
        sql: `CREATE TABLE IF NOT EXISTS notifications (
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
        );`
    },
    // ========== ADD COLUMNS ==========
    {
        name: "Add size column to media",
        sql: `ALTER TABLE media ADD COLUMN IF NOT EXISTS size VARCHAR(50);`
    },
    {
        name: "Add change_description column to submissions",
        sql: `ALTER TABLE submissions ADD COLUMN IF NOT EXISTS change_description TEXT;`
    },
    // ========== ADD INDEXES ==========
    {
        name: "Add document_revisions status index",
        sql: `CREATE INDEX IF NOT EXISTS idx_document_revisions_status ON document_revisions(status);`
    },
    {
        name: "Add document_revisions author index",
        sql: `CREATE INDEX IF NOT EXISTS idx_document_revisions_author ON document_revisions(author_id);`
    },
    {
        name: "Add notifications user index",
        sql: `CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);`
    },
    {
        name: "Add notifications read index",
        sql: `CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);`
    }
    // Note: Foreign key constraints are handled in setup-db.js and may already exist
    // Skipping FK migrations to avoid "syntax error at or near EXISTS" errors
    // as PostgreSQL doesn't support IF NOT EXISTS for ALTER TABLE ADD CONSTRAINT
];

async function runMigrations() {
    console.log("🚀 Starting database migrations...\n");

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const migration of migrations) {
        try {
            await pool.query(migration.sql);
            console.log(`✅ ${migration.name}`);
            successCount++;
        } catch (error) {
            // Ignore duplicate table errors and already exists
            if (error.code === "42P07" || error.code === "55P03" ||
                error.code === "23505" || error.message.includes("already exists")) {
                console.log(`⏭️  ${migration.name} (already exists)`);
                skipCount++;
            } else {
                console.log(`❌ ${migration.name}: ${error.message}`);
                errorCount++;
            }
        }
    }

    console.log("\n📊 Migration Summary:");
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    await pool.end();

    if (errorCount > 0) {
        console.log("\n⚠️  Some migrations failed. Check errors above.");
        process.exit(1);
    } else {
        console.log("\n✨ All migrations completed successfully!");
        process.exit(0);
    }
}

runMigrations().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
