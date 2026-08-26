const test = require('node:test');
const assert = require('node:assert/strict');
const manual = require('../../services/manual-payment');

/**
 * These manipulate process.env directly and restore it, the same approach
 * tests/unit/env-loading.test.js takes. payments.isConfigured() and
 * manual-payment both read env at call time, so no module cache reset is
 * needed.
 */
function withEnv(vars, fn) {
  const saved = {};
  for (const [k, v] of Object.entries(vars)) {
    saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try { return fn(); } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

const NO_RAZORPAY = { RAZORPAY_KEY_ID: undefined, RAZORPAY_KEY_SECRET: undefined };
const WITH_RAZORPAY = { RAZORPAY_KEY_ID: 'rzp_test_x', RAZORPAY_KEY_SECRET: 'secret' };

test('normaliseNumber strips whatever formatting the number was stored with', () => {
  assert.equal(manual.normaliseNumber('+91 95598 72757'), '919559872757');
  assert.equal(manual.normaliseNumber('919559872757'), '919559872757');
  assert.equal(manual.normaliseNumber('+91-9559-872757'), '919559872757');
});

test('normaliseNumber rejects anything too short to be a real number', () => {
  assert.equal(manual.normaliseNumber('12345'), '');
  assert.equal(manual.normaliseNumber(''), '');
  assert.equal(manual.normaliseNumber(undefined), '');
  assert.equal(manual.normaliseNumber('not a number'), '');
});

test('paymentMode: Razorpay always wins when real keys exist', () => {
  // This is what makes the interim path self-retiring: the day the keys land,
  // the WhatsApp option stops being offered with no page edit.
  withEnv({ ...WITH_RAZORPAY, WHATSAPP_NUMBER: '919559872757' }, () => {
    assert.equal(manual.paymentMode(), 'razorpay');
  });
});

test('paymentMode: whatsapp when a number is set and Razorpay is not', () => {
  withEnv({ ...NO_RAZORPAY, WHATSAPP_NUMBER: '919559872757' }, () => {
    assert.equal(manual.paymentMode(), 'whatsapp');
  });
});

test('paymentMode: falls back to dev when neither is configured', () => {
  withEnv({ ...NO_RAZORPAY, WHATSAPP_NUMBER: undefined }, () => {
    assert.equal(manual.paymentMode(), 'dev');
  });
});

test('paymentMode: an unusable number does not enable the whatsapp path', () => {
  // Better to fall back than to render a wa.me link that goes nowhere on a
  // page where someone is about to send money.
  withEnv({ ...NO_RAZORPAY, WHATSAPP_NUMBER: '123' }, () => {
    assert.equal(manual.paymentMode(), 'dev');
  });
});

test('buildMessage carries the order id, product and amount', () => {
  const msg = manual.buildMessage({ orderId: 'ORD-ABC123', title: 'Glow-Up OS', amount: 999 });
  assert.match(msg, /ORD-ABC123/);
  assert.match(msg, /Glow-Up OS/);
  assert.match(msg, /999/);
});

test('buildLink produces a wa.me URL with the message encoded', () => {
  withEnv({ WHATSAPP_NUMBER: '+91 95598 72757' }, () => {
    const link = manual.buildLink({ orderId: 'ORD-ABC123', title: 'Glow-Up OS', amount: 999 });
    assert.match(link, /^https:\/\/wa\.me\/919559872757\?text=/);
    assert.ok(link.includes(encodeURIComponent('ORD-ABC123')));
    // A raw newline or space in a query string is a broken link.
    assert.doesNotMatch(link, /\s/);
  });
});

test('buildLink returns null with no number configured', () => {
  withEnv({ WHATSAPP_NUMBER: undefined }, () => {
    assert.equal(manual.buildLink({ orderId: 'O', title: 'T', amount: 1 }), null);
  });
});

test('checkoutBlock is present only in whatsapp mode', () => {
  withEnv({ ...NO_RAZORPAY, WHATSAPP_NUMBER: '919559872757' }, () => {
    const block = manual.checkoutBlock({ orderId: 'ORD-1', title: 'T', amount: 499 });
    assert.equal(block.number, '919559872757');
    assert.match(block.link, /^https:\/\/wa\.me\//);
    assert.match(block.message, /ORD-1/);
  });

  withEnv({ ...WITH_RAZORPAY, WHATSAPP_NUMBER: '919559872757' }, () => {
    assert.equal(manual.checkoutBlock({ orderId: 'ORD-1', title: 'T', amount: 499 }), null);
  });

  withEnv({ ...NO_RAZORPAY, WHATSAPP_NUMBER: undefined }, () => {
    assert.equal(manual.checkoutBlock({ orderId: 'ORD-1', title: 'T', amount: 499 }), null);
  });
});
