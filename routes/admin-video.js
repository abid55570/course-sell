const express = require('express');
const multer = require('multer');
const db = require('../utils/db');
const { requireAdmin } = require('../middleware/auth');
const { slugify } = require('../utils/slug');
const { enqueue } = require('../services/render-queue');

const router = express.Router();
router.use(requireAdmin);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

// ---- categories ----------------------------------------------------------
router.get('/categories', async (req, res, next) => {
  try {
    res.json(await db.all('SELECT * FROM video_categories ORDER BY sort_order, name'));
  } catch (e) { next(e); }
});

router.post('/categories', async (req, res, next) => {
  try {
    const b = req.body;
    if (!b.name) return res.status(400).json({ error: 'name required' });
    const slug = (b.slug || slugify(b.name)).trim();
    const r = await db.run(
      `INSERT INTO video_categories (slug, name, icon, sort_order, publish_from, publish_to, is_published)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order,
         publish_from=EXCLUDED.publish_from, publish_to=EXCLUDED.publish_to, is_published=EXCLUDED.is_published
       RETURNING *`,
      [slug, b.name, b.icon || null, parseInt(b.sort_order || '0', 10), b.publish_from || null, b.publish_to || null,
        b.is_published === undefined ? true : !!b.is_published]
    );
    res.json(r.rows[0]);
  } catch (e) { next(e); }
});

// ---- templates -----------------------------------------------------------
const TPL_COLS = `id, slug, name, category_id, composition_id, preset, aspect_ratios, duration_seconds,
  language_options, fields_schema, music_options, preview_video_url, price_tier, original_price, discounted_price,
  is_published, sort_order, created_at, updated_at, (thumbnail_data IS NOT NULL) AS has_thumbnail`;

router.get('/templates', async (req, res, next) => {
  try {
    res.json(await db.all(`SELECT ${TPL_COLS} FROM video_templates ORDER BY sort_order, created_at DESC`));
  } catch (e) { next(e); }
});

function parseJsonField(v, fallback) {
  if (v === undefined || v === null || v === '') return fallback;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return fallback; }
}

router.post('/templates', upload.single('thumbnail'), async (req, res, next) => {
  try {
    const b = req.body;
    if (!b.name || !b.composition_id) return res.status(400).json({ error: 'name and composition_id required' });
    let slug = (b.slug || slugify(b.name)).trim();
    if (await db.get('SELECT id FROM video_templates WHERE slug = $1', [slug])) slug = `${slug}-${Date.now().toString(36)}`;
    const thumb = req.file ? req.file.buffer : null;
    const thumbMime = req.file ? req.file.mimetype : null;
    const r = await db.run(
      `INSERT INTO video_templates
        (slug, name, category_id, composition_id, preset, aspect_ratios, duration_seconds, language_options,
         fields_schema, music_options, preview_video_url, thumbnail_data, thumbnail_mime,
         original_price, discounted_price, is_published, sort_order, price_tier)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING ${TPL_COLS}`,
      [slug, b.name, b.category_id || null, b.composition_id,
        JSON.stringify(parseJsonField(b.preset, {})),
        parseJsonField(b.aspect_ratios, ['9:16']),
        parseInt(b.duration_seconds || '20', 10),
        parseJsonField(b.language_options, ['en']),
        JSON.stringify(parseJsonField(b.fields_schema, [])),
        b.music_options ? JSON.stringify(parseJsonField(b.music_options, null)) : null,
        b.preview_video_url || null, thumb, thumbMime,
        parseFloat(b.original_price) || 0, parseFloat(b.discounted_price) || 0,
        b.is_published === undefined ? true : (b.is_published === 'true' || b.is_published === true),
        parseInt(b.sort_order || '0', 10),
        b.price_tier || null]
    );
    res.json(r.rows[0]);
  } catch (e) { next(e); }
});

router.put('/templates/:id', upload.single('thumbnail'), async (req, res, next) => {
  try {
    const cur = await db.get('SELECT * FROM video_templates WHERE id = $1', [req.params.id]);
    if (!cur) return res.status(404).json({ error: 'not found' });
    const b = req.body;
    const thumb = req.file ? req.file.buffer : cur.thumbnail_data;
    const thumbMime = req.file ? req.file.mimetype : cur.thumbnail_mime;
    const r = await db.run(
      `UPDATE video_templates SET name=$1, category_id=$2, composition_id=$3, preset=$4, aspect_ratios=$5,
        duration_seconds=$6, language_options=$7, fields_schema=$8, music_options=$9, preview_video_url=$10,
        thumbnail_data=$11, thumbnail_mime=$12, original_price=$13, discounted_price=$14, is_published=$15,
        sort_order=$16, price_tier=$17, updated_at=NOW()
       WHERE id=$18 RETURNING ${TPL_COLS}`,
      [b.name ?? cur.name, b.category_id ?? cur.category_id, b.composition_id ?? cur.composition_id,
        JSON.stringify(parseJsonField(b.preset, cur.preset)),
        parseJsonField(b.aspect_ratios, cur.aspect_ratios),
        b.duration_seconds !== undefined ? parseInt(b.duration_seconds, 10) : cur.duration_seconds,
        parseJsonField(b.language_options, cur.language_options),
        JSON.stringify(parseJsonField(b.fields_schema, cur.fields_schema)),
        b.music_options !== undefined ? JSON.stringify(parseJsonField(b.music_options, null)) : cur.music_options,
        b.preview_video_url ?? cur.preview_video_url, thumb, thumbMime,
        b.original_price !== undefined ? parseFloat(b.original_price) : cur.original_price,
        b.discounted_price !== undefined ? parseFloat(b.discounted_price) : cur.discounted_price,
        b.is_published !== undefined ? (b.is_published === 'true' || b.is_published === true) : cur.is_published,
        b.sort_order !== undefined ? parseInt(b.sort_order, 10) : cur.sort_order,
        b.price_tier !== undefined ? (b.price_tier || null) : cur.price_tier,
        req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { next(e); }
});

router.delete('/templates/:id', async (req, res, next) => {
  try {
    await db.run('DELETE FROM video_templates WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ---- render ops ----------------------------------------------------------
router.get('/queue', async (req, res, next) => {
  try {
    const recent = await db.all(
      `SELECT vp.public_id, vp.render_status, vp.render_error, vp.order_id, vp.updated_at, vt.name AS template_name
       FROM video_projects vp JOIN video_templates vt ON vt.id = vp.template_id
       ORDER BY vp.updated_at DESC LIMIT 50`);
    const counts = await db.all('SELECT render_status, COUNT(*)::int AS n FROM video_projects GROUP BY render_status');
    res.json({ counts, recent });
  } catch (e) { next(e); }
});

router.post('/projects/:publicId/rerender', async (req, res, next) => {
  try {
    const project = await db.get('SELECT * FROM video_projects WHERE public_id = $1', [req.params.publicId]);
    if (!project) return res.status(404).json({ error: 'not found' });
    if (!project.order_id) return res.status(400).json({ error: 'project has no paid order' });
    const order = await db.get('SELECT status FROM orders WHERE order_id = $1', [project.order_id]);
    if (!order || order.status !== 'completed') return res.status(400).json({ error: 'order not completed' });
    await db.run("UPDATE video_projects SET render_status='queued', render_error=NULL, updated_at=NOW() WHERE id=$1", [project.id]);
    await enqueue(project.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
