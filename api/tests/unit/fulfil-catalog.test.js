const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../../utils/db');
const email = require('../../utils/email');
const { markOrderPaid } = require('../../services/fulfillment');

/**
 * A storefront catalog order carries `catalog_product_id`, not `course_id`.
 * Before the catalog branch existed, markOrderPaid fell through to
 * fulfilCourse, which looks up `courses` by a null id, found nothing, and
 * returned silently — so a buyer who had just paid got no email at all.
 *
 * db and utils/email are plain CommonJS singletons read off the module at call
 * time, so assigning over their methods is enough to exercise this with no
 * database and no SMTP, the same approach tests/unit/resolve-product.test.js
 * uses for db.get.
 */
function stub({ order, item }) {
  const original = { get: db.get, run: db.run, log: db.logTransaction, send: email.sendOrderCompletedEmail };
  const sent = [];

  db.get = async (sql) => {
    if (/FROM orders/.test(sql)) return order;
    if (/FROM catalog_products/.test(sql)) return item;
    if (/FROM courses/.test(sql)) return null;
    return null;
  };
  // rowCount matters: markOrderPaid claims the order with a conditional
  // UPDATE and only fulfils when exactly one row changed.
  db.run = async () => ({ rowCount: 1, rows: [] });
  db.logTransaction = async () => {};
  email.sendOrderCompletedEmail = async (o, c) => { sent.push({ order: o, course: c }); };

  return {
    sent,
    restore() {
      db.get = original.get;
      db.run = original.run;
      db.logTransaction = original.log;
      email.sendOrderCompletedEmail = original.send;
    },
  };
}

const CATALOG_ORDER = {
  order_id: 'ORD-CAT1',
  product_type: 'catalog',
  status: 'pending',
  course_id: null,
  video_project_id: null,
  catalog_product_id: 7,
  buyer_name: 'A',
  buyer_email: 'a@example.com',
  amount: '499.00',
};

test('markOrderPaid: a catalog order sends the delivery email', async () => {
  const s = stub({ order: CATALOG_ORDER, item: { slug: 'glow-up-os', title: 'Glow-Up OS' } });
  try {
    const r = await markOrderPaid('ORD-CAT1', { paymentId: 'pay_1' });
    assert.equal(r.ok, true);
    assert.equal(r.productType, 'catalog');
    assert.equal(s.sent.length, 1, 'a paying buyer must get exactly one email');
    assert.equal(s.sent[0].course.title, 'Glow-Up OS');
    assert.equal(s.sent[0].order.status, 'completed');
  } finally { s.restore(); }
});

test('markOrderPaid: a catalog order with no file claims no download', async () => {
  // The delivery template reads these flags to decide between linking a file
  // and telling the buyer honestly that the download is not ready. A row with
  // nothing attached must take the honest branch.
  const s = stub({
    order: CATALOG_ORDER,
    item: {
      slug: 'glow-up-os', title: 'Glow-Up OS',
      pdf_file: null, drive_link: null,
      send_pdf_in_email: false, send_drive_in_email: false,
    },
  });
  try {
    await markOrderPaid('ORD-CAT1', {});
    const { course } = s.sent[0];
    assert.equal(course.send_pdf_in_email, false);
    assert.equal(course.send_drive_in_email, false);
    assert.equal(course.pdf_file, null);
    assert.equal(course.drive_link, null);
  } finally { s.restore(); }
});

test('markOrderPaid: a catalog order WITH a file passes it through to delivery', async () => {
  // Migration 012 gave catalog_products its own delivery fields. Before that a
  // paid catalog order could never be delivered automatically, whatever an
  // admin uploaded, because there was nowhere to record the file.
  const s = stub({
    order: CATALOG_ORDER,
    item: {
      slug: 'glow-up-os', title: 'Glow-Up OS',
      pdf_file: '/uploads/pdfs/glow-up-os.pdf', drive_link: null,
      send_pdf_in_email: true, send_drive_in_email: false,
    },
  });
  try {
    await markOrderPaid('ORD-CAT1', {});
    const { course } = s.sent[0];
    assert.equal(course.pdf_file, '/uploads/pdfs/glow-up-os.pdf');
    assert.equal(course.send_pdf_in_email, true);
  } finally { s.restore(); }
});

test('markOrderPaid: a catalog order with a Drive link passes that through too', async () => {
  const s = stub({
    order: CATALOG_ORDER,
    item: {
      slug: 'glow-up-os', title: 'Glow-Up OS',
      pdf_file: null, drive_link: 'https://drive.google.com/xyz',
      send_pdf_in_email: false, send_drive_in_email: true,
    },
  });
  try {
    await markOrderPaid('ORD-CAT1', {});
    const { course } = s.sent[0];
    assert.equal(course.drive_link, 'https://drive.google.com/xyz');
    assert.equal(course.send_drive_in_email, true);
  } finally { s.restore(); }
});

test('markOrderPaid: a catalog order whose product row vanished sends nothing', async () => {
  const s = stub({ order: CATALOG_ORDER, item: null });
  try {
    const r = await markOrderPaid('ORD-CAT1', {});
    assert.equal(r.ok, true);
    assert.equal(s.sent.length, 0);
  } finally { s.restore(); }
});

test('markOrderPaid: an already-completed catalog order is a no-op', async () => {
  const s = stub({
    order: { ...CATALOG_ORDER, status: 'completed' },
    item: { slug: 'glow-up-os', title: 'Glow-Up OS' },
  });
  try {
    const r = await markOrderPaid('ORD-CAT1', {});
    assert.equal(r.alreadyDone, true);
    assert.equal(s.sent.length, 0, 'idempotency: no second email');
  } finally { s.restore(); }
});

test('markOrderPaid fulfils once when two callers race the same order', async () => {
  // The browser's verify call and the Razorpay webhook both land here for the
  // same order — that is the normal case, not a rare race. Both used to pass
  // the status check and both then sent the delivery email.
  const original = { get: db.get, run: db.run, log: db.logTransaction, send: email.sendOrderCompletedEmail };
  const sent = [];
  let claims = 0;

  db.get = async (sql) => {
    if (/FROM orders/.test(sql)) return { ...CATALOG_ORDER };
    if (/FROM catalog_products/.test(sql)) return { slug: 'glow-up-os', title: 'Glow-Up OS' };
    return null;
  };
  // Only the first conditional UPDATE can match a row; the second sees the
  // order already completed, exactly as Postgres would.
  db.run = async (sql) => {
    if (/UPDATE\s+orders\s+SET\s+status/i.test(sql)) {
      claims += 1;
      return { rowCount: claims === 1 ? 1 : 0, rows: [] };
    }
    return { rowCount: 1, rows: [] };
  };
  db.logTransaction = async () => {};
  email.sendOrderCompletedEmail = async (o, c) => { sent.push({ order: o, course: c }); };

  try {
    const [a, b] = await Promise.all([
      markOrderPaid('ORD-CAT1', { actor: 'razorpay-checkout' }),
      markOrderPaid('ORD-CAT1', { actor: 'razorpay-webhook' }),
    ]);
    assert.equal(a.ok, true);
    assert.equal(b.ok, true);
    assert.equal(sent.length, 1, 'the buyer must receive exactly one delivery email');
    assert.equal(claims, 2, 'both callers should have attempted the claim');
    assert.ok(a.alreadyDone || b.alreadyDone, 'the loser should report alreadyDone');
  } finally {
    db.get = original.get;
    db.run = original.run;
    db.logTransaction = original.log;
    email.sendOrderCompletedEmail = original.send;
  }
});
