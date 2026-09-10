const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../../utils/db');
const email = require('../../utils/email');
const { markOrderPaid } = require('../../services/fulfillment');
const { deliverOrderEmail, retryOrderEmail, processDueEmails, validDriveLink } = require('../../services/email-delivery');

function setup(t, options = {}) {
  const state = {
    order: { order_id: 'ORD-TEST', status: 'pending', product_type: 'catalog', catalog_product_id: 7,
      buyer_email: 'buyer@example.com', buyer_name: 'Buyer', amount: 499, ...options.order },
    product: { title: 'Repair course', drive_link: 'https://drive.google.com/drive/folders/demo', send_drive_in_email: true, ...options.product },
    job: options.job ? { attempts: 0, due: true, ...options.job } : null, calls: 0,
  };
  const originals = { get: db.get, run: db.run, all: db.all, logTransaction: db.logTransaction };
  const originalSend = email.sendOrderCompletedEmail;
  t.after(() => { Object.assign(db, originals); email.sendOrderCompletedEmail = originalSend; });
  db.get = async (sql) => /FROM orders/.test(sql) ? { ...state.order } : state.product;
  db.logTransaction = async () => {};
  db.all = async () => state.job && state.job.due && state.order.status === 'completed' ? [{ order_id: 'ORD-TEST' }] : [];
  db.run = async (sql, args) => {
    if (sql.includes('WITH paid AS')) {
      assert.match(sql, /INSERT INTO order_email_deliveries/); // same atomic SQL statement
      if (!['pending', 'submitted'].includes(state.order.status)) return { rowCount: 0, rows: [] };
      state.order.status = 'completed';
      state.job ||= { status: 'pending', attempts: 0, due: true };
      return { rowCount: 1, rows: [{ ...state.order }] };
    }
    if (sql.includes("SET status='sending'")) {
      if (state.order.status !== 'completed' || !state.job || !state.job.due || state.job.status === 'delivered' || (state.job.status === 'sending' && !state.job.expired)) return { rowCount: 0, rows: [] };
      Object.assign(state.job, { status: 'sending', attempts: state.job.attempts + 1, claim_token: args[1], due: false });
      return { rowCount: 1, rows: [{ ...state.job }] };
    }
    if (sql.includes("SET status='delivered'")) {
      assert.equal(state.calls, 1, 'must not mark delivery before sending');
      Object.assign(state.job, { status: 'delivered', due: false });
      return { rowCount: 1, rows: [] };
    }
    if (sql.includes("SET status='failed'")) {
      Object.assign(state.job, { status: 'failed', due: state.job.attempts < args[3], error: args[2] });
      return { rowCount: 1, rows: [] };
    }
    if (sql.includes('INSERT INTO order_email_deliveries')) {
      if (state.order.status !== 'completed' || ['sending','delivered'].includes(state.job?.status)) return { rowCount: 0, rows: [] };
      state.job = { status: 'pending', attempts: 0, due: true };
      return { rowCount: 1, rows: [{ order_id: 'ORD-TEST' }] };
    }
    throw new Error('Unexpected SQL: ' + sql);
  };
  email.sendOrderCompletedEmail = async (order, product) => {
    state.calls++;
    assert.equal(state.job.status, 'sending');
    assert.equal(state.order.status, 'completed');
    assert.equal(product.drive_link, state.product.drive_link);
    if (options.send) return options.send(state);
    return { accepted: ['buyer@example.com'], rejected: [], messageId: 'test-only' };
  };
  return state;
}

test('paid catalog order becomes delivered only after SMTP accepts buyer', async t => {
  const s = setup(t); await markOrderPaid('ORD-TEST');
  assert.equal(s.order.status, 'completed'); assert.equal(s.job.status, 'delivered');
  await markOrderPaid('ORD-TEST'); assert.equal(s.calls, 1);
});
test('paid legacy course uses the same tracked Drive delivery', async t => {
  const s = setup(t, { order: { product_type: 'course', course_id: 1 } });
  await markOrderPaid('ORD-TEST'); assert.equal(s.job.status, 'delivered');
});
test('SMTP failure keeps payment paid and permits background retry', async t => {
  const s = setup(t, { send: () => { throw new Error('SMTP temporary error'); } });
  await markOrderPaid('ORD-TEST'); assert.equal(s.order.status, 'completed'); assert.equal(s.job.status, 'failed');
  s.calls = 0;
  email.sendOrderCompletedEmail = async () => { s.calls++; return { accepted: ['buyer@example.com'] }; };
  await processDueEmails(); assert.equal(s.job.status, 'delivered');
});
for (const result of [{ skipped: true }, { accepted: [], rejected: ['buyer@example.com'] }, { accepted: ['other@example.com'] }, undefined]) {
  test('skipped/rejected/unconfirmed send never marks delivery: ' + JSON.stringify(result), async t => {
    const s = setup(t, { send: () => result }); await markOrderPaid('ORD-TEST'); assert.equal(s.job.status, 'failed');
  });
}
for (const product of [{ drive_link: null }, { send_drive_in_email: false }, { drive_link: 'https://evil.example/book' }]) {
  test('missing/disabled/non-Drive resource does not send a false delivery email: ' + JSON.stringify(product), async t => {
    const s = setup(t, { product }); await markOrderPaid('ORD-TEST'); assert.equal(s.calls, 0); assert.equal(s.job.status, 'failed');
  });
}
test('concurrent payment confirmations send once', async t => {
  const s = setup(t); await Promise.all([markOrderPaid('ORD-TEST'), markOrderPaid('ORD-TEST')]); assert.equal(s.calls, 1);
});
test('concurrent workers claim a queued email only once', async t => {
  const s = setup(t, { order: { status: 'completed' }, job: { status: 'pending' } });
  await Promise.all([deliverOrderEmail('ORD-TEST'), deliverOrderEmail('ORD-TEST')]); assert.equal(s.calls, 1);
});
test('a process crash leaves a recoverable expired sending lease', async t => {
  const s = setup(t, { order: { status: 'completed' }, job: { status: 'sending', expired: true } });
  await deliverOrderEmail('ORD-TEST'); assert.equal(s.job.status, 'delivered');
});
test('retry exhaustion stops automatic attempts and admin retry reopens failed work', async t => {
  const s = setup(t, { order: { status: 'completed' }, job: { status: 'failed', attempts: 7 }, send: () => { throw new Error('failed'); } });
  await deliverOrderEmail('ORD-TEST'); assert.equal(s.job.due, false); assert.equal(s.job.attempts, 8);
  await retryOrderEmail('ORD-TEST'); assert.equal(s.job.attempts, 1);
});
test('historical completed orders are not automatically emailed', async t => {
  const s = setup(t, { order: { status: 'completed' } }); await markOrderPaid('ORD-TEST'); assert.equal(s.calls, 0);
  await retryOrderEmail('ORD-TEST'); assert.equal(s.calls, 1);
});
test('unpaid and cancelled orders cannot trigger email retries', async t => {
  const s = setup(t); assert.equal((await retryOrderEmail('ORD-TEST')).ok, false);
  s.order.status = 'cancelled'; assert.equal((await markOrderPaid('ORD-TEST')).ok, false); assert.equal(s.calls, 0);
});
test('successful delivery cannot be resent through retry endpoint', async t => {
  const s = setup(t); await markOrderPaid('ORD-TEST'); assert.equal((await retryOrderEmail('ORD-TEST')).ok, false); assert.equal(s.calls, 1);
});
test('Drive URL validation rejects lookalike and insecure URLs', () => {
  for (const value of ['http://drive.google.com/x', 'https://drive.google.com.evil.test/x', 'https://drive.google.com/', 'javascript:alert(1)', 'https://user:password@drive.google.com/x']) assert.equal(validDriveLink(value), false);
  assert.equal(validDriveLink('https://drive.google.com/file/d/abc/view'), true);
});
