// Single source of truth for completing a paid order. Called by BOTH the
// browser checkout-verify route and the Razorpay webhook, so it must be
// idempotent: the first caller fulfils, the rest are no-ops.

const db = require('../utils/db');
const { isToolKey, getTool } = require('./tool-products');

/**
 * Mark an order paid + fulfil it (course email OR enqueue video render).
 * @returns {{ ok:boolean, alreadyDone?:boolean, productType?:string }}
 */
async function markOrderPaid(orderId, { paymentId = null, actor = 'razorpay' } = {}) {
  const order = await db.get('SELECT * FROM orders WHERE order_id = $1', [orderId]);
  if (!order) return { ok: false, error: 'order not found' };
  if (order.status === 'completed') return { ok: true, alreadyDone: true, productType: order.product_type };
  if (order.status === 'cancelled') return { ok: false, error: 'order cancelled' };

  await db.run(
    "UPDATE orders SET status='completed', razorpay_payment_id = COALESCE($1, razorpay_payment_id), updated_at=NOW() WHERE order_id=$2",
    [paymentId, orderId]
  );
  await db.logTransaction({
    order_id: orderId, event: 'completed', actor,
    amount: order.amount, upi_txn_ref: paymentId, detail: `product=${order.product_type}`,
  });

  if (order.product_type === 'video') {
    await fulfilVideo(order);
  } else if (order.product_type === 'carousel') {
    await fulfilCarousel(order);
  } else if (isToolKey(order.product_type)) {
    await fulfilTool(order);
  } else {
    await fulfilCourse(order);
  }
  return { ok: true, productType: order.product_type };
}

async function fulfilCourse(order) {
  const { sendOrderCompletedEmail } = require('../utils/email');
  const course = await db.get('SELECT * FROM courses WHERE id = $1', [order.course_id]);
  if (!course) return;
  try {
    await sendOrderCompletedEmail({ ...order, status: 'completed' }, course);
  } catch (e) {
    console.warn('course email failed', e.message);
  }
}

async function fulfilVideo(order) {
  const { enqueue } = require('./render-queue');
  if (!order.video_project_id) return;
  await db.run(
    "UPDATE video_projects SET render_status='queued', order_id=$1, updated_at=NOW() WHERE id=$2 AND render_status IN ('draft','failed','queued')",
    [order.order_id, order.video_project_id]
  );
  await enqueue(order.video_project_id);
}

async function fulfilCarousel(order) {
  const carouselLicense = require('./carousel-license');
  const { sendMail } = require('../utils/email');
  const existing = await db.get('SELECT license_key FROM carousel_licenses WHERE order_id = $1', [order.order_id]);
  if (existing) return;
  const key = await carouselLicense.create(order.buyer_email, order.order_id);
  const base = (process.env.SITE_URL || '').replace(/\/$/, '');
  const editorUrl = `${base}/carousel/editor`;
  const safeName = String(order.buyer_name || 'there').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  try {
    await sendMail({
      to: order.buyer_email,
      subject: `Your Carousel Editor license key — order ${order.order_id}`,
      html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937">
        <h2 style="color:#16a34a">You're in! Here's your license key</h2>
        <p>Hi ${safeName},</p>
        <p>Thanks for purchasing the <strong>Carousel & Post Editor</strong>. Your license key unlocks all templates + unlimited PNG exports.</p>
        <div style="background:#f0f4ff;border:2px dashed #4f46e5;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
          <div style="font-size:12px;color:#6b7280;margin-bottom:6px">YOUR LICENSE KEY</div>
          <div style="font-size:22px;font-weight:800;letter-spacing:1px;color:#1e293b;font-family:monospace">${key}</div>
        </div>
        <p>Paste it in the editor to unlock everything:</p>
        <p style="margin:16px 0">
          <a href="${editorUrl}" style="background:#4f46e5;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none">Open Carousel Editor</a>
        </p>
        <p style="color:#6b7280;font-size:13px">Order ID: <strong>${order.order_id}</strong>. Keep this email — it's your receipt and license key backup. Reply if you need help.</p>
      </div>`,
    });
  } catch (e) {
    console.warn('carousel license email failed', e.message);
  }
}

// Generic fulfilment for the six one-time tools. Generates a product-scoped
// license key and emails it. Idempotent: a second webhook is a no-op.
async function fulfilTool(order) {
  const toolLicense = require('./tool-license');
  const { sendMail } = require('../utils/email');
  const tool = getTool(order.product_type);
  if (!tool) return;
  const existing = await db.get('SELECT license_key FROM tool_licenses WHERE order_id = $1', [order.order_id]);
  if (existing) return;
  const key = await toolLicense.create(order.product_type, order.buyer_email, order.order_id);
  const base = (process.env.SITE_URL || '').replace(/\/$/, '');
  const editorUrl = `${base}${tool.editorPath}`;
  const safeName = String(order.buyer_name || 'there').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeTool = String(tool.name).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  try {
    await sendMail({
      to: order.buyer_email,
      subject: `Your ${tool.name} license key — order ${order.order_id}`,
      html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937">
        <h2 style="color:#16a34a">You're in! Here's your license key</h2>
        <p>Hi ${safeName},</p>
        <p>Thanks for purchasing <strong>${safeTool}</strong>. Your license key unlocks everything — no monthly fees, ever.</p>
        <div style="background:#f0f4ff;border:2px dashed #4f46e5;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
          <div style="font-size:12px;color:#6b7280;margin-bottom:6px">YOUR LICENSE KEY</div>
          <div style="font-size:22px;font-weight:800;letter-spacing:1px;color:#1e293b;font-family:monospace">${key}</div>
        </div>
        <p>Paste it in the tool to unlock everything:</p>
        <p style="margin:16px 0">
          <a href="${editorUrl}" style="background:#4f46e5;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none">Open ${safeTool}</a>
        </p>
        <p style="color:#6b7280;font-size:13px">Order ID: <strong>${order.order_id}</strong>. Keep this email — it's your receipt and license-key backup. Reply if you need any help.</p>
      </div>`,
    });
  } catch (e) {
    console.warn('tool license email failed', e.message);
  }
}

module.exports = { markOrderPaid };
