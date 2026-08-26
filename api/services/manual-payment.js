/**
 * The interim WhatsApp payment path, for while Razorpay onboarding is blocked.
 *
 * The buyer messages a number, pays there, and types the payment reference
 * back into the order page. That moves the order to `submitted` — a status
 * that already existed for exactly this, from the manual UPI flow this store
 * used before Razorpay. Nothing is delivered on the buyer's word: an admin
 * confirms in the panel, which calls markOrderPaid and sends the receipt.
 *
 * This turns itself off. `paymentMode()` prefers Razorpay whenever real keys
 * are configured, so the day those land the WhatsApp path stops being offered
 * without anyone editing a page.
 */
const payments = require('./payments');

/** Digits only, so a number stored as "+91 95598 72757" still builds a valid link. */
function normaliseNumber(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits : '';
}

function whatsappNumber() {
  return normaliseNumber(process.env.WHATSAPP_NUMBER);
}

/**
 * Which payment path this server should offer.
 *
 * - 'razorpay' whenever real keys exist. Always wins.
 * - 'whatsapp' when a number is configured and Razorpay is not.
 * - 'dev'      the existing local auto-complete, when neither applies.
 */
function paymentMode() {
  if (payments.isConfigured()) return 'razorpay';
  if (whatsappNumber()) return 'whatsapp';
  return 'dev';
}

/**
 * The prefilled message. It carries the order id, product and amount so the
 * seller can identify the order from the chat alone, without asking — and so
 * the buyer never has to remember or retype it.
 */
function buildMessage({ orderId, title, amount }) {
  return [
    `Hi! I'd like to pay for my Dropdesk order.`,
    ``,
    `Order: ${orderId}`,
    `Product: ${title}`,
    `Amount: ₹${amount}`,
  ].join('\n');
}

/** The wa.me link, or null when no number is configured. */
function buildLink({ orderId, title, amount }) {
  const number = whatsappNumber();
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(buildMessage({ orderId, title, amount }))}`;
}

/**
 * The block the create-order response carries when this path is active.
 * Returns null in every other mode, so the storefront can simply check for it.
 */
function checkoutBlock({ orderId, title, amount }) {
  if (paymentMode() !== 'whatsapp') return null;
  return {
    number: whatsappNumber(),
    link: buildLink({ orderId, title, amount }),
    message: buildMessage({ orderId, title, amount }),
  };
}

module.exports = {
  normaliseNumber,
  whatsappNumber,
  paymentMode,
  buildMessage,
  buildLink,
  checkoutBlock,
};
