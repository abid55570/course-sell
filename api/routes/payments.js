// Razorpay server-to-server webhook. This is the RELIABLE confirmation path:
// even if the buyer closes the tab before the browser verify call, Razorpay
// still POSTs here and the order gets fulfilled. Mounted with a raw body parser
// (see server.js) because signature verification runs over the exact bytes.

const db = require('../utils/db');
const payments = require('../services/payments');
const { markOrderPaid } = require('../services/fulfillment');

function extractOrderId(event) {
  const p = event && event.payload;
  if (!p) return null;
  if (p.payment && p.payment.entity) return p.payment.entity.order_id;
  if (p.order && p.order.entity) return p.order.entity.id;
  return null;
}
function extractPaymentId(event) {
  const p = event && event.payload;
  return p && p.payment && p.payment.entity ? p.payment.entity.id : null;
}

async function webhook(req, res) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');

    // If no webhook secret is configured, acknowledge but do nothing (dev).
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) return res.status(200).json({ ignored: true });
    if (!payments.verifyWebhookSignature(raw, signature)) {
      return res.status(400).json({ error: 'invalid signature' });
    }

    const event = JSON.parse(raw);
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const rzOrderId = extractOrderId(event);
      if (rzOrderId) {
        const order = await db.get('SELECT order_id FROM orders WHERE razorpay_order_id = $1', [rzOrderId]);
        if (order) {
          await markOrderPaid(order.order_id, { paymentId: extractPaymentId(event), actor: 'razorpay-webhook' });
        }
      }
    }
    // Always 200 so Razorpay stops retrying a handled event.
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('webhook error', e.message);
    res.status(200).json({ ok: false });
  }
}

module.exports = { webhook };
