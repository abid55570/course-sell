const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../../utils/db');
const { upsertCourse, upsertBundle } = require('../../scripts/seed-catalog');

/**
 * Regression coverage for the seed script clobbering admin edits. Before
 * this fix, upsertCourse/upsertBundle re-ran an UPDATE on every reseed that
 * unconditionally reset original_price, discounted_price and is_published —
 * the exact three fields routes/admin.js's PUT /courses/:id lets an admin
 * change. A `npm run seed:catalog` after an admin applied a discount or
 * pulled a product from sale would silently undo both.
 *
 * This is a manual upsert (SELECT by slug, then UPDATE or INSERT) — not a
 * real `INSERT ... ON CONFLICT`, since there is no unique constraint driving
 * it; these tests exercise it directly against a stubbed db (same technique
 * as tests/unit/resolve-product.test.js), no Postgres involved.
 */

function stubDb({ existing }) {
  const originals = { get: db.get, run: db.run };
  const runCalls = [];
  db.get = async (sql, params) => {
    assert.match(sql, /FROM courses WHERE slug = \$1/);
    if (!existing) return null;
    return params[0] === existing.slug ? existing : null;
  };
  db.run = async (sql, params) => {
    runCalls.push({ sql, params });
    return { rowCount: 1, rows: [] };
  };
  return {
    runCalls,
    restore: () => Object.assign(db, originals),
  };
}

test('upsertCourse: a brand-new product is fully populated, including price and is_published', async () => {
  const stub = stubDb({ existing: null });
  try {
    await upsertCourse({
      slug: 'new-product', title: 'New Product', tagline: 'tag', description: 'desc',
      price: 799, category: 'Body',
    });
    assert.equal(stub.runCalls.length, 1);
    const { sql, params } = stub.runCalls[0];
    assert.match(sql, /INSERT INTO courses/);
    assert.match(sql, /original_price, discounted_price/);
    assert.match(sql, /is_published/);
    // slug, title, short_description, description, original_price, discounted_price, category
    assert.deepEqual(params, ['new-product', 'New Product', 'tag', 'desc', 799, 799, 'Body']);
    assert.match(sql, /VALUES \(\$1,\$2,\$3,\$4,\$5,\$6,\$7,'product',TRUE,FALSE,FALSE\)/);
  } finally {
    stub.restore();
  }
});

test('upsertCourse: an existing product with an admin-applied discount and an unpublish keeps both on reseed', async () => {
  const stub = stubDb({
    existing: { slug: 'glow-up-os', discounted_price: '499.00', is_published: false },
  });
  try {
    // The catalog's own price is 999, different from the admin-set 499 —
    // simulating exactly the reported scenario: admin discounted it and
    // pulled it from sale, then someone re-ran the seed.
    await upsertCourse({
      slug: 'glow-up-os', title: 'Glow-Up OS', tagline: 'tag', description: 'desc',
      price: 999, category: 'Body',
    });
    assert.equal(stub.runCalls.length, 1);
    const { sql, params } = stub.runCalls[0];
    assert.match(sql, /UPDATE courses SET/);
    // The bug: these three columns must never appear in the UPDATE's SET list.
    assert.doesNotMatch(sql, /original_price\s*=/);
    assert.doesNotMatch(sql, /discounted_price\s*=/);
    assert.doesNotMatch(sql, /is_published\s*=/);
    // Content fields do stay synced.
    assert.match(sql, /title\s*=\s*\$1/);
    assert.match(sql, /short_description\s*=\s*\$2/);
    assert.match(sql, /description\s*=\s*\$3/);
    assert.match(sql, /category\s*=\s*\$4/);
    assert.deepEqual(params, ['Glow-Up OS', 'tag', 'desc', 'Body', 'glow-up-os']);
  } finally {
    stub.restore();
  }
});

test('upsertCourse: an existing product still gets its content synced (title/description/category)', async () => {
  const stub = stubDb({
    existing: { slug: 'money-os', discounted_price: '999.00', is_published: true },
  });
  try {
    await upsertCourse({
      slug: 'money-os', title: 'Money OS v2', tagline: 'new tag', description: 'new desc',
      price: 999, category: 'Money',
    });
    const { params } = stub.runCalls[0];
    assert.deepEqual(params, ['Money OS v2', 'new tag', 'new desc', 'Money', 'money-os']);
  } finally {
    stub.restore();
  }
});

test('upsertBundle: a brand-new bundle is fully populated, including price and is_published', async () => {
  const stub = stubDb({ existing: null });
  try {
    await upsertBundle({
      slug: 'the-complete-man', title: 'The Complete Man', tagline: 'tag', description: 'desc',
      price: 1499, originalPrice: 2499,
    });
    const { sql, params } = stub.runCalls[0];
    assert.match(sql, /INSERT INTO courses/);
    assert.match(sql, /'Bundle','product',TRUE,FALSE,FALSE/);
    assert.deepEqual(params, ['the-complete-man', 'The Complete Man', 'tag', 'desc', 2499, 1499]);
  } finally {
    stub.restore();
  }
});

test('upsertBundle: an existing bundle keeps an admin-applied price and publish state on reseed', async () => {
  const stub = stubDb({
    existing: { slug: 'the-complete-man', discounted_price: '999.00', is_published: false },
  });
  try {
    await upsertBundle({
      slug: 'the-complete-man', title: 'The Complete Man', tagline: 'tag', description: 'desc',
      price: 1499, originalPrice: 2499,
    });
    const { sql, params } = stub.runCalls[0];
    assert.match(sql, /UPDATE courses SET/);
    assert.doesNotMatch(sql, /original_price\s*=/);
    assert.doesNotMatch(sql, /discounted_price\s*=/);
    assert.doesNotMatch(sql, /is_published\s*=/);
    assert.match(sql, /category\s*=\s*'Bundle'/);
    assert.deepEqual(params, ['The Complete Man', 'tag', 'desc', 'the-complete-man']);
  } finally {
    stub.restore();
  }
});
