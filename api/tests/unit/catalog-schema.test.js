const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
const SKIP = !TEST_DATABASE_URL;
const skipReason = SKIP ? 'TEST_DATABASE_URL/DATABASE_URL not set; skipping pg-backed tests' : '';

async function withSchema(fn) {
  const pool = new Pool({ connectionString: TEST_DATABASE_URL });
  const schema = `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await pool.query(`CREATE SCHEMA "${schema}"`);
  const client = await pool.connect();
  try {
    await client.query(`SET search_path TO "${schema}"`);
    const dir = path.join(__dirname, '..', '..', 'migrations');
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
      await client.query(fs.readFileSync(path.join(dir, f), 'utf8'));
    }
    await fn(client);
  } finally {
    client.release();
    await pool.query(`DROP SCHEMA "${schema}" CASCADE`);
    await pool.end();
  }
}

test('010: courses gains the store catalog columns', { skip: skipReason }, async () => {
  await withSchema(async (c) => {
    const r = await c.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'courses' AND table_schema = current_schema()`
    );
    const cols = r.rows.map((x) => x.column_name);
    for (const col of ['board', 'class_level', 'subject', 'exam_date', 'page_count', 'sample_pdf', 'language_mix', 'accent_color']) {
      assert.ok(cols.includes(col), `missing column ${col}`);
    }
  });
});

test('010: chapters cascade-delete with their course', { skip: skipReason }, async () => {
  await withSchema(async (c) => {
    const ins = await c.query(
      `INSERT INTO courses (slug, title, original_price, discounted_price, kind)
       VALUES ('t-sci', 'Test Science', 99, 49, 'ebook') RETURNING id`
    );
    const id = ins.rows[0].id;
    await c.query(`INSERT INTO course_chapters (course_id, position, title) VALUES ($1, 1, 'Light')`, [id]);
    await c.query(`DELETE FROM courses WHERE id = $1`, [id]);
    const left = await c.query(`SELECT COUNT(*)::int AS n FROM course_chapters WHERE course_id = $1`, [id]);
    assert.equal(left.rows[0].n, 0);
  });
});

test('010: leads accepts a row with only whatsapp', { skip: skipReason }, async () => {
  await withSchema(async (c) => {
    await c.query(`INSERT INTO leads (whatsapp, source) VALUES ('+919000000000', 'reel')`);
    const r = await c.query(`SELECT COUNT(*)::int AS n FROM leads`);
    assert.equal(r.rows[0].n, 1);
  });
});
