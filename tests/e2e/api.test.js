const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { Pool } = require('pg');

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
const SKIP = !TEST_DATABASE_URL;
const skipReason = SKIP ? 'TEST_DATABASE_URL/DATABASE_URL not set; skipping E2E tests' : '';

let serverProc, baseUrl, schemaName, adminPool;
let cookieJar = '';

function uniqueSchema() {
  return `e2e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function startServer() {
  return new Promise((resolve, reject) => {
    schemaName = uniqueSchema();
    const env = {
      ...process.env,
      DATABASE_URL: TEST_DATABASE_URL,
      PG_SCHEMA: schemaName,
      JWT_SECRET: 'test-secret-thats-long-enough-for-jwt-1234567890',
      ADMIN_EMAIL: 'admin@test.com',
      ADMIN_PASSWORD: 'TestPass123!',
      UPI_ID: 'merchant@test',
      UPI_PAYEE_NAME: 'Test Payee',
      SITE_NAME: 'Test Hub',
      SMTP_USER: '',
      SMTP_PASS: '',
      NODE_ENV: 'test',
    };
    serverProc = spawn(process.execPath, [path.join(__dirname, 'helpers', 'start-server.js')], {
      env, cwd: path.join(__dirname, '..', '..'), stdio: ['ignore', 'pipe', 'pipe'],
    });
    let buf = '';
    const onData = (chunk) => {
      buf += chunk.toString();
      const m = buf.match(/__PORT__=(\d+)/);
      if (m) {
        baseUrl = `http://127.0.0.1:${m[1]}`;
        serverProc.stdout.off('data', onData);
        resolve();
      }
    };
    serverProc.stdout.on('data', onData);
    serverProc.stderr.on('data', (c) => process.stderr.write(c));
    serverProc.on('error', reject);
    setTimeout(() => reject(new Error('server start timeout')), 20000);
  });
}

async function stopServer() {
  if (serverProc && !serverProc.killed) {
    serverProc.kill();
    await new Promise((r) => serverProc.once('exit', r));
  }
  if (adminPool) {
    try { await adminPool.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`); } catch {}
    await adminPool.end();
  }
}

async function http(method, url, { body, isForm } = {}) {
  const headers = {};
  if (cookieJar) headers.Cookie = cookieJar;
  let payload;
  if (body && isForm) payload = body;
  else if (body) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${baseUrl}${url}`, { method, headers, body: payload });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    const m = setCookie.match(/admin_token=([^;]+)/);
    if (m) cookieJar = `admin_token=${m[1]}`;
    if (/admin_token=;/.test(setCookie)) cookieJar = '';
  }
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  return { status: res.status, data };
}

test.before(async () => {
  if (SKIP) return;
  await startServer();
  const bcrypt = require('bcryptjs');
  adminPool = new Pool({ connectionString: TEST_DATABASE_URL });
  const client = await adminPool.connect();
  try {
    await client.query(`SET search_path TO "${schemaName}"`);
    await client.query(
      `INSERT INTO admins (email, password_hash, name) VALUES ($1, $2, $3)`,
      ['admin@test.com', bcrypt.hashSync('TestPass123!', 8), 'Admin']
    );
  } finally { client.release(); }
});

test.after(async () => {
  if (SKIP) return;
  await stopServer();
});

test('public site-info returns configured values', SKIP ? { skip: skipReason } : {}, async () => {
  const r = await http('GET', '/api/site-info');
  assert.equal(r.status, 200);
  assert.equal(r.data.site_name, 'Test Hub');
  assert.equal(r.data.upi_id, 'merchant@test');
});

test('admin login fails with wrong password', SKIP ? { skip: skipReason } : {}, async () => {
  const r = await http('POST', '/api/auth/login', { body: { email: 'admin@test.com', password: 'wrong' } });
  assert.equal(r.status, 401);
});

test('admin login succeeds and sets cookie', SKIP ? { skip: skipReason } : {}, async () => {
  const r = await http('POST', '/api/auth/login', { body: { email: 'admin@test.com', password: 'TestPass123!' } });
  assert.equal(r.status, 200);
  assert.ok(cookieJar.startsWith('admin_token='));
});

test('admin /me returns the logged in admin', SKIP ? { skip: skipReason } : {}, async () => {
  const r = await http('GET', '/api/auth/me');
  assert.equal(r.status, 200);
  assert.equal(r.data.admin.email, 'admin@test.com');
});

// 1x1 transparent PNG bytes
const TINY_PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da6300010000000500010d0a2db40000000049454e44ae426082',
  'hex'
);

test('admin can create a course with visibility flags + binary thumbnail', SKIP ? { skip: skipReason } : {}, async () => {
  const fd = new FormData();
  fd.set('title', 'E2E Test Course');
  fd.set('short_description', 'A test');
  fd.set('description', 'Full description');
  fd.set('original_price', '2000');
  fd.set('discounted_price', '500');
  fd.set('drive_link', 'https://drive.google.com/folder/e2e');
  fd.set('is_published', 'true');
  fd.set('send_pdf_in_email', 'false');
  fd.set('send_drive_in_email', 'true');
  fd.set('email_template_html', '<p>Hi {{buyer_name}} - {{course_title}}</p>{{resources_block}}');
  fd.set('thumbnail', new Blob([TINY_PNG], { type: 'image/png' }), 'thumb.png');
  const r = await http('POST', '/api/admin/courses', { body: fd, isForm: true });
  assert.equal(r.status, 200);
  assert.equal(r.data.title, 'E2E Test Course');
  assert.equal(r.data.send_pdf_in_email, false);
  assert.equal(r.data.send_drive_in_email, true);
  assert.match(r.data.email_template_html, /buyer_name/);
  assert.equal(r.data.has_thumbnail, true);
  assert.equal(r.data.thumbnail, '/api/courses/e2e-test-course/thumbnail');
});

test('thumbnail endpoint serves the stored bytes with the right Content-Type', SKIP ? { skip: skipReason } : {}, async () => {
  const res = await fetch(`${baseUrl}/api/courses/e2e-test-course/thumbnail`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'image/png');
  const buf = Buffer.from(await res.arrayBuffer());
  assert.deepEqual(buf, TINY_PNG);
});

test('thumbnail endpoint 404s for unknown slug', SKIP ? { skip: skipReason } : {}, async () => {
  const res = await fetch(`${baseUrl}/api/courses/nope-no-slug/thumbnail`);
  assert.equal(res.status, 404);
});

test('public list shows the course with discount %', SKIP ? { skip: skipReason } : {}, async () => {
  const r = await http('GET', '/api/courses');
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.data));
  const course = r.data.find((c) => c.title === 'E2E Test Course');
  assert.ok(course);
  assert.equal(course.discount_percent, 75);
});

test('buyer can place an order and get UPI QR + link', SKIP ? { skip: skipReason } : {}, async () => {
  const list = await http('GET', '/api/courses');
  const course = list.data.find((c) => c.title === 'E2E Test Course');
  const cookieBefore = cookieJar; cookieJar = '';
  const r = await http('POST', '/api/orders', {
    body: { course_id: course.id, buyer_name: 'E2E Buyer', buyer_email: 'buyer@e2e.com' },
  });
  cookieJar = cookieBefore;
  assert.equal(r.status, 200);
  assert.match(r.data.order_id, /^ORD-/);
  assert.equal(Number(r.data.amount), 500);
  assert.match(r.data.upi.link, /^upi:\/\/pay\?/);
  assert.ok(r.data.upi.qr.startsWith('data:image/png'));
  globalThis.__lastOrderId = r.data.order_id;
});

test('buyer can submit UPI transaction reference', SKIP ? { skip: skipReason } : {}, async () => {
  const orderId = globalThis.__lastOrderId;
  const cookieBefore = cookieJar; cookieJar = '';
  const r = await http('POST', `/api/orders/${orderId}/submit-txn`, { body: { upi_txn_ref: 'UTR12345' } });
  cookieJar = cookieBefore;
  assert.equal(r.status, 200);
});

test('order details hide drive_link until completed', SKIP ? { skip: skipReason } : {}, async () => {
  const orderId = globalThis.__lastOrderId;
  const cookieBefore = cookieJar; cookieJar = '';
  const r = await http('GET', `/api/orders/${orderId}`);
  cookieJar = cookieBefore;
  assert.equal(r.status, 200);
  assert.equal(r.data.status, 'submitted');
  assert.equal(r.data.drive_link, null);
});

test('admin sees the order in the list', SKIP ? { skip: skipReason } : {}, async () => {
  const r = await http('GET', '/api/admin/orders');
  assert.equal(r.status, 200);
  const found = r.data.find((o) => o.order_id === globalThis.__lastOrderId);
  assert.ok(found);
  assert.equal(found.status, 'submitted');
  assert.equal(found.upi_txn_ref, 'UTR12345');
});

test('admin confirms; email body contains drive but not pdf (visibility flags)', SKIP ? { skip: skipReason } : {}, async () => {
  const orderId = globalThis.__lastOrderId;
  const r = await http('POST', `/api/admin/orders/${orderId}/confirm`, { body: {} });
  assert.equal(r.status, 200);
  assert.ok(r.data.email);
  assert.equal(r.data.email.skipped, true);
  assert.match(r.data.email.html, /E2E Buyer/);
  assert.match(r.data.email.html, /Google Drive/);
  assert.doesNotMatch(r.data.email.html, /Download PDF/);
});

test('completed order exposes drive_link to public endpoint', SKIP ? { skip: skipReason } : {}, async () => {
  const orderId = globalThis.__lastOrderId;
  const cookieBefore = cookieJar; cookieJar = '';
  const r = await http('GET', `/api/orders/${orderId}`);
  cookieJar = cookieBefore;
  assert.equal(r.status, 200);
  assert.equal(r.data.status, 'completed');
  assert.equal(r.data.drive_link, 'https://drive.google.com/folder/e2e');
});

test('transactions audit log contains created/submitted/completed', SKIP ? { skip: skipReason } : {}, async () => {
  const orderId = globalThis.__lastOrderId;
  const r = await http('GET', `/api/admin/orders/${orderId}/transactions`);
  assert.equal(r.status, 200);
  const events = r.data.map((t) => t.event);
  assert.ok(events.includes('created'));
  assert.ok(events.includes('submitted'));
  assert.ok(events.includes('completed'));
});

test('PDF download is forbidden when send_pdf_in_email is off', SKIP ? { skip: skipReason } : {}, async () => {
  const orderId = globalThis.__lastOrderId;
  const cookieBefore = cookieJar; cookieJar = '';
  const r = await http('GET', `/api/orders/${orderId}/pdf`);
  cookieJar = cookieBefore;
  assert.equal(r.status, 403);
});

test('admin stats reflect completed-order revenue', SKIP ? { skip: skipReason } : {}, async () => {
  const r = await http('GET', '/api/admin/stats');
  assert.equal(r.status, 200);
  assert.equal(r.data.completed_orders, 1);
  assert.equal(Number(r.data.revenue), 500);
});

test('public support route is removed', SKIP ? { skip: skipReason } : {}, async () => {
  const r = await http('POST', '/api/support', { body: { name: 'x', email: 'x@x.com', message: 'y' } });
  assert.equal(r.status, 404);
});

test('logout clears the cookie', SKIP ? { skip: skipReason } : {}, async () => {
  const r = await http('POST', '/api/auth/logout', { body: {} });
  assert.equal(r.status, 200);
  assert.equal(cookieJar, '');
});
