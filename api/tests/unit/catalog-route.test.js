const test = require('node:test');
const assert = require('node:assert/strict');
const { buildListQuery, shapeItem } = require('../../routes/catalog');

test('buildListQuery: no filters returns published only', () => {
  const { sql, params } = buildListQuery({});
  assert.match(sql, /WHERE is_published = TRUE/);
  assert.deepEqual(params, []);
});

test('buildListQuery: filters by kind and class_level with ordered placeholders', () => {
  const { sql, params } = buildListQuery({ kind: 'ebook', class_level: '10' });
  assert.match(sql, /kind = \$1/);
  assert.match(sql, /class_level = \$2/);
  assert.deepEqual(params, ['ebook', '10']);
});

test('buildListQuery: ignores unknown filter keys', () => {
  const { params } = buildListQuery({ kind: 'ebook', drop_table: 'x' });
  assert.deepEqual(params, ['ebook']);
});

test('shapeItem: adds discount_percent', () => {
  const out = shapeItem({ original_price: 99, discounted_price: 49 });
  assert.equal(out.discount_percent, 51);
});
