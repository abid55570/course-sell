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
    // A slug is now looked up in catalog_products first. This test covers the
    // legacy `courses` mirror path, so the catalog lookup answers "no row".
    if (/FROM catalog_products/.test(sql)) return null;
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
  const restore = stubDbGet(async (sql) => {
    // Legacy mirror path: the catalog lookup answers "no row" so the
    // `courses` branch is the one under test here. The catalog branch has its
    // own price-source test below.
    if (/FROM catalog_products/.test(sql)) return null;
    return {
      id: 7,
      slug: 'money-os',
      title: 'Money OS',
      original_price: '999.00',
      discounted_price: '999.00',
      is_published: true,
    };
  });
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

// ---------------------------------------------------------------------------
// catalog_products: the row the storefront rendered is the row we charge from.
// ---------------------------------------------------------------------------

test('resolveProduct: a catalog slug resolves from catalog_products, not courses', async () => {
  const restore = stubDbGet(async (sql, params) => {
    if (/FROM catalog_products/.test(sql)) {
      assert.deepEqual(params, ['glow-up-os']);
      return { id: 7, slug: 'glow-up-os', title: 'Glow-Up OS', price: '999.00', kind: 'product' };
    }
    return null;
  });
  try {
    const r = await resolveProduct({ course_slug: 'glow-up-os' });
    assert.equal(r.productType, 'catalog');
    assert.equal(r.catalogProductId, 7);
    assert.equal(r.amount, 999);
    assert.equal(r.title, 'Glow-Up OS');
    assert.equal(r.courseId, undefined);
  } finally { restore(); }
});

test('resolveProduct: the charged amount is exactly the catalog price', async () => {
  const restore = stubDbGet(async (sql) => {
    if (/FROM catalog_products/.test(sql)) {
      return { id: 7, slug: 'x', title: 'X', price: '1499.50', kind: 'product' };
    }
    return null;
  });
  try {
    assert.equal((await resolveProduct({ course_slug: 'x' })).amount, 1499.5);
  } finally { restore(); }
});

test('resolveProduct: catalog_products wins over a stale courses mirror row', async () => {
  // This is the bug the phase exists to fix: the storefront rendered 499 from
  // the catalog while the charge came off a 999 mirror row.
  const restore = stubDbGet(async (sql) => {
    if (/FROM catalog_products/.test(sql)) {
      return { id: 7, slug: 'x', title: 'New Title', price: '499.00', kind: 'product' };
    }
    return { id: 99, slug: 'x', title: 'Old Title', discounted_price: '999.00' };
  });
  try {
    const r = await resolveProduct({ course_slug: 'x' });
    assert.equal(r.amount, 499);
    assert.equal(r.title, 'New Title');
    assert.equal(r.productType, 'catalog');
  } finally { restore(); }
});

test('resolveProduct: falls back to the courses mirror for legacy product lines', async () => {
  const restore = stubDbGet(async (sql, params) => {
    if (/FROM catalog_products/.test(sql)) return null;
    assert.deepEqual(params, ['carousel-editor']);
    return { id: 12, slug: 'carousel-editor', title: 'Carousel Editor', discounted_price: '399.00' };
  });
  try {
    const r = await resolveProduct({ course_slug: 'carousel-editor' });
    assert.equal(r.productType, 'carousel');
    assert.equal(r.courseId, 12);
    assert.equal(r.amount, 399);
    assert.equal(r.catalogProductId, undefined);
  } finally { restore(); }
});

test('resolveProduct: an unknown slug is still an error, in neither table', async () => {
  const restore = stubDbGet(async () => null);
  try {
    assert.match((await resolveProduct({ course_slug: 'nope' })).error, /not found/);
  } finally { restore(); }
});
