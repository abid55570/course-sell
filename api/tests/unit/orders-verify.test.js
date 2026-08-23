const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const express = require('express');

const db = require('../../utils/db');
const payments = require('../../services/payments');

/**
 * Regression coverage for the fail-open signature bug: POST
 * /api/orders/:id/verify used to skip signature checking whenever
 * payments.isConfigured() was false, and fell back to trusting whatever
 * razorpay_payment_id the caller sent. With this repo's actual .env
 * (RAZORPAY_KEY_ID/SECRET both empty strings), a production deploy that
 * inherited that config would let anyone mint a completed order for free.
 *
 * The fix makes that path require an explicit RAZORPAY_DEV_BYPASS=true
 * opt-in (and never in production) instead of merely-absent keys. These
 * tests exercise the route directly over a real HTTP server on an ephemeral
 * port, with `db` stubbed the same way tests/unit/resolve-product.test.js
 * does -- no Postgres involved, matching this environment (no reachable DB).
 */

function withEnv(vars, fn) {
  const original = {};
  for (const key of Object.keys(vars)) original[key] = process.env[key];
  const restore = () => {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return { restore };
}

function stubDb(order) {
  const state = { ...order };
  const originals = { get: db.get, run: db.run, logTransaction: db.logTransaction };
  db.get = async (sql, params) => {
    if (/FROM orders WHERE order_id = \$1/.test(sql)) {
      return params[0] === state.order_id ? { ...state } : null;
    }
    // fulfilCourse's course lookup: return null so it no-ops instead of
    // trying to send a real email through unconfigured SMTP.
    if (/FROM courses WHERE id = \$1/.test(sql)) return null;
    if (/tool_licenses|carousel_licenses/.test(sql)) return null;
    return null;
  };
  db.run = async (sql) => {
    if (/UPDATE orders SET status/i.test(sql)) state.status = 'completed';
    return { rowCount: 1, rows: [] };
  };
  db.logTransaction = async () => {};
  return {
    state,
    restore: () => Object.assign(db, originals),
  };
}

async function startApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/orders', require('../../routes/orders'));
  app.use((err, req, res, _next) => res.status(500).json({ error: err.message }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const port = server.address().port;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

function baseOrder(overrides = {}) {
  return {
    order_id: 'ORD-VERIFYTEST',
    status: 'pending',
    product_type: 'course',
    course_id: 999,
    razorpay_order_id: 'order_live_abc',
    ...overrides,
  };
}

test('configured keys: a valid signature verifies and completes the order', async () => {
  const envs = withEnv({ RAZORPAY_KEY_ID: 'rzp_test_id', RAZORPAY_KEY_SECRET: 'test_secret', RAZORPAY_DEV_BYPASS: undefined, NODE_ENV: 'development' });
  const dbStub = stubDb(baseOrder());
  const app = await startApp();
  try {
    const signature = crypto
      .createHmac('sha256', 'test_secret')
      .update('order_live_abc|pay_ok')
      .digest('hex');
    const res = await fetch(`${app.baseUrl}/api/orders/ORD-VERIFYTEST/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: 'order_live_abc',
        razorpay_payment_id: 'pay_ok',
        razorpay_signature: signature,
      }),
    });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.status, 'completed');
    assert.equal(dbStub.state.status, 'completed');
  } finally {
    await app.close();
    dbStub.restore();
    envs.restore();
  }
});

test('configured keys: an invalid signature is rejected, order stays unpaid', async () => {
  const envs = withEnv({ RAZORPAY_KEY_ID: 'rzp_test_id', RAZORPAY_KEY_SECRET: 'test_secret', RAZORPAY_DEV_BYPASS: undefined, NODE_ENV: 'development' });
  const dbStub = stubDb(baseOrder());
  const app = await startApp();
  try {
    const res = await fetch(`${app.baseUrl}/api/orders/ORD-VERIFYTEST/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: 'order_live_abc',
        razorpay_payment_id: 'pay_ok',
        razorpay_signature: 'not-a-real-signature',
      }),
    });
    const body = await res.json();
    assert.equal(res.status, 400);
    assert.match(body.error, /verification failed/i);
    assert.equal(dbStub.state.status, 'pending');
  } finally {
    await app.close();
    dbStub.restore();
    envs.restore();
  }
});

test('unset keys, no opt-in: refuses with 503 and leaves the order unpaid -- the fail-closed default', async () => {
  const envs = withEnv({ RAZORPAY_KEY_ID: '', RAZORPAY_KEY_SECRET: '', RAZORPAY_DEV_BYPASS: undefined, NODE_ENV: 'development' });
  const dbStub = stubDb(baseOrder());
  const app = await startApp();
  try {
    const res = await fetch(`${app.baseUrl}/api/orders/ORD-VERIFYTEST/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: 'order_live_abc',
        razorpay_payment_id: 'anything-i-want',
        razorpay_signature: '',
      }),
    });
    const body = await res.json();
    assert.equal(res.status, 503);
    assert.match(body.error, /not verified|not configured|RAZORPAY_DEV_BYPASS/i);
    assert.equal(dbStub.state.status, 'pending');
  } finally {
    await app.close();
    dbStub.restore();
    envs.restore();
  }
});

test('unset keys with RAZORPAY_DEV_BYPASS=true outside production: falls through and completes the order', async () => {
  const envs = withEnv({ RAZORPAY_KEY_ID: '', RAZORPAY_KEY_SECRET: '', RAZORPAY_DEV_BYPASS: 'true', NODE_ENV: 'development' });
  const dbStub = stubDb(baseOrder());
  const app = await startApp();
  try {
    const res = await fetch(`${app.baseUrl}/api/orders/ORD-VERIFYTEST/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: 'order_live_abc',
        razorpay_payment_id: 'dev_12345',
        razorpay_signature: '',
      }),
    });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.ok, true);
    assert.equal(dbStub.state.status, 'completed');
  } finally {
    await app.close();
    dbStub.restore();
    envs.restore();
  }
});

test('unset keys with RAZORPAY_DEV_BYPASS=true but NODE_ENV=production: still refuses', async () => {
  const envs = withEnv({ RAZORPAY_KEY_ID: '', RAZORPAY_KEY_SECRET: '', RAZORPAY_DEV_BYPASS: 'true', NODE_ENV: 'production' });
  const dbStub = stubDb(baseOrder());
  const app = await startApp();
  try {
    assert.equal(payments.devBypassEnabled(), false, 'sanity check: bypass must read as disabled in production');
    const res = await fetch(`${app.baseUrl}/api/orders/ORD-VERIFYTEST/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: 'order_live_abc',
        razorpay_payment_id: 'anything-i-want',
        razorpay_signature: '',
      }),
    });
    const body = await res.json();
    assert.equal(res.status, 503);
    assert.match(body.error, /not verified|not configured|RAZORPAY_DEV_BYPASS/i);
    assert.equal(dbStub.state.status, 'pending');
  } finally {
    await app.close();
    dbStub.restore();
    envs.restore();
  }
});

test('an already-completed order short-circuits before any signature or bypass check', async () => {
  const envs = withEnv({ RAZORPAY_KEY_ID: '', RAZORPAY_KEY_SECRET: '', RAZORPAY_DEV_BYPASS: undefined, NODE_ENV: 'development' });
  const dbStub = stubDb(baseOrder({ status: 'completed' }));
  const app = await startApp();
  try {
    const res = await fetch(`${app.baseUrl}/api/orders/ORD-VERIFYTEST/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.status, 'completed');
  } finally {
    await app.close();
    dbStub.restore();
    envs.restore();
  }
});
