/**
 * Admin CRUD for the storefront catalog.
 *
 * The existing /api/admin/courses routes write to `courses`, which is what the
 * legacy product lines (courses, the one-time tools, the carousel editor) still
 * sell through. The storefront reads `catalog_products`, so an edit made there
 * would never reach a product page — this is the route that actually makes the
 * catalog editable.
 *
 * Deliberately narrower than a full editor: it updates the scalar columns and
 * accepts a whole `content` object. Field-level editing of the nested content
 * (modules, sections, FAQs, gallery) is the next phase's UI work; this gives it
 * an API to build on, and gives the owner a way to change a price today.
 */
const express = require('express');
const db = require('../utils/db');
const { requireAdmin } = require('../middleware/auth');
const { revalidateStorefront } = require('../utils/revalidate');

const router = express.Router();
router.use(requireAdmin);

const COLS = `
  id, slug, kind, title, short_title, tagline, price, anchor_price,
  category_slug, category_label, accent_name, accent_hex, tags,
  is_published, featured, available_today, pair_slug, set_slug, content,
  pdf_file, drive_link, send_pdf_in_email, send_drive_in_email,
  created_at, updated_at`;

/**
 * Columns an admin may set, mapped to how a request value is coerced.
 *
 * A whitelist rather than "whatever the body contains": `slug` is what orders
 * and every storefront URL are keyed by, and `id` is the foreign key
 * `orders.catalog_product_id` points at. Neither is editable here — renaming a
 * slug would orphan existing orders and 404 every indexed page.
 */
const EDITABLE = {
  title: (v) => String(v),
  short_title: (v) => (v === null || v === '' ? null : String(v)),
  tagline: (v) => String(v),
  price: (v) => Number(v),
  anchor_price: (v) => (v === null || v === '' ? null : Number(v)),
  category_slug: (v) => (v === null || v === '' ? null : String(v)),
  category_label: (v) => (v === null || v === '' ? null : String(v)),
  accent_name: (v) => (v === null || v === '' ? null : String(v)),
  accent_hex: (v) => (v === null || v === '' ? null : String(v)),
  tags: (v) => (Array.isArray(v) ? v.map(String) : []),
  is_published: (v) => v === true || v === 'true' || v === 1 || v === '1',
  featured: (v) => v === true || v === 'true' || v === 1 || v === '1',
  available_today: (v) => v === true || v === 'true' || v === 1 || v === '1',
  pair_slug: (v) => (v === null || v === '' ? null : String(v)),
  set_slug: (v) => (v === null || v === '' ? null : String(v)),
  // Delivery. A row with no file must never claim a download, so the send_*
  // flags are meaningless without the matching field — see the guard in the
  // PUT handler, which refuses that combination rather than emailing a buyer
  // a link to nothing.
  pdf_file: (v) => (v === null || v === '' ? null : String(v)),
  drive_link: (v) => (v === null || v === '' ? null : String(v)),
  send_pdf_in_email: (v) => v === true || v === 'true' || v === 1 || v === '1',
  send_drive_in_email: (v) => v === true || v === 'true' || v === 1 || v === '1',
};

/**
 * Build a partial UPDATE from whichever editable keys the body carries.
 * Returns null when the body names none of them, so the caller can answer 400
 * rather than issuing an UPDATE that sets nothing.
 */
function buildUpdate(body) {
  const sets = [];
  const params = [];

  for (const [column, coerce] of Object.entries(EDITABLE)) {
    if (!(column in body)) continue;
    const value = coerce(body[column]);
    if ((column === 'price' || column === 'anchor_price') && value !== null && !Number.isFinite(value)) {
      return { error: `${column} must be a number` };
    }
    params.push(value);
    sets.push(`${column} = $${params.length}`);
  }

  // `content` is replaced wholesale rather than merged: a partial merge would
  // make it impossible to delete a module or an FAQ, since an absent key and a
  // deleted key look identical.
  if ('content' in body) {
    const content = body.content;
    if (content === null || typeof content !== 'object' || Array.isArray(content)) {
      return { error: 'content must be an object' };
    }
    params.push(JSON.stringify(content));
    sets.push(`content = $${params.length}::jsonb`);
  }

  if (sets.length === 0) return null;
  return { sets, params };
}

router.get('/', async (req, res, next) => {
  try {
    const params = [];
    let where = '';
    if (req.query.kind) {
      params.push(req.query.kind);
      where = `WHERE kind = $${params.length}`;
    }
    const rows = await db.all(
      `SELECT ${COLS} FROM catalog_products ${where} ORDER BY kind, id`,
      params
    );
    res.json(rows);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const row = await db.get(`SELECT ${COLS} FROM catalog_products WHERE id = $1`, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'not found' });
    res.json(row);
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const existing = await db.get('SELECT id FROM catalog_products WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'not found' });

    const built = buildUpdate(req.body || {});
    if (built === null) return res.status(400).json({ error: 'no editable fields in request' });
    if (built.error) return res.status(400).json({ error: built.error });

    // Never let a row promise a download it does not have. The flags and the
    // fields can arrive in separate requests, so the check is against the row
    // as it will be after this update, not against the body alone.
    const current = await db.get(
      'SELECT pdf_file, drive_link, send_pdf_in_email, send_drive_in_email FROM catalog_products WHERE id = $1',
      [req.params.id]
    );
    const after = (field) => (field in (req.body || {}) ? EDITABLE[field](req.body[field]) : current[field]);
    if (after('send_pdf_in_email') && !after('pdf_file')) {
      return res.status(400).json({ error: 'send_pdf_in_email requires a pdf_file' });
    }
    if (after('send_drive_in_email') && !after('drive_link')) {
      return res.status(400).json({ error: 'send_drive_in_email requires a drive_link' });
    }

    built.params.push(req.params.id);
    const result = await db.run(
      `UPDATE catalog_products SET ${built.sets.join(', ')}, updated_at = NOW()
        WHERE id = $${built.params.length}
        RETURNING ${COLS}`,
      built.params
    );

    await revalidateStorefront();
    res.json(result.rows[0]);
  } catch (e) { next(e); }
});

module.exports = router;
module.exports.buildUpdate = buildUpdate;
module.exports.EDITABLE = EDITABLE;
