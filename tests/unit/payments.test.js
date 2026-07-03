const { test } = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const payments = require('../../services/payments');

function sign(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

test('toPaise converts rupees to integer paise', () => {
  assert.strictEqual(payments.toPaise(1199), 119900);
  assert.strictEqual(payments.toPaise(499.5), 49950);
});

test('verifyCheckoutSignature accepts a correct Razorpay signature', () => {
  const secret = 'test_secret_key';
  const razorpay_order_id = 'order_ABC123';
  const razorpay_payment_id = 'pay_XYZ789';
  const razorpay_signature = sign(`${razorpay_order_id}|${razorpay_payment_id}`, secret);
  assert.strictEqual(
    payments.verifyCheckoutSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }, secret),
    true
  );
});

test('verifyCheckoutSignature rejects a tampered signature', () => {
  const secret = 'test_secret_key';
  const razorpay_order_id = 'order_ABC123';
  const razorpay_payment_id = 'pay_XYZ789';
  const bad = sign(`${razorpay_order_id}|${razorpay_payment_id}`, 'wrong_secret');
  assert.strictEqual(
    payments.verifyCheckoutSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature: bad }, secret),
    false
  );
});

test('verifyCheckoutSignature rejects missing fields', () => {
  assert.strictEqual(payments.verifyCheckoutSignature({}, 'secret'), false);
  assert.strictEqual(
    payments.verifyCheckoutSignature({ razorpay_order_id: 'o', razorpay_payment_id: 'p' }, 'secret'),
    false
  );
});

test('verifyWebhookSignature accepts a correct webhook signature', () => {
  const secret = 'wh_secret';
  const rawBody = JSON.stringify({ event: 'payment.captured', payload: {} });
  const signature = sign(rawBody, secret);
  assert.strictEqual(payments.verifyWebhookSignature(rawBody, signature, secret), true);
});

test('verifyWebhookSignature rejects a wrong signature', () => {
  const secret = 'wh_secret';
  const rawBody = JSON.stringify({ event: 'payment.captured' });
  assert.strictEqual(payments.verifyWebhookSignature(rawBody, 'deadbeef', secret), false);
});

test('createPaymentOrder returns a dev-bypass order when unconfigured', async () => {
  // No RAZORPAY_KEY_ID/SECRET in the test env -> dev bypass.
  const out = await payments.createPaymentOrder({ orderId: 'ORD-TEST01', amountInr: 1199, buyerName: 'A', buyerEmail: 'a@b.com' });
  assert.strictEqual(out.configured, false);
  assert.strictEqual(out.amount, 119900);
  assert.match(out.razorpay_order_id, /^order_dev_/);
});
