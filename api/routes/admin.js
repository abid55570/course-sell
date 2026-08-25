const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../utils/db');
const { requireAdmin } = require('../middleware/auth');
const { slugify } = require('../utils/slug');
const { revalidateStorefront } = require('../utils/revalidate');

const router = express.Router();


// public/ stays at the repo root; this route now runs from api/routes/.
const pdfDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'pdfs');
if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

// In-memory storage so thumbnails go straight to the database as BYTEA. PDF
// bytes are written to disk by the route handler so they can be streamed.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'pdf' && file.mimetype !== 'application/pdf') {
      return cb(new Error('only PDF allowed'));
    }
    if (file.fieldname === 'thumbnail' && !file.mimetype.startsWith('image/')) {
      return cb(new Error('only images allowed'));
    }
    cb(null, true);
  },
});

function persistPdf(file) {
  const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `${Date.now()}-${safe}`;
  fs.writeFileSync(path.join(pdfDir, filename), file.buffer);
  return `/uploads/pdfs/${filename}`;
}

router.use(requireAdmin);

const COURSE_LIST_COLS =
  `id, slug, title, short_description, description, thumbnail, pdf_file, drive_link,
   original_price, discounted_price, category, level, duration, kind, is_published,
   send_pdf_in_email, send_drive_in_email, email_template_html, created_at, updated_at,
   thumbnail_mime, (thumbnail_data IS NOT NULL) AS has_thumbnail`;

router.get('/courses', async (req, res, next) => {
  try {
    const params = [];
    let where = '';
    if (req.query.kind) { params.push(req.query.kind); where = `WHERE kind = $${params.length}`; }
    const rows = await db.all(`SELECT ${COURSE_LIST_COLS} FROM courses ${where} ORDER BY created_at DESC`, params);
    res.json(rows);
  } catch (e) { next(e); }
});

router.get('/courses/:id', async (req, res, next) => {
  try {
    const course = await db.get(
      `SELECT ${COURSE_LIST_COLS} FROM courses WHERE id = $1`,
      [req.params.id]
    );
    if (!course) return res.status(404).json({ error: 'not found' });
    res.json(course);
  } catch (e) { next(e); }
});

const courseUpload = upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

function parseBoolField(v, fallback) {
  if (v === undefined || v === null || v === '') return fallback;
  if (v === true || v === 'true' || v === 'on' || v === '1' || v === 1) return true;
  return false;
}

router.post('/courses', courseUpload, async (req, res, next) => {
  try {
    const b = req.body;
    const title = (b.title || '').trim();
    if (!title) return res.status(400).json({ error: 'title required' });
    let slug = (b.slug || slugify(title)).trim();
    const exists = await db.get('SELECT id FROM courses WHERE slug = $1', [slug]);
    if (exists) slug = `${slug}-${Date.now().toString(36)}`;
    const original = parseFloat(b.original_price) || 0;
    const discounted = parseFloat(b.discounted_price);
    const finalDiscounted = Number.isFinite(discounted) ? discounted : original;
    const pdfFile = req.files?.pdf?.[0] ? persistPdf(req.files.pdf[0]) : null;
    const thumbFile = req.files?.thumbnail?.[0];
    const thumbBytes = thumbFile ? thumbFile.buffer : null;
    const thumbMime = thumbFile ? thumbFile.mimetype : null;
    const thumbnailUrl = thumbBytes ? `/api/courses/${slug}/thumbnail` : null;
    const result = await db.run(
      `INSERT INTO courses (slug, title, short_description, description, thumbnail, thumbnail_data, thumbnail_mime, pdf_file, drive_link,
        original_price, discounted_price, category, level, duration, is_published,
        send_pdf_in_email, send_drive_in_email, email_template_html, kind)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING id, slug, title, short_description, description, thumbnail, pdf_file, drive_link,
         original_price, discounted_price, category, level, duration, kind, is_published,
         send_pdf_in_email, send_drive_in_email, email_template_html, created_at, updated_at,
         (thumbnail_data IS NOT NULL) AS has_thumbnail`,
      [
        slug, title,
        b.short_description || null, b.description || null,
        thumbnailUrl, thumbBytes, thumbMime, pdfFile, b.drive_link || null,
        original, finalDiscounted,
        b.category || null, b.level || null, b.duration || null,
        parseBoolField(b.is_published, true),
        parseBoolField(b.send_pdf_in_email, true),
        parseBoolField(b.send_drive_in_email, true),
        b.email_template_html || null,
        b.kind === 'product' ? 'product' : 'course',
      ]
    );
    await revalidateStorefront();
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.put('/courses/:id', courseUpload, async (req, res, next) => {
  try {
    const id = req.params.id;
    const current = await db.get('SELECT * FROM courses WHERE id = $1', [id]);
    if (!current) return res.status(404).json({ error: 'not found' });
    const b = req.body;
    const pdfFile = req.files?.pdf?.[0] ? persistPdf(req.files.pdf[0]) : current.pdf_file;
    const newThumb = req.files?.thumbnail?.[0];
    const thumbBytes = newThumb ? newThumb.buffer : current.thumbnail_data;
    const thumbMime = newThumb ? newThumb.mimetype : current.thumbnail_mime;
    const thumbnailUrl = newThumb
      ? `/api/courses/${current.slug}/thumbnail`
      : current.thumbnail;
    const result = await db.run(
      `UPDATE courses SET
        title = $1, short_description = $2, description = $3, thumbnail = $4, thumbnail_data = $5, thumbnail_mime = $6,
        pdf_file = $7, drive_link = $8,
        original_price = $9, discounted_price = $10, category = $11, level = $12, duration = $13, is_published = $14,
        send_pdf_in_email = $15, send_drive_in_email = $16, email_template_html = $17, kind = $18,
        updated_at = NOW()
       WHERE id = $19
       RETURNING id, slug, title, short_description, description, thumbnail, pdf_file, drive_link,
         original_price, discounted_price, category, level, duration, kind, is_published,
         send_pdf_in_email, send_drive_in_email, email_template_html, created_at, updated_at,
         (thumbnail_data IS NOT NULL) AS has_thumbnail`,
      [
        b.title ?? current.title,
        b.short_description ?? current.short_description,
        b.description ?? current.description,
        thumbnailUrl, thumbBytes, thumbMime,
        pdfFile,
        b.drive_link ?? current.drive_link,
        b.original_price !== undefined ? parseFloat(b.original_price) : current.original_price,
        b.discounted_price !== undefined ? parseFloat(b.discounted_price) : current.discounted_price,
        b.category ?? current.category,
        b.level ?? current.level,
        b.duration ?? current.duration,
        b.is_published !== undefined ? parseBoolField(b.is_published, current.is_published) : current.is_published,
        b.send_pdf_in_email !== undefined ? parseBoolField(b.send_pdf_in_email, current.send_pdf_in_email) : current.send_pdf_in_email,
        b.send_drive_in_email !== undefined ? parseBoolField(b.send_drive_in_email, current.send_drive_in_email) : current.send_drive_in_email,
        b.email_template_html !== undefined ? (b.email_template_html || null) : current.email_template_html,
        b.kind === 'product' ? 'product' : (b.kind === 'course' ? 'course' : current.kind),
        id,
      ]
    );
    await revalidateStorefront();
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.delete('/courses/:id', async (req, res, next) => {
  try {
    const course = await db.get('SELECT * FROM courses WHERE id = $1', [req.params.id]);
    if (!course) return res.status(404).json({ error: 'not found' });
    for (const filePath of [course.pdf_file, course.thumbnail].filter(Boolean)) {
      try {
        const abs = path.join(__dirname, '..', '..', 'public', filePath);
        if (fs.existsSync(abs)) fs.unlinkSync(abs);
      } catch (e) {
        console.warn('failed to remove file', filePath, e.message);
      }
    }
    await db.run('DELETE FROM courses WHERE id = $1', [req.params.id]);
    await revalidateStorefront();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.get('/orders', async (req, res, next) => {
  try {
    // LEFT JOIN throughout so orders with no course are included too: video
    // orders, and storefront catalog orders, which point at catalog_products
    // instead. COALESCE keeps one `course_title` field for the admin UI to
    // read regardless of which table the product actually lives in — without
    // it, every catalog order would list with a blank title.
    const rows = await db.all(
      `SELECT o.*,
              COALESCE(c.title, cp.title) AS course_title,
              COALESCE(c.slug,  cp.slug)  AS course_slug,
              vt.name AS template_name, vp.public_id AS project_public_id, vp.render_status
       FROM orders o
       LEFT JOIN courses c ON c.id = o.course_id
       LEFT JOIN catalog_products cp ON cp.id = o.catalog_product_id
       LEFT JOIN video_projects vp ON vp.id = o.video_project_id
       LEFT JOIN video_templates vt ON vt.id = vp.template_id
       ORDER BY o.created_at DESC`
    );
    res.json(rows);
  } catch (e) { next(e); }
});

router.get('/orders/:orderId/transactions', async (req, res, next) => {
  try {
    const rows = await db.all(
      'SELECT * FROM transactions WHERE order_id = $1 ORDER BY created_at ASC',
      [req.params.orderId]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

router.get('/transactions', async (req, res, next) => {
  try {
    const rows = await db.all('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 200');
    res.json(rows);
  } catch (e) { next(e); }
});

// Manual override. Razorpay auto-completes orders via checkout-verify + webhook;
// this lets an admin force-complete/fulfil an order (e.g. an offline payment or
// to re-trigger a stuck video render) through the same idempotent path.
router.post('/orders/:orderId/confirm', async (req, res, next) => {
  try {
    const { markOrderPaid } = require('../services/fulfillment');
    const order = await db.get('SELECT * FROM orders WHERE order_id = $1', [req.params.orderId]);
    if (!order) return res.status(404).json({ error: 'not found' });
    if (order.status === 'completed') return res.status(400).json({ error: 'already completed' });
    const result = await markOrderPaid(order.order_id, {
      paymentId: req.body?.upi_txn_ref || order.razorpay_payment_id || null,
      actor: req.admin.email,
    });
    if (!result.ok) return res.status(400).json({ error: result.error || 'could not complete' });
    res.json({ ok: true, result });
  } catch (e) { next(e); }
});

router.post('/orders/:orderId/cancel', async (req, res, next) => {
  try {
    const order = await db.get('SELECT * FROM orders WHERE order_id = $1', [req.params.orderId]);
    if (!order) return res.status(404).json({ error: 'not found' });
    await db.run(
      "UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE order_id = $1",
      [req.params.orderId]
    );
    await db.logTransaction({
      order_id: req.params.orderId, event: 'cancelled', actor: req.admin.email, amount: order.amount,
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.get('/support', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM support_messages ORDER BY created_at DESC');
    res.json(rows);
  } catch {
    res.json([]);
  }
});

router.post('/support/:id/resolve', async (req, res, next) => {
  try {
    const r = await db.run('UPDATE support_messages SET is_resolved = TRUE WHERE id = $1', [req.params.id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.get('/stats', async (req, res, next) => {
  try {
    const courseCount = (await db.get('SELECT COUNT(*)::int AS c FROM courses')).c;
    const orderCount = (await db.get('SELECT COUNT(*)::int AS c FROM orders')).c;
    const pendingOrders = (await db.get("SELECT COUNT(*)::int AS c FROM orders WHERE status = 'pending'")).c;
    const submittedOrders = (await db.get("SELECT COUNT(*)::int AS c FROM orders WHERE status = 'submitted'")).c;
    const completedOrders = (await db.get("SELECT COUNT(*)::int AS c FROM orders WHERE status = 'completed'")).c;
    const revenueRow = await db.get("SELECT COALESCE(SUM(amount),0) AS s FROM orders WHERE status = 'completed'");
    res.json({
      courses: courseCount,
      orders: orderCount,
      pending_orders: pendingOrders,
      submitted_orders: submittedOrders,
      completed_orders: completedOrders,
      revenue: Number(revenueRow.s),
    });
  } catch (e) { next(e); }
});

module.exports = router;
