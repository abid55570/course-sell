const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const QRCode = require('qrcode');
const db = require('../utils/db');
const license = require('../services/tool-license');
const { getTool, isToolKey } = require('../services/tool-products');

const router = express.Router();

const licenseLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many attempts, try again later' } });
const publishLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, message: { error: 'Too many requests, try again later' } });

// Reject unknown tools early so the DB is only queried for real products.
router.param('product', (req, res, next, product) => {
  if (!isToolKey(product)) return res.status(404).json({ error: 'unknown tool' });
  next();
});

// ── Templates ────────────────────────────────────────────────────────────
router.get('/:product/templates', async (req, res, next) => {
  try {
    const { category } = req.query;
    const params = [req.params.product];
    let sql = 'SELECT id, product, slug, name, category, description, data, dimensions, is_free, sort_order FROM tool_templates WHERE product = $1 AND is_active = TRUE';
    if (category && category !== 'all') {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }
    sql += ' ORDER BY sort_order, created_at DESC';
    res.json(await db.all(sql, params));
  } catch (e) { next(e); }
});

router.get('/:product/templates/:slug', async (req, res, next) => {
  try {
    const row = await db.get(
      'SELECT * FROM tool_templates WHERE product = $1 AND slug = $2 AND is_active = TRUE',
      [req.params.product, req.params.slug]
    );
    if (!row) return res.status(404).json({ error: 'template not found' });
    res.json(row);
  } catch (e) { next(e); }
});

router.get('/:product/categories', async (req, res, next) => {
  try {
    const rows = await db.all(
      'SELECT DISTINCT category FROM tool_templates WHERE product = $1 AND is_active = TRUE ORDER BY category',
      [req.params.product]
    );
    res.json(rows.map((r) => r.category));
  } catch (e) { next(e); }
});

// ── License ──────────────────────────────────────────────────────────────
router.post('/:product/validate-license', licenseLimiter, async (req, res, next) => {
  try {
    const { license_key } = req.body || {};
    const result = await license.validate(license_key, req.params.product);
    if (!result) return res.json({ valid: false });
    // Don't disclose the buyer's email to unauthenticated callers holding a key.
    res.json({ valid: true });
  } catch (e) { next(e); }
});

// Never returns the key in the response; it is emailed to the buyer instead.
router.post('/:product/recover-license', licenseLimiter, async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });
    const tool = getTool(req.params.product);
    const keys = await license.findByEmail(email, req.params.product);
    const active = keys.filter((k) => k.is_active);
    if (!active.length) return res.json({ found: false });
    const { sendMail } = require('../utils/email');
    const key = active[0].license_key;
    const base = (process.env.SITE_URL || '').replace(/\/$/, '');
    try {
      await sendMail({
        to: String(email).trim().toLowerCase(),
        subject: `Your ${tool.name} license key`,
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1f2937">
          <h2>Your license key</h2>
          <p>Here is your license key for <strong>${escapeHtml(tool.name)}</strong>:</p>
          <div style="background:#f0f4ff;border:2px dashed #4f46e5;border-radius:12px;padding:20px;text-align:center;margin:16px 0">
            <div style="font-size:22px;font-weight:800;letter-spacing:1px;font-family:monospace">${escapeHtml(key)}</div>
          </div>
          <p style="margin:16px 0"><a href="${base}${escapeHtml(tool.editorPath)}" style="background:#4f46e5;color:#fff;padding:11px 20px;border-radius:8px;text-decoration:none">Open the tool</a></p>
        </div>`,
      });
    } catch (mailErr) {
      console.warn('tool recover-license email failed', mailErr.message);
    }
    res.json({ found: true, message: 'License key sent to your email' });
  } catch (e) { next(e); }
});

// ── QR menu: publish + public view ────────────────────────────────────────
function shortId(bytes) {
  return crypto.randomBytes(bytes).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').slice(0, bytes);
}

router.post('/qrmenu/publish', publishLimiter, async (req, res, next) => {
  try {
    const { license_key, shop_name, data, public_id, edit_token } = req.body || {};
    const lic = await license.validate(license_key, 'qrmenu');
    if (!lic) return res.status(403).json({ error: 'A valid QR Menu license is required to publish. Buy once to go live.' });
    if (!data || typeof data !== 'object') return res.status(400).json({ error: 'menu data required' });

    const base = (process.env.SITE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    let pid = public_id;

    if (pid && edit_token) {
      // Update an existing menu — only if the edit_token matches.
      const existing = await db.get('SELECT edit_token FROM qr_menus WHERE public_id = $1', [pid]);
      if (!existing || existing.edit_token !== edit_token) {
        return res.status(403).json({ error: 'cannot edit this menu' });
      }
      await db.run(
        'UPDATE qr_menus SET shop_name = $1, data = $2, license_key = $3, buyer_email = $4, updated_at = NOW() WHERE public_id = $5',
        [String(shop_name || 'My Shop').slice(0, 120), JSON.stringify(data), license_key, lic.email, pid]
      );
    } else {
      pid = shortId(8);
      const token = shortId(24);
      await db.run(
        'INSERT INTO qr_menus (public_id, edit_token, license_key, buyer_email, shop_name, data) VALUES ($1,$2,$3,$4,$5,$6)',
        [pid, token, license_key, lic.email, String(shop_name || 'My Shop').slice(0, 120), JSON.stringify(data)]
      );
      req._newToken = token;
    }

    const url = `${base}/m/${pid}`;
    const qr = await QRCode.toDataURL(url, { margin: 1, width: 600, color: { dark: '#0f172a', light: '#ffffff' } });
    res.json({ public_id: pid, edit_token: edit_token || req._newToken, url, qr });
  } catch (e) { next(e); }
});

// Public menu JSON — read-only, no secrets returned.
router.get('/qrmenu/menu/:publicId', async (req, res, next) => {
  try {
    const row = await db.get(
      'SELECT public_id, shop_name, data, is_published FROM qr_menus WHERE public_id = $1',
      [req.params.publicId]
    );
    if (!row || !row.is_published) return res.status(404).json({ error: 'menu not found' });
    db.run('UPDATE qr_menus SET view_count = view_count + 1 WHERE public_id = $1', [req.params.publicId]).catch(() => {});
    res.json({ public_id: row.public_id, shop_name: row.shop_name, data: row.data });
  } catch (e) { next(e); }
});

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

module.exports = router;
