const { randomUUID } = require('crypto');
const db = require('../utils/db');
const email = require('../utils/email');

const MAX_ATTEMPTS = 8;
function validDriveLink(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && u.hostname === 'drive.google.com' &&
      !u.username && !u.password && u.pathname !== '/';
  } catch { return false; }
}

// Claim through PostgreSQL, not an in-process flag: checkout, webhook and
// background workers can race safely. The token fences off expired workers.
async function deliverOrderEmail(orderId) {
  const token = randomUUID();
  const claimed = await db.run(
    `UPDATE order_email_deliveries d
        SET status='sending', attempts=attempts+1, claim_token=$2,
            locked_until=NOW()+INTERVAL '10 minutes', updated_at=NOW()
      WHERE d.order_id=$1 AND d.status <> 'delivered'
        AND ((d.status IN ('pending','failed') AND d.next_attempt_at <= NOW())
             OR (d.status='sending' AND d.locked_until < NOW()))
        AND EXISTS (SELECT 1 FROM orders o WHERE o.order_id=d.order_id AND o.status='completed')
      RETURNING d.*`, [orderId, token]);
  const job = claimed.rows[0];
  if (!job) return { attempted: false };

  try {
    const order = await db.get('SELECT * FROM orders WHERE order_id = $1', [orderId]);
    if (!order || order.status !== 'completed') throw new Error('Order is not paid');
    const item = order.product_type === 'catalog'
      ? await db.get('SELECT * FROM catalog_products WHERE id = $1', [order.catalog_product_id])
      : order.product_type === 'course'
        ? await db.get('SELECT * FROM courses WHERE id = $1', [order.course_id]) : null;
    if (!item || !item.send_drive_in_email || !validDriveLink(item.drive_link)) {
      throw new Error('Product needs an enabled HTTPS Google Drive link');
    }
    const result = await email.sendOrderCompletedEmail(order, item);
    const address = (v) => String(typeof v === 'string' ? v : v?.address || '').trim().toLowerCase();
    if (result?.skipped || !result?.accepted?.some((v) => address(v) === address(order.buyer_email)) ||
        result?.rejected?.some((v) => address(v) === address(order.buyer_email))) {
      throw new Error('SMTP did not accept the buyer recipient');
    }
    await db.run(
      `UPDATE order_email_deliveries SET status='delivered', delivered_at=NOW(),
         message_id=$3, last_error=NULL, locked_until=NULL, next_attempt_at=NULL, updated_at=NOW()
       WHERE order_id=$1 AND claim_token=$2 AND status='sending'`,
      [orderId, token, result.messageId || null]);
    return { attempted: true, delivered: true };
  } catch (err) {
    const delaySeconds = Math.min(3600, 60 * 2 ** (job.attempts - 1));
    // Persist a bounded, non-sensitive diagnostic; never store provider replies
    // that can contain credentials, recipient addresses or message content.
    const reason = err.message === 'Product needs an enabled HTTPS Google Drive link'
      ? err.message : 'Email was not confirmed sent; check SMTP configuration and retry';
    await db.run(
      `UPDATE order_email_deliveries SET status='failed', last_error=$3,
         next_attempt_at=CASE WHEN attempts < $4 THEN NOW()+($5 * INTERVAL '1 second') ELSE NULL END,
         locked_until=NULL, updated_at=NOW()
       WHERE order_id=$1 AND claim_token=$2 AND status='sending'`,
      [orderId, token, reason, MAX_ATTEMPTS, delaySeconds]);
    return { attempted: true, delivered: false };
  }
}

async function retryOrderEmail(orderId) {
  const result = await db.run(
    `INSERT INTO order_email_deliveries(order_id)
       SELECT order_id FROM orders WHERE order_id=$1 AND status='completed'
         AND product_type IN ('catalog','course')
     ON CONFLICT(order_id) DO UPDATE SET status='pending', attempts=0,
       next_attempt_at=NOW(), last_error=NULL, updated_at=NOW()
       WHERE order_email_deliveries.status IN ('pending','failed')
     RETURNING order_id`, [orderId]);
  if (!result.rowCount) return { ok: false, error: 'Only paid, unsent course/catalog orders can be retried' };
  return { ok: true, ...await deliverOrderEmail(orderId) };
}

let running = false;
async function processDueEmails() {
  if (running) return;
  running = true;
  try {
    const jobs = await db.all(
      `SELECT d.order_id FROM order_email_deliveries d JOIN orders o USING(order_id)
       WHERE o.status='completed' AND
         ((d.status IN ('pending','failed') AND d.next_attempt_at <= NOW())
          OR (d.status='sending' AND d.locked_until < NOW()))
       ORDER BY d.updated_at LIMIT 20`);
    for (const job of jobs) await deliverOrderEmail(job.order_id);
  } finally { running = false; }
}

function startEmailDeliveryWorker() {
  const tick = () => processDueEmails().catch(() => console.error('[email-delivery] Queue unavailable; check migration 013 and database connectivity'));
  tick();
  const timer = setInterval(tick, 30_000);
  timer.unref();
  return () => clearInterval(timer);
}

module.exports = { deliverOrderEmail, retryOrderEmail, processDueEmails, startEmailDeliveryWorker, validDriveLink };
