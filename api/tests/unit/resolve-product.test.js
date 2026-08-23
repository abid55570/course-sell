const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../../utils/db');
const { resolveProduct } = require('../../routes/orders');

// resolveProduct only ever calls db.get, so stubbing that one method (db is a
// plain CommonJS module-cache singleton, and orders.js reads db.get off it at
// call time) is enough to exercise resolveProduct with no real database —
// same approach as tests/unit/env-loading.test.js's process-level isolation,
// just at the function level.
function stubDbGet(fn) {
  const original = db.get;
  db.get = fn;
  return () => {
    db.get = original;
  };
}

test('resolveProduct: course_slug resolves a published courses row', async () => {
  const restore = stubDbGet(async (sql, params) => {
    assert.match(sql, /FROM courses WHERE slug = \$1 AND is_published = TRUE/);
    assert.deepEqual(params, ['glow-up-os']);
    return {
      id: 42,
      slug: 'glow-up-os',
      title: 'Glow-Up OS',
      original_price: '999.00',
      discounted_price: '999.00',
      is_published: true,
    };
  });
  try {
    const product = await resolveProduct({ course_slug: 'glow-up-os' });
    assert.equal(product.error, undefined);
    assert.equal(product.productType, 'course');
    assert.equal(product.courseId, 42);
    assert.equal(product.amount, 999);
    assert.equal(product.title, 'Glow-Up OS');
  } finally {
    restore();
  }
});

test('resolveProduct: course_slug for a slug with no row is rejected, not just unpublished ones', async () => {
  const restore = stubDbGet(async () => null); // no row at all: unknown slug
  try {
    const product = await resolveProduct({ course_slug: 'not-a-real-product' });
    assert.equal(product.error, 'product not found');
  } finally {
    restore();
  }
});

test('resolveProduct: course_slug for an unpublished product is rejected', async () => {
  // The query itself filters `is_published = TRUE`, so an unpublished row
  // never comes back from db.get -- assert that path also yields the error,
  // not a resolved product with is_published: false slipping through.
  const restore = stubDbGet(async (sql) => {
    assert.match(sql, /is_published = TRUE/);
    return null;
  });
  try {
    const product = await resolveProduct({ course_slug: 'unpublished-product' });
    assert.equal(product.error, 'product not found');
  } finally {
    restore();
  }
});

test('resolveProduct: price is read from the database row, never from the caller', async () => {
  const restore = stubDbGet(async () => ({
    id: 7,
    slug: 'money-os',
    title: 'Money OS',
    original_price: '999.00',
    discounted_price: '999.00',
    is_published: true,
  }));
  try {
    // A client trying to smuggle its own price/amount through the body must
    // be ignored entirely -- resolveProduct doesn't even read those keys.
    const product = await resolveProduct({ course_slug: 'money-os', amount: 1, price: 1 });
    assert.equal(product.amount, 999);
  } finally {
    restore();
  }
});

test('resolveProduct: course_id path still works unchanged (existing callers)', async () => {
  const restore = stubDbGet(async (sql, params) => {
    assert.match(sql, /FROM courses WHERE id = \$1 AND is_published = TRUE/);
    assert.deepEqual(params, [5]);
    return {
      id: 5,
      slug: 'full-stack-web-development',
      title: 'Full Stack Web Development Mastery',
      original_price: '4999.00',
      discounted_price: '1499.00',
      is_published: true,
    };
  });
  try {
    const product = await resolveProduct({ course_id: 5 });
    assert.equal(product.productType, 'course');
    assert.equal(product.amount, 1499);
  } finally {
    restore();
  }
});

test('resolveProduct: neither course_id, course_slug, nor video_project_id given', async () => {
  const product = await resolveProduct({});
  assert.equal(product.error, 'course_id, course_slug, or video_project_id required');
});
