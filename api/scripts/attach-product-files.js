#!/usr/bin/env node
/**
 * Attaches the real deliverable file to every catalog product.
 *
 * Until this runs, a paid order gets the "your download is not ready yet"
 * email: catalog_products has the delivery columns (migration 012) but no
 * values in them.
 *
 * Source is the product library on disk — one file per catalog entry:
 *   <slug>.pdf                 individual guides
 *   <slug>-Complete.zip        the core OS products
 *   <slug>-Bundle.zip          bundles
 * plus a small set of names that do not follow from the slug, listed in
 * EXPLICIT below.
 *
 * Files are copied into api/storage/deliverables/, which is NOT under public/
 * and so is not reachable over HTTP at all. The gated download route in
 * routes/orders.js is the only way to them.
 *
 * Idempotent: re-running re-copies and re-points, which is what you want after
 * regenerating a PDF. It never sets send_pdf_in_email on a row whose file is
 * missing, so a failed copy cannot make the store promise a download it does
 * not have.
 *
 * Usage:
 *   node scripts/attach-product-files.js --source "C:/path/to/Dashrize-Products"
 *   node scripts/attach-product-files.js --source ... --dry-run
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const db = require('../utils/db');

// Outside public/ deliberately: anything under public/ is served by
// express.static with no auth, which made every product downloadable at a
// URL guessable from its own slug. api/routes/orders.js resolves names
// against this same directory.
const UPLOAD_DIR = path.join(__dirname, '..', 'storage', 'deliverables');

/**
 * Catalog entries whose file name cannot be derived from the slug.
 * Everything else is matched by normalising both sides.
 */
const EXPLICIT = {
  'talking-to-your-parents-full-set': 'Talking-To-Your-Parents.zip',
  'the-ten-series-full-set': 'The-Ten-Series.zip',
  'the-character-codex': 'The-Character-Codex.zip',
};

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function indexSourceFiles(root) {
  const out = new Map();
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(pdf|zip)$/i.test(entry.name)) {
        const base = entry.name.replace(/\.(pdf|zip)$/i, '');
        const key = norm(base);
        // First match wins, and directories are walked in name order, so the
        // result is stable across runs rather than depending on filesystem
        // iteration order.
        if (!out.has(key)) out.set(key, full);
      }
    }
  };
  walk(root);
  return out;
}

/** The file for one catalog row, or null when nothing on disk matches. */
function resolveFile(row, index) {
  if (EXPLICIT[row.slug]) {
    const key = norm(EXPLICIT[row.slug].replace(/\.(pdf|zip)$/i, ''));
    if (index.has(key)) return index.get(key);
  }
  const slugKey = norm(row.slug);
  for (const candidate of [slugKey, `${slugKey}-complete`, `${slugKey}-bundle`, norm(row.title)]) {
    if (index.has(candidate)) return index.get(candidate);
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const sourceIdx = args.indexOf('--source');
  const dryRun = args.includes('--dry-run');
  if (sourceIdx === -1 || !args[sourceIdx + 1]) {
    console.error('Usage: node scripts/attach-product-files.js --source "<product library path>" [--dry-run]');
    process.exit(1);
  }
  const source = args[sourceIdx + 1];
  if (!fs.existsSync(source)) {
    console.error(`Source directory does not exist: ${source}`);
    process.exit(1);
  }

  const index = indexSourceFiles(source);
  console.log(`Indexed ${index.size} deliverable file(s) under ${source}`);

  if (!dryRun) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const rows = await db.all('SELECT id, slug, title, kind FROM catalog_products ORDER BY kind, id', []);
  let attached = 0;
  const missing = [];

  for (const row of rows) {
    const src = resolveFile(row, index);
    if (!src) { missing.push(`${row.kind}:${row.slug}`); continue; }

    const ext = path.extname(src).toLowerCase();
    const filename = `${row.slug}${ext}`;
    const dest = path.join(UPLOAD_DIR, filename);
    // Stored as a bare filename now. The download route takes the basename
    // either way, so legacy `/uploads/pdfs/x.zip` values still resolve.
    const publicPath = filename;

    if (dryRun) {
      console.log(`  would attach ${row.slug} -> ${path.basename(src)} (${publicPath})`);
      attached++;
      continue;
    }

    fs.copyFileSync(src, dest);
    // Only flip the flag once the bytes are actually in place, so an
    // interrupted run never leaves a row promising a file that is not there.
    if (!fs.existsSync(dest)) {
      missing.push(`${row.kind}:${row.slug} (copy failed)`);
      continue;
    }
    await db.run(
      `UPDATE catalog_products
          SET pdf_file = $1, send_pdf_in_email = TRUE, updated_at = NOW()
        WHERE id = $2`,
      [publicPath, row.id]
    );
    attached++;
  }

  console.log(`${dryRun ? 'Would attach' : 'Attached'} ${attached} of ${rows.length} catalog entries`);
  if (missing.length) {
    console.log(`No file found for ${missing.length}:`);
    missing.forEach((m) => console.log(`  - ${m}`));
  }
  if (!dryRun) await db.close();
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}

module.exports = { resolveFile, indexSourceFiles, norm, EXPLICIT };
