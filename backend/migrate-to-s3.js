require('dotenv').config();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const isDryRun = !process.argv.includes('--run');

const BUCKET = process.env.AWS_S3_BUCKET || 'holyname-db-backups';
const REGION = process.env.AWS_REGION || 'us-east-1';
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');

const s3 = new S3Client({ region: REGION });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const MIME_MAP = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt': 'text/plain', '.csv': 'text/csv',
};

// Recursively collect all /uploads/ strings from any value (string, array, object)
function collectLocalUrls(val, out) {
  if (!val) return;
  if (typeof val === 'string') {
    if (val.startsWith('/uploads/')) out.add(val);
  } else if (Array.isArray(val)) {
    for (const item of val) collectLocalUrls(item, out);
  } else if (typeof val === 'object') {
    for (const v of Object.values(val)) collectLocalUrls(v, out);
  }
}

// Replace all /uploads/ references in a serialized JSON string using the URL map
function replaceInJson(obj, urlMap) {
  if (!obj) return obj;
  const replaced = JSON.stringify(obj).replace(/"(\/uploads\/[^"]+)"/g, (match, url) => {
    const s3Url = urlMap.get(url);
    return s3Url ? `"${s3Url}"` : match;
  });
  return JSON.parse(replaced);
}

function replaceStr(val, urlMap) {
  if (!val || !val.startsWith('/uploads/')) return val;
  return urlMap.get(val) ?? val;
}

function replaceArr(arr, urlMap) {
  if (!arr) return arr;
  return arr.map(item => replaceStr(item, urlMap));
}

async function main() {
  console.log(isDryRun
    ? '=== DRY RUN — no files uploaded, no DB changes made ==='
    : '=== LIVE RUN ===');
  console.log(`Bucket: ${BUCKET}  Region: ${REGION}\n`);

  // ── Step 1: Collect all unique local URLs from the DB ─────────────────────
  const localUrls = new Set();

  const scanQueries = [
    'SELECT url, cover_image FROM media',
    'SELECT url, cover_image FROM document_revisions',
    'SELECT preview_image, pdf_url, images, attached_documents FROM posts',
    'SELECT preview_image, attached_documents FROM pages',
    'SELECT thumbnail FROM video_links',
  ];

  for (const q of scanQueries) {
    const { rows } = await pool.query(q);
    for (const row of rows) {
      for (const val of Object.values(row)) {
        collectLocalUrls(val, localUrls);
      }
    }
  }

  console.log(`Found ${localUrls.size} unique local file URL(s) to migrate\n`);

  if (localUrls.size === 0) {
    console.log('Nothing to migrate — all files are already on S3 or no files exist.');
    await pool.end();
    return;
  }

  // ── Step 2: Upload each file to S3 ───────────────────────────────────────
  const urlMap = new Map(); // localUrl → s3Url
  let filesUploaded = 0;
  let warnings = 0;

  for (const localUrl of localUrls) {
    const filename = path.basename(localUrl);
    const diskPath = path.join(UPLOADS_DIR, filename);
    const s3Key = localUrl.startsWith('/') ? localUrl.slice(1) : localUrl; // "uploads/abc.jpg"
    const s3Url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${s3Key}`;

    if (!fs.existsSync(diskPath)) {
      console.warn(`  WARN  file not found on disk: ${diskPath}`);
      warnings++;
      continue; // leave this URL unchanged in DB
    }

    if (isDryRun) {
      console.log(`  [dry] ${localUrl} → ${s3Url}`);
      urlMap.set(localUrl, s3Url);
      continue;
    }

    try {
      const body = fs.readFileSync(diskPath);
      const ext = path.extname(diskPath).toLowerCase();
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: body,
        ContentType: MIME_MAP[ext] || 'application/octet-stream',
      }));
      console.log(`  OK    ${localUrl} → ${s3Url}`);
      urlMap.set(localUrl, s3Url);
      filesUploaded++;
    } catch (err) {
      console.error(`  ERROR uploading ${localUrl}: ${err.message}`);
      warnings++;
    }
  }

  if (isDryRun) {
    console.log('\n[DRY RUN] DB not updated. Re-run with --run to apply.\n');
    console.log(`Would migrate: ${localUrls.size} URL(s), warnings: ${warnings}`);
    await pool.end();
    return;
  }

  if (urlMap.size === 0) {
    console.log('\nNo files were uploaded successfully — skipping DB update.');
    await pool.end();
    return;
  }

  // ── Step 3: Update the database ──────────────────────────────────────────
  console.log('\nUpdating database...\n');
  let rowsUpdated = 0;

  // media
  {
    const { rows } = await pool.query('SELECT id, url, cover_image FROM media');
    for (const row of rows) {
      const newUrl = replaceStr(row.url, urlMap);
      const newCover = replaceStr(row.cover_image, urlMap);
      if (newUrl !== row.url || newCover !== row.cover_image) {
        await pool.query('UPDATE media SET url=$1, cover_image=$2 WHERE id=$3',
          [newUrl, newCover, row.id]);
        rowsUpdated++;
      }
    }
    console.log('  media — done');
  }

  // document_revisions
  {
    const { rows } = await pool.query('SELECT id, url, cover_image FROM document_revisions');
    for (const row of rows) {
      const newUrl = replaceStr(row.url, urlMap);
      const newCover = replaceStr(row.cover_image, urlMap);
      if (newUrl !== row.url || newCover !== row.cover_image) {
        await pool.query('UPDATE document_revisions SET url=$1, cover_image=$2 WHERE id=$3',
          [newUrl, newCover, row.id]);
        rowsUpdated++;
      }
    }
    console.log('  document_revisions — done');
  }

  // posts
  {
    const { rows } = await pool.query(
      'SELECT id, preview_image, pdf_url, images, attached_documents FROM posts'
    );
    for (const row of rows) {
      const newPreview = replaceStr(row.preview_image, urlMap);
      const newPdf = replaceStr(row.pdf_url, urlMap);
      const newImages = replaceArr(row.images, urlMap);
      const newDocs = replaceInJson(row.attached_documents, urlMap);

      const changed =
        newPreview !== row.preview_image ||
        newPdf !== row.pdf_url ||
        JSON.stringify(newImages) !== JSON.stringify(row.images) ||
        JSON.stringify(newDocs) !== JSON.stringify(row.attached_documents);

      if (changed) {
        await pool.query(
          'UPDATE posts SET preview_image=$1, pdf_url=$2, images=$3, attached_documents=$4 WHERE id=$5',
          [newPreview, newPdf, newImages, newDocs != null ? JSON.stringify(newDocs) : null, row.id]
        );
        rowsUpdated++;
      }
    }
    console.log('  posts — done');
  }

  // pages
  {
    const { rows } = await pool.query(
      'SELECT id, preview_image, attached_documents FROM pages'
    );
    for (const row of rows) {
      const newPreview = replaceStr(row.preview_image, urlMap);
      const newDocs = replaceInJson(row.attached_documents, urlMap);

      const changed =
        newPreview !== row.preview_image ||
        JSON.stringify(newDocs) !== JSON.stringify(row.attached_documents);

      if (changed) {
        await pool.query(
          'UPDATE pages SET preview_image=$1, attached_documents=$2 WHERE id=$3',
          [newPreview, newDocs != null ? JSON.stringify(newDocs) : null, row.id]
        );
        rowsUpdated++;
      }
    }
    console.log('  pages — done');
  }

  // video_links
  {
    const { rows } = await pool.query('SELECT id, thumbnail FROM video_links');
    for (const row of rows) {
      const newThumb = replaceStr(row.thumbnail, urlMap);
      if (newThumb !== row.thumbnail) {
        await pool.query('UPDATE video_links SET thumbnail=$1 WHERE id=$2', [newThumb, row.id]);
        rowsUpdated++;
      }
    }
    console.log('  video_links — done');
  }

  console.log('\n=== DONE ===');
  console.log(`Files uploaded to S3 : ${filesUploaded}`);
  console.log(`DB rows updated      : ${rowsUpdated}`);
  console.log(`Warnings             : ${warnings}`);

  await pool.end();
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
