require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'soccom',
});

// First, ensure the level and branch columns exist
async function ensureColumns() {
  console.log('Ensuring columns exist...');
  
  // Check if level column exists
  const levelCheck = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'pages' AND column_name = 'level'"
  );
  if (levelCheck.rows.length === 0) {
    await pool.query(`ALTER TABLE pages ADD COLUMN level INTEGER DEFAULT 1`);
    console.log('Added level column to pages table');
  }
  
  // Check if branch column exists
  const branchCheck = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'pages' AND column_name = 'branch'"
  );
  if (branchCheck.rows.length === 0) {
    await pool.query(`ALTER TABLE pages ADD COLUMN branch VARCHAR(50)`);
    console.log('Added branch column to pages table');
  }
  
  console.log('Columns verified.');
}

// Phase 1: Seed branch root pages (level = 0)
async function seedBranchRoots() {
  console.log('Phase 1: Seeding branch roots...');
  
  const branchRoots = [
    { branch: 'sections', title: 'Sections', path: '/communities/sections' },
    { branch: 'choir', title: 'Choir', path: '/communities/choir' },
    { branch: 'committees', title: 'Committees', path: '/communities/committees' },
    { branch: 'support-teams', title: 'Support Teams', path: '/communities/support-teams' },
    { branch: 'adult-guilds', title: 'Adult Guilds', path: '/communities/adult-guilds' },
    { branch: 'youth-guilds', title: 'Youth Guilds', path: '/communities/youth-guilds' },
  ];
  
  for (const b of branchRoots) {
    // Check if page with this slug already exists
    const slugExists = await pool.query(
      "SELECT id FROM pages WHERE slug = $1",
      [b.branch]
    );
    if (slugExists.rows.length > 0) {
      console.log(`  SKIP (slug exists): ${b.title} (slug: ${b.branch})`);
      continue;
    }
    
    await pool.query(
      `INSERT INTO pages (title, slug, path, branch, level, status, visible, content, author_name)
       VALUES ($1, $2, $3, $4, 0, 'published', true, $5, 'System')`,
      [
        b.title, 
        b.branch, 
        b.path, 
        b.branch,
        JSON.stringify([{ id: 'intro', label: 'Introduction', data: { description: '' } }])
      ]
    );
    console.log(`  SEEDED: ${b.title}`);
  }
  console.log('Phase 1 complete.');
}

// All 6 branches with their known communities from CMSConstants
const COMMUNITY_PAGES = [
  // ── SECTIONS ──────────────────────────────────────────────
  { branch: 'sections', slug: 'parachute-regiment',  title: 'Parachute Regiment',      level: 1 },
  { branch: 'sections', slug: 'avondale-west',       title: 'Avondale West',            level: 1 },
  { branch: 'sections', slug: 'bloomingdale',        title: 'Bloomingdale',             level: 1 },
  { branch: 'sections', slug: 'meyrick-park',        title: 'Meyrick Park',             level: 1 },
  { branch: 'sections', slug: 'cotswold-hills',      title: 'Cotswold Hills',           level: 1 },
  { branch: 'sections', slug: 'mabelreign-central',  title: 'Mabelreign Central',       level: 1 },
  { branch: 'sections', slug: 'haig-park',           title: 'Haig Park',               level: 1 },

  // ── CHOIR ─────────────────────────────────────────────────
  { branch: 'choir', slug: 'english-choir',  title: 'English Choir', level: 1 },
  { branch: 'choir', slug: 'shona-choir',   title: 'Shona Choir',   level: 1 },

  // ── COMMITTEES ────────────────────────────────────────────
  { branch: 'committees', slug: 'parish-council',         title: 'Parish Council',                   level: 1 },
  { branch: 'committees', slug: 'youth-council',          title: 'Youth Council',                    level: 1 },
  { branch: 'committees', slug: 'altar-servers',          title: 'Altar Servers',                    level: 1 },
  { branch: 'committees', slug: 'missionary-childhood',   title: 'Missionary Childhood',             level: 1 },
  { branch: 'committees', slug: 'family-apostolate',      title: 'Family Apostolate Committee',      level: 1 },

  // ── SUPPORT TEAMS ─────────────────────────────────────────
  { branch: 'support-teams', slug: 'soccom',          title: 'SOCCOM',                               level: 1 },
  { branch: 'support-teams', slug: 'catechesis',      title: 'Holy Name Catechesis',                 level: 1 },
  { branch: 'support-teams', slug: 'ccr',             title: 'Catholic Charismatic Renewal (CCR)',   level: 1 },
  { branch: 'support-teams', slug: 'special-events',  title: 'Special Events Committee',             level: 1 },

  // ── ADULT GUILDS ──────────────────────────────────────────
  { branch: 'adult-guilds', slug: 'st-anne',          title: 'St Anne Guild',                          level: 1 },
  { branch: 'adult-guilds', slug: 'chemwoyo',         title: 'Moyo Musande (Sacred Heart) — Adults',   level: 1 },
  { branch: 'adult-guilds', slug: 'st-joachim',       title: 'St Joachim Guild',                       level: 1 },
  { branch: 'adult-guilds', slug: 'st-joseph',        title: 'St Joseph Guild',                        level: 1 },
  { branch: 'adult-guilds', slug: 'maria-hosi-yedenga', title: 'Maria Hosi Yedenga',                   level: 1 },

  // ── YOUTH GUILDS ──────────────────────────────────────────
  { branch: 'youth-guilds', slug: 'st-peter-mary',    title: "St's Peter and Mary",                    level: 1 },
  { branch: 'youth-guilds', slug: 'agnes-alois',      title: 'St Agnes and Alois',                     level: 1 },
  { branch: 'youth-guilds', slug: 'musande',          title: 'Moyo Musande (Sacred Heart) — Youth',    level: 1 },
  { branch: 'youth-guilds', slug: 'st-mary-youth',    title: 'St Mary Youth (Chita cha Maria)',         level: 1 },
  { branch: 'youth-guilds', slug: 'cya',              title: 'Catholic Youth Association (CYA)',        level: 1 },
];

async function seed() {
  // First ensure the columns exist
  await ensureColumns();
  
  // Run Phase 1: Seed branch roots (level = 0)
  await seedBranchRoots();
  
  // Update existing branch root pages to ensure they have branch field set and level = 0
  console.log('Ensuring existing branch roots have branch field and level set...');
  const branchSlugs = ['sections', 'choir', 'committees', 'support-teams', 'adult-guilds', 'youth-guilds'];
  for (const slug of branchSlugs) {
    await pool.query(
      "UPDATE pages SET branch = $1, level = 0 WHERE slug = $1 AND (branch IS NULL OR branch = '' OR level != 0)",
      [slug]
    );
  }
  console.log('Branch root update complete.');
  
  console.log('Seeding community pages...');
  for (const p of COMMUNITY_PAGES) {
    // Find branch root id
    const branchRow = await pool.query(
      "SELECT id FROM pages WHERE level = 0 AND branch = $1",
      [p.branch]
    );
    if (branchRow.rows.length === 0) {
      console.warn(`Branch root not found for: ${p.branch}. Run Phase 1 seed first.`);
      continue;
    }
    const parentId = branchRow.rows[0].id;
    const path = `/communities/${p.branch}/${p.slug}`;

    // Skip if already exists (check globally by slug since it's unique)
    const exists = await pool.query(
      "SELECT id FROM pages WHERE slug = $1",
      [p.slug]
    );
    if (exists.rows.length > 0) {
      console.log(`  SKIP (slug exists): ${p.title}`);
      continue;
    }

    await pool.query(
      `INSERT INTO pages (title, slug, path, parent_id, branch, level, status, visible, content, author_name)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft', false, $7, 'System')`,
      [
        p.title, p.slug, path, parentId, p.branch, p.level,
        JSON.stringify([{ id: 'intro', label: 'Introduction', data: { description: '' } }])
      ]
    );
    console.log(`  SEEDED: ${p.title} → ${path}`);
  }
  console.log('Done. All community pages seeded as draft.');
  await pool.end();
}

seed().catch(e => { console.error(e); process.exit(1); });