const express = require('express');
const db = require('../utils/db');
const { calcDiscountPercent } = require('../utils/discount');

const router = express.Router();

const COURSE_PUBLIC_COLS =
  `id, slug, title, short_description, description, thumbnail, pdf_file, drive_link,
   original_price, discounted_price, category, level, duration, kind, is_published,
   send_pdf_in_email, send_drive_in_email, created_at, updated_at,
   (thumbnail_data IS NOT NULL) AS has_thumbnail`;

function withDiscount(course) {
  return { ...course, discount_percent: calcDiscountPercent(course.original_price, course.discounted_price) };
}

router.get('/', async (req, res, next) => {
  try {
    const params = [];
    let where = 'WHERE is_published = TRUE';
    if (req.query.kind) { params.push(req.query.kind); where += ` AND kind = $${params.length}`; }
    const rows = await db.all(
      `SELECT ${COURSE_PUBLIC_COLS} FROM courses ${where} ORDER BY created_at DESC`, params
    );
    res.json(rows.map(withDiscount));
  } catch (e) { next(e); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const course = await db.get(
      `SELECT ${COURSE_PUBLIC_COLS} FROM courses WHERE slug = $1 AND is_published = TRUE`,
      [req.params.slug]
    );
    if (!course) return res.status(404).json({ error: 'not found' });
    res.json(withDiscount(course));
  } catch (e) { next(e); }
});

router.get('/:slug/thumbnail', async (req, res, next) => {
  try {
    const row = await db.get(
      'SELECT thumbnail_data, thumbnail_mime FROM courses WHERE slug = $1',
      [req.params.slug]
    );
    if (!row || !row.thumbnail_data) return res.status(404).send('Not found');
    res.set('Content-Type', row.thumbnail_mime || 'image/png');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(row.thumbnail_data);
  } catch (e) { next(e); }
});

module.exports = router;
