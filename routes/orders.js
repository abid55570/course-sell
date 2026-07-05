const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/db');
const payments = require('../services/payments');
const { markOrderPaid } = require('../services/fulfillment');
const { planPricing } = require('../services/pricing');
const { isToolKey, getTool } = require('../services/tool-products');

const router = express.Router();

// Resolve the product being purchased (course OR video project) into a common
// shape: { productType, courseId, videoProjectId, amount, title }.
async function resolveProduct(body) {
  const { course_id, video_project_id } = body || {};
  if (course_id) {
    const course = await db.get('SELECT * FROM courses WHERE id = $1 AND is_published = TRUE', [course_id]);
    if (!course) return { error: 'course not found' };
    const amount = Number(course.discounted_price) || Number(course.original_price) || 0;
    let productType = 'course';
    if (course.slug === 'carousel-editor') productType = 'carousel';
    else if (isToolKey(course.slug)) productType = course.slug;
    return { productType, courseId: course.id, amount, title: course.title, course };
  }
  if (video_project_id) {
    // Accept the project's public_id (what the browser holds) or numeric id.
    const project = await db.get(
      'SELECT * FROM video_projects WHERE public_id = $1 OR id::text = $1',
      [String(video_project_id)]
    );
    if (!project) return { error: 'video project not found' };
    const template = await db.get('SELECT * FROM video_templates WHERE id = $1 AND is_published = TRUE', [project.template_id]);
    if (!template) return { error: 'template not found' };
    // Block re-purchase of an already-paid project.
    if (project.order_id) {
      const existing = await db.get('SELECT status FROM orders WHERE order_id = $1', [project.order_id]);
      if (existing && existing.status === 'completed') return { error: 'this video is already paid for' };
    }
    // Amount comes from the buyer's chosen plan on the project.
    const amount = (planPricing(project.plan) || planPricing('standard')).discounted_price;
    return { productType: 'video', videoProjectId: project.id, amount, title: `${template.name} · ${project.plan}`, project, template };
  }
  return { error: 'course_id or video_project_id required' };
}

// Create an order + a Razorpay order. Razorpay is the only payment path.
router.post('/', async (req, res, next) => {
  try {
    const { buyer_name, buyer_email, buyer_phone } = req.body || {};
    if (!buyer_name || !buyer_email) {
      return res.status(400).json({ error: 'buyer_name and buyer_email required' });
    }
    const product = await resolveProduct(req.body);
    if (product.error) return res.status(400).json({ error: product.error });

    const orderId = `ORD-${uuidv4().slice(0, 8).toUpperCase()}`;
    await db.run(
      `INSERT INTO orders (order_id, product_type, course_id, video_project_id, buyer_name, buyer_email, buyer_phone, amount, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending')`,
      [orderId, product.productType, product.courseId || null, product.videoProjectId || null,
        buyer_name.trim(), buyer_email.trim().toLowerCase(), buyer_phone || null, product.amount]
    );
    await db.logTransaction({ order_id: orderId, event: 'created', actor: 'buyer', amount: product.amount, detail: `product=${product.productType}` });

    // Tie the video project to this (still-unpaid) order so the render can find it later.
    if (product.productType === 'video') {
      await db.run('UPDATE video_projects SET order_id = $1, buyer_email = $2, updated_at = NOW() WHERE id = $3',
        [orderId, buyer_email.trim().toLowerCase(), product.videoProjectId]);
    }

    const pay = await payments.createPaymentOrder({
      orderId, amountInr: product.amount, buyerName: buyer_name, buyerEmail: buyer_email, buyerPhone: buyer_phone,
      notes: { product_type: product.productType },
    });
    await db.run('UPDATE orders SET razorpay_order_id = $1, updated_at = NOW() WHERE order_id = $2', [pay.razorpay_order_id, orderId]);

    res.json({
      order_id: orderId,
      amount: product.amount,
      currency: pay.currency,
      product: { type: product.productType, title: product.title },
      razorpay: {
        configured: pay.configured,
        key_id: pay.key_id,
        order_id: pay.razorpay_order_id,
        amount_paise: pay.amount,
        prefill: pay.prefill,
        name: process.env.SITE_NAME || 'Checkout',
      },
    });
  } catch (err) { next(err); }
});

// Verify a Razorpay Checkout success payload and fulfil the order. When Razorpay
// keys are not configured (local dev), this accepts without a signature so the
// flow is clickable; in production a valid signature is mandatory.
router.post('/:orderId/verify', async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    const order = await db.get('SELECT * FROM orders WHERE order_id = $1', [req.params.orderId]);
    if (!order) return res.status(404).json({ error: 'order not found' });
    if (order.status === 'completed') return res.json({ ok: true, status: 'completed', product_type: order.product_type });

    if (payments.isConfigured()) {
      const ok = razorpay_order_id === order.razorpay_order_id &&
        payments.verifyCheckoutSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
      if (!ok) return res.status(400).json({ error: 'payment verification failed' });
    }
    const result = await markOrderPaid(order.order_id, {
      paymentId: razorpay_payment_id || `dev_${Date.now()}`,
      actor: 'razorpay-checkout',
    });
    if (!result.ok) return res.status(400).json({ error: result.error || 'could not complete order' });

    // Return the full license key here — this response only reaches the party
    // who just completed payment (a valid Razorpay signature is required in
    // production), so it is the safe place to hand over the key for instant
    // unlock, unlike the guessable public GET /:orderId status endpoint.
    const payload = { ok: true, status: 'completed', product_type: order.product_type };
    if (isToolKey(order.product_type)) {
      const lic = await db.get('SELECT license_key FROM tool_licenses WHERE order_id = $1', [order.order_id]);
      if (lic) payload.license_key = lic.license_key;
    } else if (order.product_type === 'carousel') {
      const lic = await db.get('SELECT license_key FROM carousel_licenses WHERE order_id = $1', [order.order_id]);
      if (lic) payload.license_key = lic.license_key;
    }
    res.json(payload);
  } catch (e) { next(e); }
});

// Order status for the delivery page (works for both product types).
router.get('/:orderId', async (req, res, next) => {
  try {
    const order = await db.get('SELECT * FROM orders WHERE order_id = $1', [req.params.orderId]);
    if (!order) return res.status(404).json({ error: 'not found' });
    const isCompleted = order.status === 'completed';
    const base = {
      order_id: order.order_id, status: order.status, amount: order.amount,
      buyer_name: order.buyer_name, buyer_email: order.buyer_email,
      product_type: order.product_type, created_at: order.created_at,
    };

    if (order.product_type === 'video') {
      const project = await db.get(
        `SELECT vp.public_id, vp.render_status, vp.output_size_mb, vt.name AS template_name
         FROM video_projects vp JOIN video_templates vt ON vt.id = vp.template_id
         WHERE vp.id = $1`, [order.video_project_id]);
      return res.json({
        ...base,
        title: project ? project.template_name : 'Video',
        video: project ? {
          public_id: project.public_id,
          render_status: project.render_status,
          size_mb: project.output_size_mb,
          ready: isCompleted && project.render_status === 'done',
        } : null,
      });
    }

    if (order.product_type === 'carousel') {
      const lic = isCompleted
        ? await db.get('SELECT license_key FROM carousel_licenses WHERE order_id = $1 AND is_active = TRUE', [order.order_id])
        : null;
      const redacted = lic ? lic.license_key.replace(/^(CRS-).+(-[A-Za-z0-9]+)$/, '$1••••••-••••••-••••••$2') : null;
      return res.json({
        ...base,
        title: 'Carousel & Post Editor',
        carousel: {
          license_key_hint: redacted,
          ready: isCompleted,
        },
      });
    }

    if (isToolKey(order.product_type)) {
      const tool = getTool(order.product_type);
      const lic = isCompleted
        ? await db.get('SELECT license_key FROM tool_licenses WHERE order_id = $1 AND is_active = TRUE', [order.order_id])
        : null;
      // Reveal only the prefix; the greedy-middle form leaked the final segment
      // on this public, guessable endpoint.
      const redacted = lic
        ? lic.license_key.replace(/^([A-Z]{2,4}-).*/, '$1••••••-••••••-••••••')
        : null;
      return res.json({
        ...base,
        title: tool ? tool.name : 'Tool',
        tool: {
          product: order.product_type,
          editor_path: tool ? tool.editorPath : null,
          license_key_hint: redacted,
          ready: isCompleted,
        },
      });
    }

    const course = await db.get(
      `SELECT title, slug, drive_link, pdf_file, send_drive_in_email, send_pdf_in_email FROM courses WHERE id = $1`,
      [order.course_id]);
    res.json({
      ...base,
      course_title: course ? course.title : null,
      course_slug: course ? course.slug : null,
      drive_link: isCompleted && course && course.send_drive_in_email ? course.drive_link : null,
      pdf_file: isCompleted && course && course.send_pdf_in_email ? course.pdf_file : null,
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
