// Single source of truth for completing a paid order. Called by BOTH the
// browser checkout-verify route and the Razorpay webhook, so it must be
// idempotent: the first caller fulfils, the rest are no-ops.

const db = require('../utils/db');

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

module.exports = { markOrderPaid };
