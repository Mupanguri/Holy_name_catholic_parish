/**
 * Import Script - Import images from public folder to database
 * Run with: node backend/import-media.js
 */

require("dotenv").config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "windows",
    database: process.env.DB_NAME || "soccom",
});

const PUBLIC_IMAGES_PATH = path.join(__dirname, '..', 'public', 'images');

async function importImages() {
    console.log('========================================');
    console.log('🖼️  Importing Images to Database');
    console.log('========================================\n');

    try {
        // Check if directory exists
        if (!fs.existsSync(PUBLIC_IMAGES_PATH)) {
            console.error(`❌ Directory not found: ${PUBLIC_IMAGES_PATH}`);
            process.exit(1);
        }

        // Read all files from the images directory
        const files = fs.readdirSync(PUBLIC_IMAGES_PATH);
        const imageFiles = files.filter(file =>
            /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file)
        );

        console.log(`Found ${imageFiles.length} image files\n`);

        // Check existing images in database
        const existingResult = await pool.query('SELECT name FROM media WHERE type = $1', ['image']);
        const existingImages = new Set(existingResult.rows.map(r => r.name));

        console.log(`Existing images in database: ${existingImages.size}\n`);

        let imported = 0;
        let skipped = 0;

        for (const file of imageFiles) {
            const filePath = path.join(PUBLIC_IMAGES_PATH, file);
            const stats = fs.statSync(filePath);

            // Check if already exists
            if (existingImages.has(file)) {
                console.log(`⏭️  Skipping (exists): ${file}`);
                skipped++;
                continue;
            }

            // Determine category based on filename
            let category = 'images';
            if (file.includes('logo')) category = 'logos';
            else if (file.includes('banner')) category = 'banners';

            // Get relative URL for the image
            const url = `/images/${file}`;

            // Insert into database
            await pool.query(
                'INSERT INTO media (name, type, url, category, uploaded_at) VALUES ($1, $2, $3, $4, NOW())',
                [file, 'image', url, category]
            );

            console.log(`✅ Imported: ${file} (${formatBytes(stats.size)})`);
            imported++;
        }

        console.log('\n========================================');
        console.log(`📊 Import Summary`);
        console.log(`   Total files found: ${imageFiles.length}`);
        console.log(`   Newly imported: ${imported}`);
        console.log(`   Skipped (exists): ${skipped}`);
        console.log('========================================\n');

        // Verify import
        const verifyResult = await pool.query('SELECT COUNT(*) FROM media WHERE type = $1', ['image']);
        console.log(`📁 Total images in database: ${verifyResult.rows[0].count}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

importImages();
