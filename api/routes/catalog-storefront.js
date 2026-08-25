/**
 * The storefront's catalog feed.
 *
 * Returns `catalog_products` rows already shaped as web/lib/catalog's
 * `Product` and `Bundle` types, so the Next.js app can swap its file-based
 * catalog for this without reshaping anything at the call site.
 *
 * Deliberately separate from routes/catalog.js, which serves an older,
 * different store shape (board / class_level / subject over `courses`) that
 * other callers still depend on.
 */
const express = require('express');
const db = require('../utils/db');

const router = express.Router();

/**
 * The accent a category falls back to when its row carries none. Matches the
 * first of the catalog's documented colour keywords rather than inventing a
 * hue, so a row with a missing accent still renders in the brand palette.
 */
const DEFAULT_ACCENT = { name: 'green', hex: '#1f8a4c' };

/** NUMERIC comes back from pg as a string; the storefront types want numbers. */
function num(value) {
  if (value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Turn one database row into a Product or Bundle.
 *
 * Returns null when the row cannot be shaped. One malformed row must not take
 * down the entire listing, so the caller skips it and logs the slug rather
 * than serving a half-built product the storefront would crash on.
 *
 * @param {object} row a catalog_products row
 * @returns {object|null}
 */
function shapeRow(row) {
  if (!row || !row.slug || !row.title) return null;

  const price = num(row.price);
  if (price === undefined) return null;

  const content = row.content;
  if (!content || typeof content !== 'object' || Array.isArray(content)) return null;

  const accent = row.accent_name && row.accent_hex
    ? { name: row.accent_name, hex: row.accent_hex }
    : undefined;

  // Start from the JSONB, then let the real columns win. The columns are what
  // the admin edits and what the charge is computed from, so where the two
  // ever disagree the column is the truth.
  const shaped = { ...content };

  shaped.slug = row.slug;
  shaped.title = row.title;
  shaped.tagline = row.tagline ?? '';
  shaped.price = price;
  shaped.tags = row.tags ?? [];

  // Collections the storefront maps over without checking first. Absent means
  // empty, never undefined — a missing array here is a render crash there.
  shaped.longDescription = content.longDescription ?? [];
  shaped.bulletPoints = content.bulletPoints ?? [];
  shaped.faqs = content.faqs ?? [];
  shaped.gallery = content.gallery ?? [];
  shaped.deliveryFiles = content.deliveryFiles ?? [];

  if (row.short_title) shaped.shortTitle = row.short_title;

  const anchor = num(row.anchor_price);
  if (anchor !== undefined) shaped.anchorPrice = anchor;

  if (accent) shaped.accent = accent;

  if (row.category_slug) {
    shaped.category = {
      slug: row.category_slug,
      label: row.category_label ?? row.category_slug,
      accent: accent ?? DEFAULT_ACCENT,
    };
  }

  if (row.featured === true) shaped.featured = true;
  if (row.pair_slug) shaped.pairSlug = row.pair_slug;
  if (row.set_slug) shaped.setSlug = row.set_slug;

  // availableToday is a bundle concept. A product carrying one would make the
  // storefront render a "coming soon" badge on something that is on sale.
  if (row.kind === 'bundle') shaped.availableToday = row.available_today !== false;

  return shaped;
}

const PUBLIC_COLS = `
  id, slug, kind, title, short_title, tagline, price, anchor_price,
  category_slug, category_label, accent_name, accent_hex, tags,
  is_published, featured, available_today, pair_slug, set_slug, content`;

router.get('/', async (req, res, next) => {
  try {
    const rows = await db.all(
      `SELECT ${PUBLIC_COLS} FROM catalog_products
        WHERE is_published = TRUE
        ORDER BY kind, id`,
      []
    );

    const products = [];
    const bundles = [];
    for (const row of rows) {
      const shaped = shapeRow(row);
      if (!shaped) {
        console.warn('[catalog/storefront] skipping unusable row', row && row.slug);
        continue;
      }
      (row.kind === 'bundle' ? bundles : products).push(shaped);
    }

    res.json({ products, bundles });
  } catch (e) { next(e); }
});

module.exports = router;
module.exports.router = router;
module.exports.shapeRow = shapeRow;
