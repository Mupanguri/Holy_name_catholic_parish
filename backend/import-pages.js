// Import Pages Script - Run this to add sample pages to the database
// Usage: node import-pages.js
require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "windows",
    database: process.env.DB_NAME || "soccom",
});

// All pages from the Navbar COMMUNITIES tab + Programs + Contact
const pagesToImport = [
    // Programs and Contact (top nav)
    {
        title: "Programs",
        slug: "programs",
        path: "/programs",
        content: "Our parish offers various programs including:\n- Youth Ministry\n- Choir\n- Altar Servers\n- Family Apostolate\n- Catechesis\n- And many more...",
        status: "published",
        visible: true,
    },
    {
        title: "Contact",
        slug: "contact",
        path: "/contact",
        content: "Holy Name Catholic Church\nMabelreign, Harare, Zimbabwe\nEmail: catholicchurchholyname@gmail.com\n\nMass Times:\n- Weekday Masses: Tuesday to Friday at 6:30 AM\n- Saturday: Adoration at 7:00 AM, Mass at 8:00 AM\n- Sunday: English Mass at 7:30 AM, Shona Mass at 10:00 AM",
        status: "published",
        visible: true,
    },
    
    // Sections
    {
        title: "Parachute Regiment",
        slug: "parachute-regiment",
        path: "/sections/parachute-regiment",
        content: "The Parachute Regiment section of Holy Name Parish serves the spiritual needs of the community.",
        status: "published",
        visible: true,
    },
    {
        title: "Avondale West",
        slug: "avondale-west",
        path: "/sections/avondale-west",
        content: "The Avondale West section of Holy Name Parish serves the spiritual needs of the community.",
        status: "published",
        visible: true,
    },
    {
        title: "Bloomingdale",
        slug: "bloomingdale",
        path: "/sections/bloomingdale",
        content: "The Bloomingdale section of Holy Name Parish serves the spiritual needs of the community.",
        status: "published",
        visible: true,
    },
    {
        title: "Meyrick Park",
        slug: "meyrick-park",
        path: "/sections/meyrick-park",
        content: "The Meyrick Park section of Holy Name Parish serves the spiritual needs of the community.",
        status: "published",
        visible: true,
    },
    {
        title: "Cotswold Hills",
        slug: "cotswold-hills",
        path: "/sections/cotswold-hills",
        content: "The Cotswold Hills section of Holy Name Parish serves the spiritual needs of the community.",
        status: "published",
        visible: true,
    },
    {
        title: "Mabelreign Central",
        slug: "mabelreign-central",
        path: "/sections/mabelreign-central",
        content: "The Mabelreign Central section of Holy Name Parish serves the spiritual needs of the community.",
        status: "published",
        visible: true,
    },
    {
        title: "Haig Park",
        slug: "haig-park",
        path: "/sections/haig-park",
        content: "The Haig Park section of Holy Name Parish serves the spiritual needs of the community.",
        status: "published",
        visible: true,
    },

    // Choir
    {
        title: "English Choir",
        slug: "choir",
        path: "/about/choir",
        content: "Join our vibrant English choir ministry. We lead the congregation in worship during Mass with beautiful hymns and songs.",
        status: "published",
        visible: true,
    },
    {
        title: "Shona Choir",
        slug: "choir-shona",
        path: "/about/choir-shona",
        content: "Our Shona choir brings the warmth of local culture to our worship. All are welcome to join!",
        status: "published",
        visible: true,
    },

    // Committees
    {
        title: "Parish Council",
        slug: "main-gov",
        path: "/about/main-gov",
        content: "The Parish Council guides the spiritual and administrative direction of Holy Name Parish.",
        status: "published",
        visible: true,
    },
    {
        title: "Youth Council",
        slug: "youth-council",
        path: "/about/youth-council",
        content: "The Youth Council organizes activities and events for young people in our parish. Join us to grow in faith and friendship.",
        status: "published",
        visible: true,
    },
    {
        title: "Altar Servers",
        slug: "altar-servers",
        path: "/about/altar-servers",
        content: "Altar servers assist the priest during Mass. Training is provided for all interested young people.",
        status: "published",
        visible: true,
    },
    {
        title: "Missionary Childhood",
        slug: "missionary-childhood",
        path: "/about/missionary-childhood",
        content: "The Missionary Childhood program teaches children about Catholic missions worldwide.",
        status: "published",
        visible: true,
    },
    {
        title: "Family Apostolate",
        slug: "family-apostolate",
        path: "/about/family-apostolate",
        content: "The Family Apostolate supports families in our parish through counseling, marriage preparation, and family activities.",
        status: "published",
        visible: true,
    },

    // Support Teams
    {
        title: "SOCCOM",
        slug: "soccom",
        path: "/about/soccom",
        content: "The Social Communications Committee keeps our parish connected through various media channels.",
        status: "published",
        visible: true,
    },
    {
        title: "Holy Name Catechesis",
        slug: "catechesis",
        path: "/about/catechesis",
        content: "Our Catechesis program provides religious education for children and adults preparing for sacraments.",
        status: "published",
        visible: true,
    },
    {
        title: "Catholic Charismatic Renewal",
        slug: "ccr",
        path: "/about/ccr",
        content: "The CCR group meets for prayer and spiritual renewal. All are welcome to join our weekly meetings.",
        status: "published",
        visible: true,
    },
    {
        title: "Special Events",
        slug: "special-events",
        path: "/events/special-events",
        content: "Stay tuned for upcoming special events at Holy Name Parish including retreats, pilgrimages, and celebrations.",
        status: "published",
        visible: true,
    },

    // Adult Guilds
    {
        title: "Moyo Musande (Sacred Heart)",
        slug: "chemwoyo",
        path: "/about/chemwoyo",
        content: "The Moyo Musande Guild is dedicated to devotion to the Sacred Heart of Jesus.",
        status: "published",
        visible: true,
    },
    {
        title: "St Anne Guild",
        slug: "st-anne",
        path: "/about/st-anne",
        content: "The St Anne Guild honors the grandmother of Jesus and supports the spiritual growth of our parish women.",
        status: "published",
        visible: true,
    },
    {
        title: "St Joachim Guild",
        slug: "st-joachim",
        path: "/about/st-joachim",
        content: "The St Joachim Guild supports parish men in their spiritual journey.",
        status: "published",
        visible: true,
    },
    {
        title: "St Joseph Guild",
        slug: "st-joseph",
        path: "/about/st-joseph",
        content: "The St Joseph Guild honors the earthly father of Jesus and promotes Catholic family values.",
        status: "published",
        visible: true,
    },
    {
        title: "Mary Queen of Heaven",
        slug: "chamariya",
        path: "/about/chamariya",
        content: "The Mary Queen of Heaven Guild is dedicated to Marian devotion and the rosary.",
        status: "published",
        visible: true,
    },

    // Youth Guilds
    {
        title: "Moyo Musande Youth (Sacred Heart)",
        slug: "musande",
        path: "/about/musande",
        content: "Youth group dedicated to devotion to the Sacred Heart of Jesus for young people.",
        status: "published",
        visible: true,
    },
    {
        title: "St Agnes and Alois",
        slug: "agnes-alois",
        path: "/about/agnes-alois",
        content: "The St Agnes and Alois Guild for young people honors the patron saints of youth.",
        status: "published",
        visible: true,
    },
    {
        title: "St's Peter and Mary",
        slug: "st-peter-mary",
        path: "/about/st-peter-mary",
        content: "The St's Peter and Mary Guild brings together young people under the patronage of these holy patrons.",
        status: "published",
        visible: true,
    },
    {
        title: "St Mary Youth",
        slug: "st-mary-youth",
        path: "/about/st-mary-youth",
        content: "The St Mary Youth Guild encourages young people to follow Mary's example of faith.",
        status: "published",
        visible: true,
    },
    {
        title: "CYA (Catholic Youth Association)",
        slug: "cya",
        path: "/about/cya",
        content: "The Catholic Youth Association brings together young Catholics for fellowship, service, and spiritual growth.",
        status: "published",
        visible: true,
    },

    // Vatican and Library
    {
        title: "Vatican News",
        slug: "vatican",
        path: "/events/vatican",
        content: "Latest news and updates from the Vatican and the Universal Church.",
        status: "published",
        visible: true,
    },
    {
        title: "Library",
        slug: "library",
        path: "/library",
        content: "Our parish library offers spiritual resources, books, and materials for all ages. Visit us to explore our collection.",
        status: "published",
        visible: true,
    },
];

const importPages = async () => {
    console.log("Starting page import...\n");

    try {
        // Check connection
        const client = await pool.connect();
        console.log("✓ Connected to database\n");

        let imported = 0;
        let skipped = 0;
        let updated = 0;

        for (const page of pagesToImport) {
            // Check if page already exists
            const checkResult = await client.query(
                "SELECT id, status, visible FROM pages WHERE slug = $1",
                [page.slug]
            );

            if (checkResult.rows.length > 0) {
                const existingPage = checkResult.rows[0];
                // If page exists but is not published/visible, update it
                if (existingPage.status !== 'published' || existingPage.visible !== true) {
                    await client.query(
                        "UPDATE pages SET status = $1, visible = $2, title = $3, path = $4, content = $5 WHERE slug = $6",
                        [page.status, page.visible, page.title, page.path, page.content, page.slug]
                    );
                    console.log(`↻ Updated: "${page.title}" [${page.slug}]`);
                    updated++;
                } else {
                    console.log(`⏭  Skipping "${page.title}" (already exists and is live)`);
                    skipped++;
                }
                continue;
            }

            // Insert new page
            await client.query(
                `INSERT INTO pages (title, slug, path, content, status, visible, approved_by, approved_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
                [page.title, page.slug, page.path, page.content, page.status, page.visible, "System"]
            );

            console.log(`✓ Imported: "${page.title}" [${page.slug}]`);
            imported++;
        }

        console.log(`\n========================================`);
        console.log(`Import complete!`);
        console.log(`  - Imported: ${imported} pages`);
        console.log(`  - Updated: ${updated} pages`);
        console.log(`  - Skipped: ${skipped} pages (already live)`);
        console.log(`========================================\n`);

        // Show all pages
        const allPages = await client.query("SELECT id, title, slug, status, visible FROM pages ORDER BY title");
        console.log("Current pages in database:");
        allPages.rows.forEach(p => {
            console.log(`  - ${p.title} [${p.slug}] - ${p.status} ${p.visible ? '✓' : '✗'}`);
        });

        client.release();
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await pool.end();
    }
};

importPages();
