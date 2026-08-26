#!/usr/bin/env node
// ============================================================================
// SUPERSEDED — do not run this against a database that has catalog_products.
//
// This script mirrored the file catalog into `courses` so the order pipeline
// could sell it. The catalog lives in its own table now (migration 011), the
// storefront reads it there, and routes/orders.js resolves a slug from
// catalog_products first. Running this would insert 90 duplicate `courses`
// rows shadowing the real catalog in the admin's course list, for products
// nothing sells through any more.
//
// Use `npm run migrate:catalog` instead. This file stays only so an operator
// following an older runbook gets an explanation rather than silent damage.
// ============================================================================
const pathGuard = require('path');
require('dotenv').config({ path: pathGuard.join(__dirname, '..', '..', '.env') });

async function refuseIfSuperseded() {
  const dbGuard = require('../utils/db');
  try {
    const row = await dbGuard.get(
      "SELECT to_regclass('public.catalog_products') AS t"
    );
    if (row && row.t) {
      console.error(
        [
          'seed-catalog is superseded: catalog_products exists, and both the',
          'storefront and checkout read the catalog from there. Seeding `courses`',
          'now would create duplicate rows for products nothing sells through.',
          '',
          'Run this instead:',
          '  npm --prefix api run migrate:catalog',
        ].join('\n')
      );
      await dbGuard.close();
      process.exit(1);
    }
    await dbGuard.close();
  } catch {
    // No database reachable: fall through and let the original script fail
    // with its own, more specific error.
  }
}

// A hard gate, not a warning. It must finish before the original seeding
// routine below is allowed to touch anything, so the rest of this file only
// runs once this resolves without exiting.
const supersededCheck = require.main === module
  ? refuseIfSuperseded()
  : Promise.resolve();

// Seeds the six file-catalog products (web/lib/catalog/products) and the
// bundles that are sellable today (web/lib/catalog/bundles.ts, filtered to
// availableToday === true) into the `courses` table (kind='product'), so the
// existing Razorpay + fulfilment + delivery-email pipeline in
// routes/orders.js can sell them. Idempotent — safe to re-run; it updates
// existing rows by slug rather than duplicating.
//
// The catalog itself is never hand-copied here: this script shells out to
// web/scripts/export-catalog.js, which requires the real .ts catalog source
// and prints it as JSON. web/lib/catalog stays the single source of truth
// for content (title/description/category); re-run this script any time
// that changes and the courses table syncs to match. Price and publish
// state are different: once a row exists, those belong to the admin panel
// (see upsertCourse's comment below) and this script never overwrites them
// again, so a reseed can't silently undo a discount or an unpublish.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { spawnSync } = require('child_process');
const db = require('../utils/db');

function loadCatalogSnapshot() {
  const exporter = path.join(__dirname, '..', '..', 'web', 'scripts', 'export-catalog.js');
  const result = spawnSync(process.execPath, [exporter], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (result.error) {
    throw new Error(`Could not run ${exporter}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      `web/scripts/export-catalog.js exited with code ${result.status}.\n${result.stderr || result.stdout}`
    );
  }
  try {
    return JSON.parse(result.stdout);
  } catch (e) {
    throw new Error(`Could not parse catalog JSON from export-catalog.js: ${e.message}`);
  }
}

// A course row is only useful for checkout once an admin uploads the actual
// PDF/ZIP via the admin panel (routes/admin.js persists it to
// public/uploads/pdfs/ and sets pdf_file + send_pdf_in_email). No product
// files ship in this repo, so seeding a pdf_file path here would point at a
// file that doesn't exist and the delivery email would link to a 404. Leave
// pdf_file null and send_pdf_in_email false until that upload happens —
// never claim a download that isn't there yet.
//
// This is a manual upsert (SELECT by slug, then UPDATE or INSERT), not a
// real `INSERT ... ON CONFLICT` — there is no unique constraint driving it.
//
// original_price, discounted_price and is_published are deliberately left
// out of the UPDATE below. routes/admin.js's PUT /courses/:id lets an admin
// change exactly those three fields — a discount, or pulling a product from
// sale — and running this script (its own header says "re-run any time the
// catalog changes") used to silently revert both on every re-run. A brand
// new row still gets them from the catalog once, on INSERT, same as before;
// after that they belong to whichever admin last touched them, not to this
// script. Content fields (title/description/category) stay synced on every
// reseed, since keeping the DB mirror in step with web/lib/catalog is this
// script's whole job for everything that isn't a standing operator decision.
async function upsertCourse({ slug, title, tagline, description, price, category }) {
  const existing = await db.get(
    'SELECT id, discounted_price, is_published FROM courses WHERE slug = $1',
    [slug]
  );
  if (existing) {
    await db.run(
      `UPDATE courses SET
         title = $1, short_description = $2, description = $3,
         category = $4, kind = 'product',
         updated_at = NOW()
       WHERE slug = $5`,
      [title, tagline, description, category || null, slug]
    );
    const priceNote = Number(existing.discounted_price) === price
      ? `₹${price}`
      : `₹${existing.discounted_price} kept (catalog now says ₹${price})`;
    console.log(`  updated: ${slug} (content synced; price ${priceNote}, published=${existing.is_published}, both left as an admin set them)`);
  } else {
    await db.run(
      `INSERT INTO courses
         (slug, title, short_description, description, original_price, discounted_price,
          category, kind, is_published, send_pdf_in_email, send_drive_in_email)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'product',TRUE,FALSE,FALSE)`,
      [slug, title, tagline, description, price, price, category || null]
    );
    console.log(`  created: ${slug} (₹${price})`);
  }
}

// See upsertCourse's comment: same reasoning, same three fields protected.
async function upsertBundle({ slug, title, tagline, description, price, originalPrice }) {
  const existing = await db.get(
    'SELECT id, discounted_price, is_published FROM courses WHERE slug = $1',
    [slug]
  );
  if (existing) {
    await db.run(
      `UPDATE courses SET
         title = $1, short_description = $2, description = $3,
         category = 'Bundle', kind = 'product',
         updated_at = NOW()
       WHERE slug = $4`,
      [title, tagline, description, slug]
    );
    const priceNote = Number(existing.discounted_price) === price
      ? `₹${price}`
      : `₹${existing.discounted_price} kept (catalog now says ₹${price})`;
    console.log(`  updated: ${slug} (content synced; price ${priceNote}, published=${existing.is_published}, both left as an admin set them)`);
  } else {
    await db.run(
      `INSERT INTO courses
         (slug, title, short_description, description, original_price, discounted_price,
          category, kind, is_published, send_pdf_in_email, send_drive_in_email)
       VALUES ($1,$2,$3,$4,$5,$6,'Bundle','product',TRUE,FALSE,FALSE)`,
      [slug, title, tagline, description, originalPrice, price]
    );
    console.log(`  created: ${slug} (₹${price})`);
  }
}

async function seed() {
  console.log('Reading catalog from web/lib/catalog via web/scripts/export-catalog.js...');
  const { products, bundles } = loadCatalogSnapshot();
  console.log(`Found ${products.length} products, ${bundles.length} sellable bundle(s).`);

  console.log('Seeding products...');
  for (const p of products) await upsertCourse(p);

  console.log('Seeding bundles...');
  for (const b of bundles) await upsertBundle(b);

  console.log('Done.');
}

function isConnectionError(err) {
  if (!err) return false;
  if (['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', '28P01', '3D000'].includes(err.code)) return true;
  return /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|connection.*terminated|password authentication failed|timeout expired/i.test(
    err.message || ''
  );
}

// Guarded the same way api/server.js guards app.listen(): running the seed
// (and calling process.exit on failure) only when this file is executed
// directly, not when a test requires it to exercise upsertCourse/upsertBundle
// with a stubbed db and no real Postgres or export-catalog.js subprocess.
if (require.main === module) {
  // supersededCheck exits the process when catalog_products exists, so seeding
  // only ever starts on a database that predates migration 011.
  supersededCheck
    .then(() => seed())
    .then(() => db.close())
    .catch(async (err) => {
      if (isConnectionError(err)) {
        console.error(
          [
            '',
            '✖ Could not reach the database.',
            `  DATABASE_URL=${process.env.DATABASE_URL || '(not set)'}`,
            '  api/scripts/seed-catalog.js needs a running Postgres instance to write to.',
            '  Start Postgres (e.g. `docker compose up -d db`, or your local server) and',
            '  confirm DATABASE_URL in .env points at it, then re-run:',
            '    npm run seed:catalog',
            '',
          ].join('\n')
        );
      } else {
        console.error('Seeding the catalog failed:', err.message || err);
      }
      try {
        await db.close();
      } catch {
        /* pool was never opened */
      }
      process.exit(1);
    });
}

module.exports = { upsertCourse, upsertBundle, seed, isConnectionError };
