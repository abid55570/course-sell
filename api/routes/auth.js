const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const db = require('../utils/db');
const { signAdminToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const admin = await db.get('SELECT * FROM admins WHERE email = $1', [email.toLowerCase().trim()]);
    if (!admin) return res.status(401).json({ error: 'invalid credentials' });
    const ok = bcrypt.compareSync(password, admin.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const token = signAdminToken(admin);
    res.cookie('admin_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ ok: true, admin: { id: admin.id, email: admin.email, name: admin.name } });
  } catch (e) { next(e); }
});

router.post('/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ ok: true });
});

router.get('/me', requireAdmin, async (req, res, next) => {
  try {
    const admin = await db.get(
      'SELECT id, email, name, created_at FROM admins WHERE id = $1',
      [req.admin.id]
    );
    res.json({ admin });
  } catch (e) { next(e); }
});

module.exports = router;
