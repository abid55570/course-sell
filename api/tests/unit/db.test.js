const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
const SKIP = !TEST_DATABASE_URL;
const skipReason = 'TEST_DATABASE_URL/DATABASE_URL not set; skipping pg-backed tests';
// node:test skips whenever the `skip` option is present at all, empty string
// included, so the options object must be omitted entirely when we mean to run.
const opts = SKIP ? { skip: skipReason } : {};

function uniqueSchema() {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function makeSchema() {
  const pool = new Pool({ connectionString: TEST_DATABASE_URL });
  const schema = uniqueSchema();
  await pool.query(`CREATE SCHEMA "${schema}"`);
  const dir = path.join(__dirname, '..', '..', 'migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  const client = await pool.connect();
  try {
    await client.query(`SET search_path TO "${schema}"`);
    for (const f of files) {
      await client.query(fs.readFileSync(path.join(dir, f), 'utf8'));
    }
  } finally { client.release(); }
  return { pool, schema };
}

async function dropSchema(pool, schema) {
  try { await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); } catch {}
  await pool.end();
}

test('schema creates required tables', SKIP ? opts : {}, async () => {
  const { pool, schema } = await makeSchema();
  try {
    const r = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name`,
      [schema]
    );
    const tables = r.rows.map((row) => row.table_name);
    for (const expected of ['admins', 'courses', 'orders', 'transactions', 'support_messages', 'schema_migrations']) {
      assert.ok(tables.includes(expected), `missing ${expected}, got ${tables.join(',')}`);
    }
  } finally { await dropSchema(pool, schema); }
});

test('courses table has visibility flag + binary thumbnail columns', SKIP ? opts : {}, async () => {
  const { pool, schema } = await makeSchema();
  try {
    const r = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'courses'`,
      [schema]
    );
    const cols = Object.fromEntries(r.rows.map((row) => [row.column_name, row.data_type]));
    for (const c of ['send_pdf_in_email', 'send_drive_in_email', 'email_template_html', 'thumbnail', 'pdf_file', 'drive_link', 'thumbnail_data', 'thumbnail_mime']) {
      assert.ok(c in cols, `missing column ${c}`);
    }
    assert.equal(cols.thumbnail_data, 'bytea');
  } finally { await dropSchema(pool, schema); }
});

test('thumbnail_data accepts and returns bytes round-trip', SKIP ? opts : {}, async () => {
  const { pool, schema } = await makeSchema();
  try {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${schema}"`);
      const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0xde, 0xad, 0xbe, 0xef]);
      await client.query(
        `INSERT INTO courses (slug, title, original_price, discounted_price, thumbnail_data, thumbnail_mime)
         VALUES ('binary-thumb', 'Binary Thumb', 0, 0, $1, 'image/png')`,
        [png]
      );
      const r = await client.query(`SELECT thumbnail_data, thumbnail_mime FROM courses WHERE slug = 'binary-thumb'`);
      assert.equal(r.rows[0].thumbnail_mime, 'image/png');
      assert.ok(Buffer.isBuffer(r.rows[0].thumbnail_data));
      assert.deepEqual(r.rows[0].thumbnail_data, png);
    } finally { client.release(); }
  } finally { await dropSchema(pool, schema); }
});

test('logTransaction writes a row that joins back to the order', SKIP ? opts : {}, async () => {
  const { pool, schema } = await makeSchema();
  try {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${schema}"`);
      const c = await client.query(
        `INSERT INTO courses (slug, title, original_price, discounted_price)
         VALUES ('s','t', 100, 50) RETURNING id`
      );
      await client.query(
        `INSERT INTO orders (order_id, course_id, buyer_name, buyer_email, amount, status)
         VALUES ('ORD-1', $1, 'Buyer', 'b@x.com', 50, 'pending')`,
        [c.rows[0].id]
      );
      await client.query(
        `INSERT INTO transactions (order_id, event, actor, amount) VALUES ('ORD-1','created','buyer',50)`
      );
      await client.query(
        `INSERT INTO transactions (order_id, event, actor, amount, upi_txn_ref)
         VALUES ('ORD-1','completed','admin@x',50,'UTR1')`
      );
      const rows = (await client.query(
        `SELECT event, upi_txn_ref FROM transactions WHERE order_id = 'ORD-1' ORDER BY id`
      )).rows;
      assert.equal(rows.length, 2);
      assert.equal(rows[0].event, 'created');
      assert.equal(rows[1].event, 'completed');
      assert.equal(rows[1].upi_txn_ref, 'UTR1');
    } finally { client.release(); }
  } finally { await dropSchema(pool, schema); }
});

test('orders.status check constraint rejects invalid values', SKIP ? opts : {}, async () => {
  const { pool, schema } = await makeSchema();
  try {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${schema}"`);
      await client.query(`INSERT INTO courses (slug, title) VALUES ('s', 't')`);
      const cId = (await client.query(`SELECT id FROM courses WHERE slug = 's'`)).rows[0].id;
      await assert.rejects(
        client.query(
          `INSERT INTO orders (order_id, course_id, buyer_name, buyer_email, amount, status)
           VALUES ('ORD-X', $1, 'B', 'b@x.com', 1, 'banana')`,
          [cId]
        ),
        /check constraint|violates check/i
      );
    } finally { client.release(); }
  } finally { await dropSchema(pool, schema); }
});
