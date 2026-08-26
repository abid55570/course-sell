const test = require('node:test');
const assert = require('node:assert/strict');
const { shapeRow } = require('../../routes/catalog-storefront');

const ROW = {
  id: 1,
  slug: 'glow-up-os',
  kind: 'product',
  title: 'Glow-Up OS',
  short_title: 'Glow-Up',
  tagline: 'Body, looks, mind.',
  price: '999.00',
  anchor_price: '2999.00',
  category_slug: 'self',
  category_label: 'Self',
  accent_name: 'gold',
  accent_hex: '#c8a44a',
  tags: ['glow'],
  is_published: true,
  featured: true,
  available_today: true,
  pair_slug: 'social-os',
  set_slug: null,
  content: {
    modules: [{ id: '01', title: 'BODY', pageCount: 12, highlights: ['a'] }],
    longDescription: [{ heading: 'What', paragraphs: ['p'] }],
    faqs: [{ question: 'q', answer: 'a' }],
    gallery: [{ filename: 'c.png', role: 'cover', alt: 'c' }],
    bulletPoints: ['b'],
    deliveryFiles: ['x.pdf'],
    disclaimer: 'Not medical advice.',
    pageCount: 39,
  },
};

test('shapeRow: rebuilds the nested category and accent objects', () => {
  const p = shapeRow(ROW);
  assert.deepEqual(p.category, {
    slug: 'self',
    label: 'Self',
    accent: { name: 'gold', hex: '#c8a44a' },
  });
  assert.deepEqual(p.accent, { name: 'gold', hex: '#c8a44a' });
});

test('shapeRow: numeric columns come back as numbers, not pg strings', () => {
  const p = shapeRow(ROW);
  assert.equal(p.price, 999);
  assert.equal(typeof p.price, 'number');
  assert.equal(p.anchorPrice, 2999);
  assert.equal(typeof p.anchorPrice, 'number');
});

test('shapeRow: content is merged in at the top level', () => {
  const p = shapeRow(ROW);
  assert.deepEqual(p.modules, ROW.content.modules);
  assert.deepEqual(p.faqs, ROW.content.faqs);
  assert.deepEqual(p.gallery, ROW.content.gallery);
  assert.equal(p.disclaimer, 'Not medical advice.');
  assert.equal(p.pageCount, 39);
});

test('shapeRow: uses the camelCase names the storefront types declare', () => {
  const p = shapeRow(ROW);
  assert.equal(p.shortTitle, 'Glow-Up');
  assert.equal(p.pairSlug, 'social-os');
  assert.equal(p.setSlug, undefined);
  assert.equal(p.featured, true);
  // snake_case column names must not leak through to the storefront.
  for (const leaked of ['short_title', 'pair_slug', 'anchor_price', 'category_slug', 'accent_name']) {
    assert.ok(!(leaked in p), `${leaked} leaked into the shaped product`);
  }
});

test('shapeRow: a product carries no availableToday flag', () => {
  const p = shapeRow(ROW);
  assert.equal('availableToday' in p, false);
});

test('shapeRow: a bundle keeps components, separatePrice and availableToday', () => {
  const b = shapeRow({
    ...ROW,
    slug: 'the-complete-woman',
    kind: 'bundle',
    available_today: false,
    content: {
      components: [{ slug: null, label: 'Skin OS', inCatalog: false, note: 'n' }],
      separatePrice: 5994,
      longDescription: [],
      faqs: [],
      helplines: [],
      disclaimer: 'x',
      coverImage: { filename: 'c.png', role: 'cover', alt: 'c' },
    },
  });
  assert.equal(b.availableToday, false);
  assert.equal(b.separatePrice, 5994);
  assert.equal(b.components.length, 1);
  assert.equal(b.components[0].inCatalog, false);
});

test('shapeRow: a row missing a required field is rejected, not half-shaped', () => {
  assert.equal(shapeRow({ ...ROW, title: null }), null);
  assert.equal(shapeRow({ ...ROW, slug: null }), null);
  assert.equal(shapeRow({ ...ROW, price: null }), null);
  assert.equal(shapeRow({ ...ROW, price: 'not a number' }), null);
  assert.equal(shapeRow(null), null);
});

test('shapeRow: a row with unusable content JSONB is rejected', () => {
  assert.equal(shapeRow({ ...ROW, content: null }), null);
  assert.equal(shapeRow({ ...ROW, content: 'not an object' }), null);
  assert.equal(shapeRow({ ...ROW, content: [1, 2] }), null);
});

test('shapeRow: absent optional collections become empty arrays, never undefined', () => {
  const p = shapeRow({ ...ROW, content: {} });
  assert.deepEqual(p.faqs, []);
  assert.deepEqual(p.gallery, []);
  assert.deepEqual(p.bulletPoints, []);
  assert.deepEqual(p.longDescription, []);
  assert.deepEqual(p.deliveryFiles, []);
  // modules is genuinely optional: not every product is built out of numbered
  // modules, and an empty array would render an empty modules section.
  assert.equal(p.modules, undefined);
});

test('shapeRow: a column value wins over the same key inside content', () => {
  const p = shapeRow({
    ...ROW,
    price: '499.00',
    title: 'Column Title',
    content: { ...ROW.content, price: 9999, title: 'Stale Content Title' },
  });
  assert.equal(p.price, 499);
  assert.equal(p.title, 'Column Title');
});

test('shapeRow: a category with no accent falls back to a brand colour', () => {
  const p = shapeRow({ ...ROW, accent_name: null, accent_hex: null });
  assert.equal(p.accent, undefined);
  assert.deepEqual(p.category.accent, { name: 'green', hex: '#1f8a4c' });
});

test('shapeRow: a category label defaults to its slug when absent', () => {
  const p = shapeRow({ ...ROW, category_label: null });
  assert.equal(p.category.label, 'self');
});

test('server.js mounts /api/catalog/storefront before /api/catalog', () => {
  // routes/catalog.js ends in a `/:slug` catch-all. Mounted first, it would
  // answer /api/catalog/storefront as a slug lookup and the storefront feed
  // would never be reached. Order is load-bearing, so pin it.
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'server.js'), 'utf8');
  const storefront = src.indexOf("app.use('/api/catalog/storefront'");
  const catalog = src.indexOf("app.use('/api/catalog'");
  assert.ok(storefront !== -1, 'storefront route is not mounted');
  assert.ok(catalog !== -1, 'catalog route is not mounted');
  assert.ok(storefront < catalog, 'storefront must be mounted before /api/catalog');
});
