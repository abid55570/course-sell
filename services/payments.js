// Razorpay payment integration. Razorpay is the single automated payment path
// for every product (courses and videos). There is no manual UPI/UTR flow:
// the buyer pays inside Razorpay Checkout (cards, UPI, netbanking, wallets) and
// the order auto-completes via signature verification + a server webhook.
//
// Signature verification is pure crypto (unit-tested without any network/keys).
// Order creation talks to the Razorpay Orders API.

const crypto = require('crypto');

function keyId() {
  return process.env.RAZORPAY_KEY_ID || '';
}
function keySecret() {
  return process.env.RAZORPAY_KEY_SECRET || '';
}
function webhookSecret() {
  return process.env.RAZORPAY_WEBHOOK_SECRET || '';
}

// True only when real live/test keys are configured. When false the app runs in
// a local "dev bypass" mode so you can click through checkout without keys.
function isConfigured() {
  return Boolean(keyId() && keySecret());
}

// Rupees -> integer paise (Razorpay works in the smallest currency unit).
function toPaise(amountInr) {
  return Math.round(Number(amountInr) * 100);
}

/**
 * Verify the signature returned by Razorpay Checkout to the browser after a
 * successful payment. Formula: HMAC_SHA256(order_id + "|" + payment_id, secret).
 * Returns true on an exact, constant-time match.
 */
function verifyCheckoutSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }, secret = keySecret()) {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !secret) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');
  return timingSafeEqualHex(expected, razorpay_signature);
}

/**
 * Verify a Razorpay webhook. Formula: HMAC_SHA256(rawBody, webhookSecret)
 * compared against the X-Razorpay-Signature header. `rawBody` MUST be the exact
 * bytes Razorpay sent (not a re-serialized object), so the webhook route reads
 * req.rawBody captured by the json body-parser's verify hook.
 */
function verifyWebhookSignature(rawBody, signature, secret = webhookSecret()) {
  if (!rawBody || !signature || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return timingSafeEqualHex(expected, signature);
}

function timingSafeEqualHex(a, b) {
  const ba = Buffer.from(String(a), 'utf8');
  const bb = Buffer.from(String(b), 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

let _client = null;
function client() {
  if (_client) return _client;
  if (!isConfigured()) return null;
  const Razorpay = require('razorpay');
  _client = new Razorpay({ key_id: keyId(), key_secret: keySecret() });
  return _client;
}

/**
 * Create a Razorpay order for the given local order. Returns the fields the
 * browser Checkout needs. In dev-bypass mode (no keys) it returns a synthetic
 * order id prefixed `order_dev_` so the flow is clickable locally.
 */
async function createPaymentOrder({ orderId, amountInr, buyerName, buyerEmail, buyerPhone, notes }) {
  const amount = toPaise(amountInr);
  if (!isConfigured()) {
    return {
      configured: false,
      key_id: 'dev_bypass',
      razorpay_order_id: `order_dev_${orderId}`,
      amount,
      currency: 'INR',
      prefill: { name: buyerName || '', email: buyerEmail || '', contact: buyerPhone || '' },
    };
  }
  const rzOrder = await client().orders.create({
    amount,
    currency: 'INR',
    receipt: orderId,
    notes: { local_order_id: orderId, ...(notes || {}) },
  });
  return {
    configured: true,
    key_id: keyId(),
    razorpay_order_id: rzOrder.id,
    amount,
    currency: 'INR',
    prefill: { name: buyerName || '', email: buyerEmail || '', contact: buyerPhone || '' },
  };
}

module.exports = {
  isConfigured,
  toPaise,
  keyId,
  createPaymentOrder,
  verifyCheckoutSignature,
  verifyWebhookSignature,
};
