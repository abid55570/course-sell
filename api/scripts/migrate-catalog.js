#!/usr/bin/env node
/**
 * Loads the storefront catalog into `catalog_products`.
 *
 * Input is `node web/scripts/export-catalog.js --full`, which re-derives every
 * field from the TypeScript catalog at run time, so this script never holds a
 * hand-copied second version of the product data.
 *
 * Idempotent: upserts by slug, so it is safe to re-run whenever the catalog
 * files change.
 *
 * It deliberately does NOT own `is_published`. That is an operator decision
 * made in the admin panel, and re-running a content sync must not put a
 * withdrawn product back on sale — the same reasoning scripts/seed-catalog.js
 * applies to its own price columns.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { execFileSync } = require('child_process');
const db = require('../utils/db');

/**
 * Fields promoted to real columns, and therefore not repeated inside
 * `content`. Storing a value in both places invites the two copies to drift,
 * which is the whole class of bug this table exists to end.
 */
const PROMOTED = new Set([
  'slug', 'title', 'shortTitle', 'tagline', 'price', 'anchorPrice',
  'category', 'accent', 'tags', 'featured', 'availableToday',
  'pairSlug', 'setSlug',
]);

/**
 * Split one catalog item into real-column values and the JSONB remainder.
 *
 * @param {object} item a Product or Bundle from the full export
 * @param {'product'|'bundle'} kind
 * @returns {{ columns: object, content: object }}
 */
function splitRow(item, kind) {
  const columns = {
    slug: item.slug,
    kind,
    title: item.title,
    short_title: item.shortTitle ?? null,
    tagline: item.tagline,
    price: item.price,
    anchor_price: item.anchorPrice ?? null,
    category_slug: item.category?.slug ?? null,
    category_label: item.category?.label ?? null,
    accent_name: item.accent?.name ?? null,
    accent_hex: item.accent?.hex ?? null,
    tags: item.tags ?? [],
    featured: item.featured === true,
    available_today: item.availableToday !== false,
    pair_slug: item.pairSlug ?? null,
    set_slug: item.setSlug ?? null,
  };

  const content = {};
  for (const [key, value] of Object.entries(item)) {
    if (PROMOTED.has(key)) continue;
    if (value === undefined) continue;
    content[key] = value;
  }

  return { columns, content };
}

/** Column order shared by the INSERT and the UPDATE below. */
function valuesOf(columns, content) {
  return [
    columns.slug, columns.kind, columns.title, columns.short_title, columns.tagline,
    columns.price, columns.anchor_price, columns.category_slug, columns.category_label,
    columns.accent_name, columns.accent_hex, columns.tags, columns.featured,
    columns.available_today, columns.pair_slug, columns.set_slug,
    JSON.stringify(content),
  ];
}

async function upsert(item, kind) {
  const { columns, content } = splitRow(item, kind);
  const values = valuesOf(columns, content);
  const existing = await db.get('SELECT id FROM catalog_products WHERE slug = $1', [columns.slug]);

  if (existing) {
    await db.run(
      `UPDATE catalog_products SET
         kind=$2, title=$3, short_title=$4, tagline=$5, price=$6, anchor_price=$7,
         category_slug=$8, category_label=$9, accent_name=$10, accent_hex=$11,
         tags=$12, featured=$13, available_today=$14, pair_slug=$15, set_slug=$16,
         content=$17::jsonb, updated_at=NOW()
       WHERE slug=$1`,
      values
    );
    return 'updated';
  }

  await db.run(
    `INSERT INTO catalog_products
       (slug, kind, title, short_title, tagline, price, anchor_price,
        category_slug, category_label, accent_name, accent_hex, tags,
        featured, available_today, pair_slug, set_slug, content)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb)`,
    values
  );
  return 'inserted';
}

/** Run the exporter and parse its output. Separated so tests can skip it. */
function readCatalogExport() {
  const script = path.join(__dirname, '..', '..', 'web', 'scripts', 'export-catalog.js');
  const raw = execFileSync(process.execPath, [script, '--full'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return JSON.parse(raw);
}

async function main() {
  const { products, bundles } = readCatalogExport();

  let inserted = 0;
  let updated = 0;
  for (const p of products) {
    if ((await upsert(p, 'product')) === 'inserted') inserted++;
    else updated++;
  }
  for (const b of bundles) {
    if ((await upsert(b, 'bundle')) === 'inserted') inserted++;
    else updated++;
  }

  console.log(`catalog_products: ${inserted} inserted, ${updated} updated`);
  await db.close();
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}

module.exports = { splitRow, upsert, readCatalogExport };
