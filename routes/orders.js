const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const db = require('../utils/db');
const { sendOrderPendingEmail } = require('../utils/email');

const router = express.Router();

function buildUpiLink(amount, orderId) {
  const upiId = process.env.UPI_ID || 'merchant@upi';
  const payeeName = process.env.UPI_PAYEE_NAME || 'Course Hub';
  const currency = process.env.UPI_CURRENCY || 'INR';
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: String(amount),
    cu: currency,
    tn: `Course Order ${orderId}`,
    tr: orderId,
  });
  return `upi://pay?${params.toString()}`;
}

router.post('/', async (req, res, next) => {
  try {
    const { course_id, buyer_name, buyer_email, buyer_phone } = req.body || {};
    if (!course_id || !buyer_name || !buyer_email) {
      return res.status(400).json({ error: 'course_id, buyer_name, buyer_email required' });
    }
    const course = await db.get(
      'SELECT * FROM courses WHERE id = $1 AND is_published = TRUE',
      [course_id]
    );
    if (!course) return res.status(404).json({ error: 'course not found' });
    const orderId = `ORD-${uuidv4().slice(0, 8).toUpperCase()}`;
    const amount = Number(course.discounted_price) || Number(course.original_price) || 0;
    await db.run(
      `INSERT INTO orders (order_id, course_id, buyer_name, buyer_email, buyer_phone, amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      [orderId, course.id, buyer_name.trim(), buyer_email.trim().toLowerCase(), buyer_phone || null, amount]
    );
    await db.logTransaction({
      order_id: orderId, event: 'created', actor: 'buyer', amount,
      detail: `course=${course.slug}`,
    });
    const order = await db.get('SELECT * FROM orders WHERE order_id = $1', [orderId]);
    const upiLink = buildUpiLink(amount, orderId);
    const qrDataUrl = await QRCode.toDataURL(upiLink, { margin: 1, width: 320 });
    sendOrderPendingEmail(order, course).catch((e) => console.warn('email failed', e.message));
    res.json({
      order_id: orderId,
      amount,
      course: { id: course.id, title: course.title, slug: course.slug },
      upi: {
        upi_id: process.env.UPI_ID,
        payee_name: process.env.UPI_PAYEE_NAME,
        link: upiLink,
        qr: qrDataUrl,
      },
    });
  } catch (err) { next(err); }
});

router.post('/:orderId/submit-txn', async (req, res, next) => {
  try {
    const { upi_txn_ref, notes } = req.body || {};
    if (!upi_txn_ref) return res.status(400).json({ error: 'upi_txn_ref required' });
    const result = await db.run(
      `UPDATE orders SET upi_txn_ref = $1, notes = $2, status = 'submitted', updated_at = NOW()
       WHERE order_id = $3 AND status IN ('pending','submitted')`,
      [upi_txn_ref.trim(), notes || null, req.params.orderId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'order not found or already processed' });
    await db.logTransaction({
      order_id: req.params.orderId, event: 'submitted', actor: 'buyer',
      upi_txn_ref: upi_txn_ref.trim(), detail: notes || null,
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.get('/:orderId', async (req, res, next) => {
  try {
    const order = await db.get(
      `SELECT o.order_id, o.status, o.amount, o.buyer_name, o.buyer_email, o.created_at,
              c.title AS course_title, c.slug AS course_slug, c.drive_link, c.pdf_file,
              c.send_drive_in_email, c.send_pdf_in_email
       FROM orders o JOIN courses c ON c.id = o.course_id
       WHERE o.order_id = $1`,
      [req.params.orderId]
    );
    if (!order) return res.status(404).json({ error: 'not found' });
    const isCompleted = order.status === 'completed';
    res.json({
      ...order,
      drive_link: isCompleted && order.send_drive_in_email ? order.drive_link : null,
      pdf_file: isCompleted && order.send_pdf_in_email ? order.pdf_file : null,
    });
  } catch (e) { next(e); }
});

router.get('/:orderId/pdf', async (req, res, next) => {
  try {
    const order = await db.get(
      `SELECT o.status, c.pdf_file, c.send_pdf_in_email, c.title FROM orders o
       JOIN courses c ON c.id = o.course_id WHERE o.order_id = $1`,
      [req.params.orderId]
    );
    if (!order) return res.status(404).send('Not found');
    if (order.status !== 'completed') return res.status(403).send('Payment not yet confirmed');
    if (!order.send_pdf_in_email) return res.status(403).send('PDF download disabled for this course');
    if (!order.pdf_file) return res.status(404).send('No PDF for this course');
    const abs = path.join(__dirname, '..', 'public', order.pdf_file);
    if (!fs.existsSync(abs)) return res.status(404).send('PDF missing');
    res.download(abs, `${order.title.replace(/[^a-z0-9]+/gi, '_')}.pdf`);
  } catch (e) { next(e); }
});

module.exports = router;
