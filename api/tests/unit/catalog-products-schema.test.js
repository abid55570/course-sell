const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
const SKIP = !TEST_DATABASE_URL;
const skipReason = 'TEST_DATABASE_URL/DATABASE_URL not set; skipping pg-backed tests';

// node:test skips whenever the `skip` option is PRESENT, empty string included,
// so the options object has to be omitted entirely when we mean to run. Passing
// `{ skip: '' }` silently skipped all five of these while still reporting
// green. Same form tests/e2e/api.test.js uses.
const opts = SKIP ? { skip: skipReason } : {};

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

test('011: catalog_products exists with the expected columns', opts, async () => {
  await withSchema(async (c) => {
    const r = await c.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'catalog_products' AND table_schema = current_schema()`
    );
    const cols = r.rows.map((x) => x.column_name).sort();
    for (const expected of [
      'accent_hex', 'accent_name', 'anchor_price', 'available_today', 'category_label',
      'category_slug', 'content', 'created_at', 'featured', 'id', 'is_published', 'kind',
      'pair_slug', 'price', 'set_slug', 'short_title', 'slug', 'tagline', 'tags', 'title',
      'updated_at',
    ]) {
      assert.ok(cols.includes(expected), `missing column ${expected}`);
    }
  });
});

test('011: kind is constrained to product or bundle', opts, async () => {
  await withSchema(async (c) => {
    await c.query(
      `INSERT INTO catalog_products (slug, kind, title, tagline, price)
       VALUES ('a', 'product', 'A', 't', 499)`
    );
    await assert.rejects(
      () => c.query(
        `INSERT INTO catalog_products (slug, kind, title, tagline, price)
         VALUES ('b', 'nonsense', 'B', 't', 499)`
      ),
      /violates check constraint/
    );
  });
});

test('011: slug is unique', opts, async () => {
  await withSchema(async (c) => {
    await c.query(
      `INSERT INTO catalog_products (slug, title, tagline, price)
       VALUES ('dup', 'A', 't', 499)`
    );
    await assert.rejects(
      () => c.query(
        `INSERT INTO catalog_products (slug, title, tagline, price)
         VALUES ('dup', 'B', 't', 499)`
      ),
      /duplicate key value/
    );
  });
});

test('011: content defaults to an empty object, never null', opts, async () => {
  await withSchema(async (c) => {
    await c.query(
      `INSERT INTO catalog_products (slug, title, tagline, price)
       VALUES ('defaults', 'D', 't', 499)`
    );
    const r = await c.query(
      `SELECT content, tags, is_published, featured, available_today, kind
         FROM catalog_products WHERE slug = 'defaults'`
    );
    assert.deepEqual(r.rows[0].content, {});
    assert.deepEqual(r.rows[0].tags, []);
    assert.equal(r.rows[0].is_published, true);
    assert.equal(r.rows[0].featured, false);
    assert.equal(r.rows[0].available_today, true);
    assert.equal(r.rows[0].kind, 'product');
  });
});

test('011: an order must reference exactly one product', opts, async () => {
  await withSchema(async (c) => {
    const cat = await c.query(
      `INSERT INTO catalog_products (slug, title, tagline, price)
       VALUES ('glow-up-os', 'Glow-Up OS', 't', 499) RETURNING id`
    );
    const course = await c.query(
      `INSERT INTO courses (slug, title, original_price, discounted_price)
       VALUES ('legacy', 'Legacy', 999, 999) RETURNING id`
    );

    // Exactly one reference -> accepted.
    await c.query(
      `INSERT INTO orders (order_id, catalog_product_id, buyer_name, buyer_email, amount)
       VALUES ('ORD-1', $1, 'A', 'a@example.com', 499)`,
      [cat.rows[0].id]
    );

    // Two references -> rejected.
    await assert.rejects(
      () => c.query(
        `INSERT INTO orders (order_id, catalog_product_id, course_id, buyer_name, buyer_email, amount)
         VALUES ('ORD-2', $1, $2, 'A', 'a@example.com', 499)`,
        [cat.rows[0].id, course.rows[0].id]
      ),
      /orders_product_ref_chk/
    );

    // No reference at all -> rejected.
    await assert.rejects(
      () => c.query(
        `INSERT INTO orders (order_id, buyer_name, buyer_email, amount)
         VALUES ('ORD-3', 'A', 'a@example.com', 499)`
      ),
      /orders_product_ref_chk/
    );
  });
});
