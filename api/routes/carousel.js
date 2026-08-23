const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../utils/db');
const license = require('../services/carousel-license');

const router = express.Router();

const licenseLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15, message: { error: 'Too many attempts, try again later' } });

router.get('/templates', async (req, res, next) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT id, slug, name, category, description, slides, dimensions, fonts, is_free, sort_order FROM carousel_templates WHERE is_active = TRUE';
    const params = [];
    if (category && category !== 'all') {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }
    sql += ' ORDER BY sort_order, created_at DESC';
    const rows = await db.all(sql, params);
    res.json(rows.map(r => ({
      ...r,
      slide_count: Array.isArray(r.slides) ? r.slides.length : 0,
    })));
  } catch (e) { next(e); }
});

router.get('/templates/:slug', async (req, res, next) => {
  try {
    const row = await db.get(
      'SELECT * FROM carousel_templates WHERE slug = $1 AND is_active = TRUE',
      [req.params.slug]
    );
    if (!row) return res.status(404).json({ error: 'template not found' });
    res.json(row);
  } catch (e) { next(e); }
});

router.get('/categories', async (req, res, next) => {
  try {
    const rows = await db.all(
      "SELECT DISTINCT category FROM carousel_templates WHERE is_active = TRUE ORDER BY category"
    );
    res.json(rows.map(r => r.category));
  } catch (e) { next(e); }
});

router.post('/validate-license', licenseLimiter, async (req, res, next) => {
  try {
    const { license_key } = req.body || {};
    const result = await license.validate(license_key);
    if (!result) return res.json({ valid: false });
    res.json({ valid: true, email: result.email });
  } catch (e) { next(e); }
});

router.post('/recover-license', licenseLimiter, async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });
    const keys = await license.findByEmail(email);
    const active = keys.filter(k => k.is_active);
    if (!active.length) return res.json({ found: false });
    const { sendMail } = require('../utils/email');
    const key = active[0].license_key;
    try {
      await sendMail({
        to: email.trim().toLowerCase(),
        subject: 'Your Carousel Editor license key',
        html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;color:#1f2937">
          <h2>Your license key</h2>
          <div style="background:#f0f4ff;border:2px dashed #4f46e5;border-radius:12px;padding:20px;text-align:center;margin:16px 0">
            <div style="font-size:22px;font-weight:800;letter-spacing:1px;font-family:monospace">${key}</div>
          </div>
          <p style="color:#6b7280;font-size:13px">Paste this in the carousel editor to unlock all templates.</p>
        </div>`,
      });
    } catch (mailErr) {
      console.warn('recover-license email failed', mailErr.message);
    }
    res.json({ found: true, message: 'License key sent to your email' });
  } catch (e) { next(e); }
});

module.exports = router;
