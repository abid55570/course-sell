const test = require('node:test');
const assert = require('node:assert/strict');
const { splitRow } = require('../../scripts/migrate-catalog');

const PRODUCT = {
  slug: 'glow-up-os',
  title: 'Glow-Up OS',
  shortTitle: 'Glow-Up',
  tagline: 'Body, looks, mind.',
  price: 999,
  anchorPrice: 2999,
  category: { slug: 'self', label: 'Self', accent: { name: 'green', hex: '#1f8a4c' } },
  accent: { name: 'gold', hex: '#c8a44a' },
  tags: ['glow', 'habits'],
  featured: true,
  pairSlug: 'social-os',
  modules: [{ id: '01', title: 'BODY', pageCount: 12, highlights: ['a'] }],
  longDescription: [{ heading: 'What', paragraphs: ['p1', 'p2'] }],
  bulletPoints: ['b1'],
  faqs: [{ question: 'q', answer: 'a' }],
  gallery: [{ filename: 'cover.png', role: 'cover', alt: 'Cover' }],
  deliveryFiles: ['glow-up-os.pdf'],
  disclaimer: 'Not medical advice.',
  pageCount: 39,
};

test('splitRow: scalars go to columns', () => {
  const { columns } = splitRow(PRODUCT, 'product');
  assert.equal(columns.slug, 'glow-up-os');
  assert.equal(columns.kind, 'product');
  assert.equal(columns.title, 'Glow-Up OS');
  assert.equal(columns.short_title, 'Glow-Up');
  assert.equal(columns.tagline, 'Body, looks, mind.');
  assert.equal(columns.price, 999);
  assert.equal(columns.anchor_price, 2999);
  assert.equal(columns.category_slug, 'self');
  assert.equal(columns.category_label, 'Self');
  assert.equal(columns.accent_name, 'gold');
  assert.equal(columns.accent_hex, '#c8a44a');
  assert.deepEqual(columns.tags, ['glow', 'habits']);
  assert.equal(columns.featured, true);
  assert.equal(columns.pair_slug, 'social-os');
  assert.equal(columns.set_slug, null);
});

test('splitRow: nested content goes to content, and is not duplicated in columns', () => {
  const { content } = splitRow(PRODUCT, 'product');
  assert.deepEqual(content.modules, PRODUCT.modules);
  assert.deepEqual(content.longDescription, PRODUCT.longDescription);
  assert.deepEqual(content.faqs, PRODUCT.faqs);
  assert.deepEqual(content.gallery, PRODUCT.gallery);
  assert.deepEqual(content.deliveryFiles, PRODUCT.deliveryFiles);
  assert.equal(content.disclaimer, 'Not medical advice.');
  assert.equal(content.pageCount, 39);

  // Anything promoted to a column must not also live in content: two copies
  // of one value is exactly the drift this table exists to end.
  for (const promoted of ['slug', 'title', 'tagline', 'price', 'tags', 'category', 'accent', 'featured', 'pairSlug']) {
    assert.ok(!(promoted in content), `${promoted} should not be in content`);
  }
});

test('splitRow: a bundle keeps components, separatePrice and availableToday', () => {
  const bundle = {
    slug: 'everything-bundle',
    title: 'Everything',
    tagline: 'All six.',
    price: 2999,
    separatePrice: 5994,
    availableToday: true,
    components: [
      { slug: 'glow-up-os', label: 'Glow-Up OS', inCatalog: true },
      { slug: null, label: 'Skin OS', inCatalog: false, note: 'not built yet' },
    ],
    longDescription: [],
    disclaimer: 'x',
    helplines: [],
    faqs: [],
    coverImage: { filename: 'c.png', role: 'cover', alt: 'c' },
  };
  const { columns, content } = splitRow(bundle, 'bundle');
  assert.equal(columns.kind, 'bundle');
  assert.equal(columns.available_today, true);
  assert.deepEqual(content.components, bundle.components);
  assert.equal(content.separatePrice, 5994);
  assert.deepEqual(content.coverImage, bundle.coverImage);
});

test('splitRow: an unavailable bundle records available_today false', () => {
  const { columns } = splitRow(
    { slug: 'b', title: 'B', tagline: 't', price: 1499, availableToday: false },
    'bundle'
  );
  assert.equal(columns.available_today, false);
});

test('splitRow: missing optional fields become null, never undefined', () => {
  const bare = {
    slug: 's', title: 'T', tagline: 'g', price: 499,
    tags: [], gallery: [], faqs: [], bulletPoints: [], longDescription: [], deliveryFiles: [],
  };
  const { columns } = splitRow(bare, 'product');
  assert.equal(columns.short_title, null);
  assert.equal(columns.anchor_price, null);
  assert.equal(columns.pair_slug, null);
  assert.equal(columns.set_slug, null);
  assert.equal(columns.category_slug, null);
  assert.equal(columns.category_label, null);
  assert.equal(columns.accent_name, null);
  assert.equal(columns.accent_hex, null);
  assert.equal(columns.featured, false);
  assert.equal(columns.available_today, true);
});

test('splitRow: undefined values are dropped from content rather than stored as null', () => {
  const { content } = splitRow(
    { slug: 's', title: 'T', tagline: 'g', price: 499, disclaimer: undefined, modules: undefined },
    'product'
  );
  assert.ok(!('disclaimer' in content));
  assert.ok(!('modules' in content));
});

test('splitRow: the real catalog round-trips through split without losing a field', () => {
  const { readCatalogExport } = require('../../scripts/migrate-catalog');
  const { products, bundles } = readCatalogExport();

  for (const [items, kind] of [[products, 'product'], [bundles, 'bundle']]) {
    for (const item of items) {
      const { columns, content } = splitRow(item, kind);
      for (const key of Object.keys(item)) {
        if (item[key] === undefined) continue;
        const promoted =
          (key === 'slug' && columns.slug !== null) ||
          (key === 'title' && columns.title !== null) ||
          (key === 'shortTitle' && columns.short_title !== null) ||
          (key === 'tagline' && columns.tagline !== null) ||
          (key === 'price' && columns.price !== null) ||
          (key === 'anchorPrice' && columns.anchor_price !== null) ||
          (key === 'category' && columns.category_slug !== null) ||
          (key === 'accent' && columns.accent_name !== null) ||
          key === 'tags' || key === 'featured' || key === 'availableToday' ||
          (key === 'pairSlug' && columns.pair_slug !== null) ||
          (key === 'setSlug' && columns.set_slug !== null);

        assert.ok(
          promoted || key in content,
          `${kind} ${item.slug}: field "${key}" landed in neither a column nor content`
        );
      }
    }
  }
});
