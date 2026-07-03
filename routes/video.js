const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const db = require('../utils/db');
const { validateProjectData, validateStyle } = require('../utils/video-fields');
const { PALETTES } = require('../services/video-templates');
const { planCatalog, isValidPlan, getPlan, defaultPlanForTier, planPricing } = require('../services/pricing');
const { RENDERS_DIR, PHOTOS_DIR } = require('../services/storage');

const router = express.Router();
const PALETTE_NAMES = Object.keys(PALETTES);

// The palettes a buyer can choose from (for the editor's design picker).
router.get('/palettes', (req, res) => {
  res.json(PALETTE_NAMES.map((name) => ({ name, ...PALETTES[name] })));
});

// The purchase plans (Basic/Standard/Premium feature ladder) for the editor.
router.get('/plans', (req, res) => {
  const cat = planCatalog();
  res.json(['basic', 'standard', 'premium'].map((k) => cat[k]));
});

const TEMPLATE_PUBLIC_COLS =
  `vt.id, vt.slug, vt.name, vt.composition_id, vt.preset, vt.duration_seconds, vt.aspect_ratios,
   vt.language_options, vt.fields_schema, vt.music_options, vt.preview_video_url,
   vt.price_tier, vt.original_price, vt.discounted_price, vt.is_published, vt.sort_order,
   (vt.thumbnail_data IS NOT NULL) AS has_thumbnail,
   c.slug AS category_slug, c.name AS category_name`;

// Cards show a "from" price = the Basic plan (every template can be bought at
// any plan). The template's tier is the default plan pre-selected in the editor.
function withDiscount(t) {
  const basic = planPricing('basic');
  return {
    ...t,
    original_price: basic.original_price,
    discounted_price: basic.discounted_price,
    discount_percent: basic.discount_percent,
    price_from: true,
    default_plan: defaultPlanForTier(t.price_tier),
  };
}

function newPublicId() {
  return `vid_${crypto.randomBytes(9).toString('hex')}`;
}

// ---- catalog -------------------------------------------------------------
router.get('/categories', async (req, res, next) => {
  try {
    const rows = await db.all(
      `SELECT c.slug, c.name, c.icon, c.sort_order,
              COUNT(vt.id) FILTER (WHERE vt.is_published) AS template_count
       FROM video_categories c
       LEFT JOIN video_templates vt ON vt.category_id = c.id
       WHERE c.is_published = TRUE
         AND (c.publish_from IS NULL OR c.publish_from <= CURRENT_DATE)
         AND (c.publish_to IS NULL OR c.publish_to >= CURRENT_DATE)
       GROUP BY c.id
       ORDER BY c.sort_order, c.name`
    );
    res.json(rows);
  } catch (e) { next(e); }
});

router.get('/templates', async (req, res, next) => {
  try {
    const { category } = req.query;
    const params = [];
    let where = 'WHERE vt.is_published = TRUE';
    if (category) { params.push(category); where += ` AND c.slug = $${params.length}`; }
    const rows = await db.all(
      `SELECT ${TEMPLATE_PUBLIC_COLS} FROM video_templates vt
       LEFT JOIN video_categories c ON c.id = vt.category_id
       ${where} ORDER BY vt.sort_order, vt.created_at DESC`, params
    );
    res.json(rows.map(withDiscount));
  } catch (e) { next(e); }
});

router.get('/templates/:slug', async (req, res, next) => {
  try {
    const t = await db.get(
      `SELECT ${TEMPLATE_PUBLIC_COLS} FROM video_templates vt
       LEFT JOIN video_categories c ON c.id = vt.category_id
       WHERE vt.slug = $1 AND vt.is_published = TRUE`, [req.params.slug]
    );
    if (!t) return res.status(404).json({ error: 'not found' });
    res.json(withDiscount(t));
  } catch (e) { next(e); }
});

router.get('/templates/:slug/thumbnail', async (req, res, next) => {
  try {
    const row = await db.get('SELECT thumbnail_data, thumbnail_mime FROM video_templates WHERE slug = $1', [req.params.slug]);
    if (!row || !row.thumbnail_data) return res.status(404).send('Not found');
    res.set('Content-Type', row.thumbnail_mime || 'image/png');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(row.thumbnail_data);
  } catch (e) { next(e); }
});

// ---- projects (buyer customizations) -------------------------------------
async function loadTemplateBySlug(slug) {
  return db.get('SELECT * FROM video_templates WHERE slug = $1 AND is_published = TRUE', [slug]);
}

router.post('/projects', async (req, res, next) => {
  try {
    const { template_slug, form_data, style, plan, language, aspect_ratio } = req.body || {};
    const template = await loadTemplateBySlug(template_slug);
    if (!template) return res.status(404).json({ error: 'template not found' });
    const { ok, errors, cleaned } = validateProjectData(template.fields_schema, form_data || {});
    if (!ok) return res.status(400).json({ error: 'validation failed', fields: errors });
    const cleanStyle = validateStyle(style, PALETTE_NAMES);
    const chosenPlan = isValidPlan(plan) ? plan : defaultPlanForTier(template.price_tier);

    const publicId = newPublicId();
    await db.run(
      `INSERT INTO video_projects (public_id, template_id, form_data, style, plan, language, aspect_ratio, render_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'draft')`,
      [publicId, template.id, JSON.stringify(cleaned), JSON.stringify(cleanStyle), chosenPlan, language || 'en',
        aspect_ratio || (template.aspect_ratios && template.aspect_ratios[0]) || '9:16']
    );
    res.json({ public_id: publicId, template_slug: template.slug, plan: chosenPlan, cleaned, style: cleanStyle });
  } catch (e) { next(e); }
});

async function loadProject(publicId) {
  return db.get('SELECT * FROM video_projects WHERE public_id = $1', [publicId]);
}

// Update a draft (only before it is paid/locked).
router.put('/projects/:publicId', async (req, res, next) => {
  try {
    const project = await loadProject(req.params.publicId);
    if (!project) return res.status(404).json({ error: 'not found' });
    if (project.order_id) {
      const order = await db.get('SELECT status FROM orders WHERE order_id = $1', [project.order_id]);
      if (order && order.status === 'completed') return res.status(409).json({ error: 'video already paid; edits are locked' });
    }
    const template = await db.get('SELECT * FROM video_templates WHERE id = $1', [project.template_id]);
    const { ok, errors, cleaned } = validateProjectData(template.fields_schema, req.body.form_data || {});
    if (!ok) return res.status(400).json({ error: 'validation failed', fields: errors });
    const cleanStyle = validateStyle(req.body.style, PALETTE_NAMES);
    const chosenPlan = isValidPlan(req.body.plan) ? req.body.plan : project.plan;
    await db.run('UPDATE video_projects SET form_data = $1, style = $2, plan = $3, updated_at = NOW() WHERE id = $4',
      [JSON.stringify(cleaned), JSON.stringify(cleanStyle), chosenPlan, project.id]);
    res.json({ public_id: project.public_id, plan: chosenPlan, cleaned, style: cleanStyle });
  } catch (e) { next(e); }
});

router.get('/projects/:publicId', async (req, res, next) => {
  try {
    const project = await db.get(
      `SELECT vp.public_id, vp.form_data, vp.style, vp.plan, vp.language, vp.aspect_ratio, vp.render_status,
              vp.order_id, vp.output_size_mb, vt.slug AS template_slug, vt.name AS template_name,
              vt.fields_schema, vt.composition_id, vt.preset, vt.duration_seconds
       FROM video_projects vp JOIN video_templates vt ON vt.id = vp.template_id
       WHERE vp.public_id = $1`, [req.params.publicId]);
    if (!project) return res.status(404).json({ error: 'not found' });
    let paid = false;
    if (project.order_id) {
      const order = await db.get('SELECT status FROM orders WHERE order_id = $1', [project.order_id]);
      paid = !!order && order.status === 'completed';
    }
    res.json({ ...project, paid, ready: paid && project.render_status === 'done' });
  } catch (e) { next(e); }
});

router.get('/projects/:publicId/status', async (req, res, next) => {
  try {
    const project = await loadProject(req.params.publicId);
    if (!project) return res.status(404).json({ error: 'not found' });
    let paid = false;
    if (project.order_id) {
      const order = await db.get('SELECT status FROM orders WHERE order_id = $1', [project.order_id]);
      paid = !!order && order.status === 'completed';
    }
    res.json({
      public_id: project.public_id,
      render_status: project.render_status,
      paid,
      ready: paid && project.render_status === 'done',
      error: project.render_error || null,
    });
  } catch (e) { next(e); }
});

// Photo upload (stored privately; used by future photo-enabled templates).
const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => cb(file.mimetype.startsWith('image/') ? null : new Error('only images allowed'), file.mimetype.startsWith('image/')),
});
router.post('/projects/:publicId/photos', photoUpload.array('photos', 5), async (req, res, next) => {
  try {
    const project = await loadProject(req.params.publicId);
    if (!project) return res.status(404).json({ error: 'not found' });
    // Cap the total number of photos to the chosen plan's allowance.
    const plan = getPlan(project.plan) || getPlan('standard');
    const existing = project.photos || [];
    const room = Math.max(0, plan.maxPhotos - existing.length);
    const files = (req.files || []).slice(0, room);
    const saved = [];
    for (const file of files) {
      const safe = `${project.public_id}-${crypto.randomBytes(4).toString('hex')}.img`;
      fs.writeFileSync(path.join(PHOTOS_DIR, safe), file.buffer);
      saved.push(safe);
    }
    const photos = [...existing, ...saved];
    await db.run('UPDATE video_projects SET photos = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(photos), project.id]);
    res.json({ ok: true, photos, max: plan.maxPhotos });
  } catch (e) { next(e); }
});

// ---- GATED download: only a paid + fully rendered project serves the file ---
router.get('/projects/:publicId/download', async (req, res, next) => {
  try {
    const variant = req.query.variant === 'wa' ? 'wa' : 'hd';
    const project = await loadProject(req.params.publicId);
    if (!project) return res.status(404).send('Not found');
    if (!project.order_id) return res.status(403).send('Payment required');
    const order = await db.get('SELECT status FROM orders WHERE order_id = $1', [project.order_id]);
    if (!order || order.status !== 'completed') return res.status(403).send('Payment not confirmed');
    if (project.render_status !== 'done') return res.status(409).send('Video still rendering');
    const fileName = variant === 'wa' ? project.wa_file : project.output_file;
    if (!fileName) return res.status(404).send('File not available');
    const abs = path.join(RENDERS_DIR, path.basename(fileName));
    if (!fs.existsSync(abs)) return res.status(404).send('File missing');
    res.download(abs, `invite-${project.public_id}-${variant}.mp4`);
  } catch (e) { next(e); }
});

module.exports = router;
