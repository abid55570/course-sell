const express = require('express');
const db = require('../utils/db');
const { calcDiscountPercent } = require('../utils/discount');

const router = express.Router();

const PUBLIC_COLS = `
  id, slug, title, short_description, description, thumbnail,
  original_price, discounted_price, kind,
  board, class_level, subject, exam_date, page_count,
  sample_pdf, language_mix, accent_color,
  (thumbnail_data IS NOT NULL) AS has_thumbnail`;

const FILTERABLE = ['kind', 'board', 'class_level', 'subject'];

function buildListQuery(query) {
  const params = [];
  let where = 'WHERE is_published = TRUE';
  for (const key of FILTERABLE) {
    if (query[key]) {
      params.push(query[key]);
      where += ` AND ${key} = $${params.length}`;
    }
  }
  const sql = `SELECT ${PUBLIC_COLS} FROM courses ${where} ORDER BY class_level, subject, created_at DESC`;
  return { sql, params };
}

function shapeItem(row) {
  return { ...row, discount_percent: calcDiscountPercent(row.original_price, row.discounted_price) };
}

router.get('/', async (req, res, next) => {
  try {
    const { sql, params } = buildListQuery(req.query);
    const rows = await db.all(sql, params);
    res.json(rows.map(shapeItem));
  } catch (e) { next(e); }
});

router.post('/leads', async (req, res, next) => {
  try {
    const { email, whatsapp, course_id, source } = req.body || {};
    if (!email && !whatsapp) return res.status(400).json({ error: 'email or whatsapp required' });
    await db.run(
      'INSERT INTO leads (email, whatsapp, course_id, source) VALUES ($1, $2, $3, $4)',
      [email || null, whatsapp || null, course_id || null, source || 'direct']
    );
    res.status(201).json({ ok: true });
  } catch (e) { next(e); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const item = await db.get(
      `SELECT ${PUBLIC_COLS} FROM courses WHERE slug = $1 AND is_published = TRUE`,
      [req.params.slug]
    );
    if (!item) return res.status(404).json({ error: 'not found' });
    const [chapters, faqs] = await Promise.all([
      db.all('SELECT position, title FROM course_chapters WHERE course_id = $1 ORDER BY position', [item.id]),
      db.all('SELECT position, question, answer FROM course_faqs WHERE course_id = $1 ORDER BY position', [item.id]),
    ]);
    res.json({ ...shapeItem(item), chapters, faqs });
  } catch (e) { next(e); }
});

module.exports = router;
module.exports.buildListQuery = buildListQuery;
module.exports.shapeItem = shapeItem;
