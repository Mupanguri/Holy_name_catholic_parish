/**
 * apply-theme.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Run from your project root:
 *   node apply-theme.js
 *
 * What it does:
 *  1. Reads every .js file in src/pages/admin/
 *  2. Replaces hardcoded hex/rgba colors with CSS variable references
 *  3. Injects a useOutletContext() hook so each page can read the live theme
 *  4. Adds a <style> block override at the top of each component's return
 *  5. Writes the changes back in-place (originals backed up as .bak)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs = require('fs');
const path = require('path');

// ── CONFIG ──────────────────────────────────────────────────────────────────
const ADMIN_DIR = path.resolve(__dirname, 'src/pages/admin');
const BACKUP = true; // set false to skip .bak files

// ── COLOUR MAP ───────────────────────────────────────────────────────────────
// Maps every hardcoded value that appears in the admin pages → CSS variable.
// Keys are lowercase. Order matters: longer/more-specific strings first.
const COLOR_MAP = [
  // ── Backgrounds ──
  ['#0f1624', 'var(--theme-bg)'],
  ['#0a1019', 'var(--theme-bg-secondary)'],
  ['#000000', 'var(--theme-bg)'], // true-black dark
  ['#0a0a0a', 'var(--theme-bg-secondary)'],
  ['#f8fafc', 'var(--theme-bg)'], // light bg
  ['#ffffff', 'var(--theme-bg-secondary)'], // light card

  // ── Text ──
  ['#e8edf4', 'var(--theme-text)'],
  ['#1e293b', 'var(--theme-text)'], // light text
  ['rgba(168,204,232,0.5)', 'var(--theme-text-muted)'],
  ['rgba(168, 204, 232, 0.5)', 'var(--theme-text-muted)'],
  ['rgba(168,204,232,0.35)', 'var(--theme-text-muted)'],
  ['rgba(168, 204, 232, 0.35)', 'var(--theme-text-muted)'],
  ['rgba(168,204,232,0.4)', 'var(--theme-text-muted)'],
  ['rgba(168, 204, 232, 0.4)', 'var(--theme-text-muted)'],
  ['rgba(255,255,255,0.6)', 'var(--theme-text-muted)'],
  ['rgba(255, 255, 255, 0.6)', 'var(--theme-text-muted)'],
  ['#64748b', 'var(--theme-text-muted)'],
  ['#475569', 'var(--theme-text-muted)'],

  // ── Borders ──
  ['rgba(168,204,232,0.08)', 'var(--theme-border)'],
  ['rgba(168, 204, 232, 0.08)', 'var(--theme-border)'],
  ['rgba(168,204,232,0.06)', 'var(--theme-border)'],
  ['rgba(168, 204, 232, 0.06)', 'var(--theme-border)'],
  ['rgba(168,204,232,0.07)', 'var(--theme-border)'],
  ['rgba(168, 204, 232, 0.07)', 'var(--theme-border)'],
  ['rgba(255,255,255,0.1)', 'var(--theme-border)'],
  ['rgba(255, 255, 255, 0.1)', 'var(--theme-border)'],
  ['#e2e8f0', 'var(--theme-border)'],
  ['#cbd5e1', 'var(--theme-border)'],

  // ── Accent / Gold ──
  ['#1b3a6b', 'var(--theme-accent)'],
  ['#1B3A6B', 'var(--theme-accent)'],
  ['#3b82f6', 'var(--theme-accent)'],
  ['#63b3ed', 'var(--theme-accent)'],
  ['#3182ce', 'var(--theme-accent)'],
  ['#c9a84c', 'var(--theme-gold)'],
  ['#C9A84C', 'var(--theme-gold)'],
  ['#fbbf24', 'var(--theme-gold)'],
  ['#f6e05e', 'var(--theme-gold)'],
];

// ── GLOBAL STYLE INJECTION ───────────────────────────────────────────────────
// This <style> block is injected inside each component's return so that
// every element inside that page respects the live CSS variables.
const GLOBAL_STYLE_BLOCK = `
      <style>{\`
        /* ── theme propagation ── */
        .page-root, .page-root * {
          border-color: var(--theme-border) !important;
        }
        .page-root h1,.page-root h2,.page-root h3,
        .page-root h4,.page-root h5,.page-root h6,
        .page-root p,.page-root span,.page-root label,
        .page-root td,.page-root th,.page-root li,
        .page-root a, .page-root div, .page-root td, .page-root th {
          color: var(--theme-text) !important;
        }
        .page-root input,.page-root textarea,.page-root select {
          background: var(--theme-bg-secondary) !important;
          color: var(--theme-text) !important;
          border-color: var(--theme-border) !important;
        }
        .page-root table { background: var(--theme-bg-secondary) !important; }
        .page-root tr { border-color: var(--theme-border) !important; }
        .page-root [class*="card"],[class*="panel"],[class*="box"],
        .page-root [class*="container"],[class*="section"],[class*="wrapper"],
        .page-root [class*="modal"],.page-root [class*="dialog"] {
          background: var(--theme-bg-secondary) !important;
          color: var(--theme-text) !important;
        }
      \`}</style>`;

// ── OUTLET CONTEXT HOOK ──────────────────────────────────────────────────────
// Snippet added to each component so it can read theme / colors from the
// AdminDashboard layout (which calls setTheme and passes colors via Outlet).
const OUTLET_IMPORT_SNIPPET = `import { useOutletContext } from 'react-router-dom';`;
const OUTLET_HOOK_SNIPPET = `  const { theme, colors } = useOutletContext() || {};`;

// ── HELPERS ──────────────────────────────────────────────────────────────────

function backup(filePath) {
  if (!BACKUP) return;
  fs.copyFileSync(filePath, filePath + '.bak');
}

function applyColorMap(source) {
  let result = source;
  for (const [from, to] of COLOR_MAP) {
    // Replace both quoted string forms: '#hex' and "#hex"
    // Also handles rgba() inside template literals and style props
    const escapedFrom = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`(['"\`])${escapedFrom}\\1`, 'gi'), `'${to}'`);
    // Also replace bare occurrences inside template strings / JSX style values
    result = result.replace(
      new RegExp(`(?<!['"a-zA-Z-])${escapedFrom}(?!['"a-zA-Z0-9-])`, 'gi'),
      to
    );
  }
  return result;
}

function ensureOutletContext(source) {
  // 1. Add useOutletContext import if not present
  if (!source.includes('useOutletContext')) {
    // Try appending to existing react-router-dom import
    source = source.replace(
      /import\s*\{([^}]+)\}\s*from\s*['"]react-router-dom['"]/,
      (match, imports) => {
        const cleaned = imports.trim().replace(/,\s*$/, '');
        return `import { ${cleaned}, useOutletContext } from 'react-router-dom'`;
      }
    );
    // If no react-router-dom import existed, add a standalone one after the last import
    if (!source.includes('useOutletContext')) {
      source = source.replace(/(import[^;]+;\n)(?!import)/, `$1${OUTLET_IMPORT_SNIPPET}\n`);
    }
  }

  // 2. Add the hook call inside the component body (after the first `const` declaration)
  if (!source.includes('useOutletContext()')) {
    source = source.replace(/(const\s+\w+\s*=\s*\(\s*\)\s*=>\s*\{)/, `$1\n${OUTLET_HOOK_SNIPPET}`);
  }

  return source;
}

function ensurePageRootClass(source) {
  // Wrap the outermost returned <div> with className="page-root" if not present.
  // This is a best-effort heuristic — check the output for edge cases.
  if (source.includes('page-root')) return source;

  // Match: return ( <div (possibly with className)
  source = source.replace(/return\s*\(\s*\n?\s*<div(?!\s[^>]*className="page-root")/, match => {
    if (match.includes('className=')) {
      // Append page-root to existing className
      return match.replace(/className="([^"]*)"/, 'className="$1 page-root"');
    }
    return match.replace('<div', '<div className="page-root"');
  });

  return source;
}

function injectStyleBlock(source) {
  // Inject the <style> block as the first child of the outermost returned element.
  if (source.includes('theme propagation')) return source; // already injected

  // Find the opening tag of the outermost returned div and inject after it
  source = source.replace(/(return\s*\(\s*\n?\s*<div[^>]*>)/, `$1${GLOBAL_STYLE_BLOCK}`);

  return source;
}

// ── MAIN ─────────────────────────────────────────────────────────────────────

function processFile(filePath) {
  const fileName = path.basename(filePath);
  let source = fs.readFileSync(filePath, 'utf8');

  console.log(`\n▶ Processing: ${fileName}`);

  // Skip the AdminDashboard itself — it already owns the theme
  if (fileName === 'AdminDashboard.js' || fileName === 'AdminDashboard.jsx') {
    console.log('  ↷ Skipped (theme source file)');
    return;
  }

  backup(filePath);

  const original = source;

  source = applyColorMap(source);
  source = ensureOutletContext(source);
  source = ensurePageRootClass(source);
  source = injectStyleBlock(source);

  if (source === original) {
    console.log('  ✓ No changes needed');
  } else {
    fs.writeFileSync(filePath, source, 'utf8');
    console.log('  ✓ Updated');
  }
}

function run() {
  if (!fs.existsSync(ADMIN_DIR)) {
    console.error(`\n✗ Admin directory not found: ${ADMIN_DIR}`);
    console.error('  Edit the ADMIN_DIR constant at the top of this script.\n');
    process.exit(1);
  }

  const files = fs.readdirSync(ADMIN_DIR).filter(f => f.endsWith('.js') || f.endsWith('.jsx'));

  if (files.length === 0) {
    console.error('\n✗ No .js/.jsx files found in', ADMIN_DIR);
    process.exit(1);
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(` apply-theme.js — Holy Name Admin Panel`);
  console.log(`═══════════════════════════════════════`);
  console.log(` Target: ${ADMIN_DIR}`);
  console.log(` Files:  ${files.length}`);

  for (const file of files) {
    processFile(path.join(ADMIN_DIR, file));
  }

  console.log(`\n✅ Done. Backups saved as .bak alongside each file.`);
  console.log(`   Review changes, then delete the .bak files when satisfied.\n`);
}

run();
