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

test('buyer can place a course order and get a Razorpay order (dev-bypass)', SKIP ? { skip: skipReason } : {}, async () => {
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
  assert.equal(r.data.product.type, 'course');
  // No Razorpay keys in the test env -> dev-bypass order.
  assert.equal(r.data.razorpay.configured, false);
  assert.match(r.data.razorpay.order_id, /^order_dev_/);
  globalThis.__lastOrderId = r.data.order_id;
});

test('order details hide drive_link until paid', SKIP ? { skip: skipReason } : {}, async () => {
  const orderId = globalThis.__lastOrderId;
  const cookieBefore = cookieJar; cookieJar = '';
  const r = await http('GET', `/api/orders/${orderId}`);
  cookieJar = cookieBefore;
  assert.equal(r.status, 200);
  assert.equal(r.data.status, 'pending');
  assert.equal(r.data.drive_link, null);
});

test('verifying payment (dev-bypass) completes the order', SKIP ? { skip: skipReason } : {}, async () => {
  const orderId = globalThis.__lastOrderId;
  const cookieBefore = cookieJar; cookieJar = '';
  const r = await http('POST', `/api/orders/${orderId}/verify`, {
    body: { razorpay_order_id: `order_dev_${orderId}`, razorpay_payment_id: 'pay_dev', razorpay_signature: 'dev' },
  });
  cookieJar = cookieBefore;
  assert.equal(r.status, 200);
  assert.equal(r.data.status, 'completed');
});

test('admin sees the completed order in the list', SKIP ? { skip: skipReason } : {}, async () => {
  const r = await http('GET', '/api/admin/orders');
  assert.equal(r.status, 200);
  const found = r.data.find((o) => o.order_id === globalThis.__lastOrderId);
  assert.ok(found);
  assert.equal(found.status, 'completed');
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

test('verify is idempotent (second call still completed)', SKIP ? { skip: skipReason } : {}, async () => {
  const orderId = globalThis.__lastOrderId;
  const cookieBefore = cookieJar; cookieJar = '';
  const r = await http('POST', `/api/orders/${orderId}/verify`, { body: {} });
  cookieJar = cookieBefore;
  assert.equal(r.status, 200);
  assert.equal(r.data.status, 'completed');
});

test('transactions audit log contains created + completed', SKIP ? { skip: skipReason } : {}, async () => {
  const orderId = globalThis.__lastOrderId;
  const r = await http('GET', `/api/admin/orders/${orderId}/transactions`);
  assert.equal(r.status, 200);
  const events = r.data.map((t) => t.event);
  assert.ok(events.includes('created'));
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test('video generator: template -> project -> gated download -> pay -> render -> download', SKIP ? { skip: skipReason } : {}, async () => {
  // Admin creates a category + a fast (6s) template.
  const cat = await http('POST', '/api/admin/video/categories', { body: { name: 'E2E Fest', slug: 'e2e-fest' } });
  assert.equal(cat.status, 200);
  const tpl = await http('POST', '/api/admin/video/templates', {
    body: {
      name: 'E2E Greeting', slug: 'e2e-greet', composition_id: 'greeting',
      category_id: cat.data.id, duration_seconds: 6,
      fields_schema: [
        { key: 'greeting_from', label: 'From', type: 'text', required: true },
        { key: 'message', label: 'Message', type: 'textarea' },
      ],
      preset: { palette: 'midnight', heading: 'Happy Test' },
      original_price: 499, discounted_price: 399,
    },
  });
  assert.equal(tpl.status, 200);

  // Public: create a project (customization) on the Basic plan (fast 15s render).
  const cookieBefore = cookieJar; cookieJar = '';
  const proj = await http('POST', '/api/video/projects', {
    body: { template_slug: 'e2e-greet', plan: 'basic', form_data: { greeting_from: 'The E2E Team', message: 'Hello there' } },
  });
  assert.equal(proj.status, 200);
  assert.equal(proj.data.plan, 'basic');
  const pid = proj.data.public_id;

  // Missing required field is rejected.
  const bad = await http('POST', '/api/video/projects', { body: { template_slug: 'e2e-greet', form_data: {} } });
  assert.equal(bad.status, 400);
  assert.ok(bad.data.fields.greeting_from);

  // Photo-upload endpoint — on a separate throwaway project so the render flow
  // below stays photo-free and fast. (Photo-based rendering is verified with
  // realistic images outside the e2e suite; a 1x1 test pixel is degenerate.)
  const projB = await http('POST', '/api/video/projects', { body: { template_slug: 'e2e-greet', form_data: { greeting_from: 'PhotoTest' } } });
  const pfd = new FormData();
  pfd.set('photos', new Blob([TINY_PNG], { type: 'image/png' }), 'p.png');
  const upl = await fetch(`${baseUrl}/api/video/projects/${projB.data.public_id}/photos`, { method: 'POST', body: pfd });
  assert.equal(upl.status, 200);
  const uplData = await upl.json();
  assert.equal(uplData.photos.length, 1);

  // Download is gated before payment.
  const gated = await fetch(`${baseUrl}/api/video/projects/${pid}/download`);
  assert.equal(gated.status, 403);

  // Create order + verify (dev bypass) -> triggers render.
  const order = await http('POST', '/api/orders', {
    body: { video_project_id: pid, buyer_name: 'Vid Buyer', buyer_email: 'vid@e2e.com' },
  });
  assert.equal(order.status, 200);
  assert.equal(order.data.product.type, 'video');
  const verify = await http('POST', `/api/orders/${order.data.order_id}/verify`, {
    body: { razorpay_order_id: `order_dev_${order.data.order_id}`, razorpay_payment_id: 'pay_dev', razorpay_signature: 'dev' },
  });
  assert.equal(verify.status, 200);

  // Poll until the render completes. ffmpeg (HD + WhatsApp variant) can take a
  // while on a loaded machine, so allow a generous window.
  let ready = false;
  let last = null;
  for (let i = 0; i < 120 && !ready; i++) {
    const s = await http('GET', `/api/video/projects/${pid}/status`);
    last = s.data.render_status;
    if (s.data.render_status === 'failed') throw new Error(`render failed: ${s.data.error}`);
    ready = s.data.ready;
    if (!ready) await sleep(2000);
  }
  assert.ok(ready, `video render did not finish in time (last status: ${last})`);

  // Clean HD download now works and returns an mp4.
  const dl = await fetch(`${baseUrl}/api/video/projects/${pid}/download?variant=hd`);
  assert.equal(dl.status, 200);
  assert.match(dl.headers.get('content-type') || '', /video\/mp4/);
  const bytes = Buffer.from(await dl.arrayBuffer());
  assert.ok(bytes.length > 10000, 'downloaded video looks too small');
  cookieJar = cookieBefore;
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
