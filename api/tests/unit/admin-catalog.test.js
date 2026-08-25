const test = require('node:test');
const assert = require('node:assert/strict');
const { buildUpdate, EDITABLE } = require('../../routes/admin-catalog');

test('buildUpdate: builds a partial update from only the keys present', () => {
  const b = buildUpdate({ price: 1299 });
  assert.deepEqual(b.sets, ['price = $1']);
  assert.deepEqual(b.params, [1299]);
});

test('buildUpdate: numbers the placeholders in the same order as the params', () => {
  const b = buildUpdate({ title: 'T', price: 499, is_published: false });
  assert.deepEqual(b.sets, ['title = $1', 'price = $2', 'is_published = $3']);
  assert.deepEqual(b.params, ['T', 499, false]);
});

test('buildUpdate: leaves untouched columns out of the statement entirely', () => {
  const b = buildUpdate({ price: 999 });
  for (const column of ['title', 'tagline', 'is_published', 'featured', 'content']) {
    assert.ok(!b.sets.some((s) => s.startsWith(column)), `${column} should not be updated`);
  }
});

test('buildUpdate: returns null when the body names no editable field', () => {
  assert.equal(buildUpdate({}), null);
  assert.equal(buildUpdate({ nonsense: 1, created_at: 'x' }), null);
});

test('buildUpdate: refuses to touch slug or id', () => {
  // Renaming a slug would orphan the orders keyed to it and 404 every indexed
  // page, so neither is editable through this route.
  assert.equal(buildUpdate({ slug: 'new-slug' }), null);
  assert.equal(buildUpdate({ id: 5 }), null);
  assert.ok(!('slug' in EDITABLE));
  assert.ok(!('id' in EDITABLE));
});

test('buildUpdate: rejects a non-numeric price rather than writing NaN', () => {
  assert.match(buildUpdate({ price: 'free' }).error, /price must be a number/);
  assert.match(buildUpdate({ anchor_price: 'lots' }).error, /anchor_price must be a number/);
});

test('buildUpdate: an empty string clears a nullable column', () => {
  const b = buildUpdate({ short_title: '', pair_slug: '' });
  assert.deepEqual(b.params, [null, null]);
});

test('buildUpdate: booleans accept the form an HTML form sends', () => {
  assert.deepEqual(buildUpdate({ is_published: 'true' }).params, [true]);
  assert.deepEqual(buildUpdate({ is_published: '1' }).params, [true]);
  assert.deepEqual(buildUpdate({ is_published: 'false' }).params, [false]);
  assert.deepEqual(buildUpdate({ featured: true }).params, [true]);
});

test('buildUpdate: tags coerce to an array of strings', () => {
  assert.deepEqual(buildUpdate({ tags: ['a', 'b'] }).params, [['a', 'b']]);
  // A non-array must not be spread into a broken text[] literal.
  assert.deepEqual(buildUpdate({ tags: 'not-an-array' }).params, [[]]);
});

test('buildUpdate: content is cast to jsonb and replaced wholesale', () => {
  const content = { modules: [{ id: '01' }], faqs: [] };
  const b = buildUpdate({ content });
  assert.deepEqual(b.sets, ['content = $1::jsonb']);
  assert.equal(b.params[0], JSON.stringify(content));
});

test('buildUpdate: rejects a content value that is not an object', () => {
  assert.match(buildUpdate({ content: null }).error, /content must be an object/);
  assert.match(buildUpdate({ content: 'x' }).error, /content must be an object/);
  assert.match(buildUpdate({ content: [1, 2] }).error, /content must be an object/);
});

test('buildUpdate: a price of zero is a real value, not a missing one', () => {
  const b = buildUpdate({ price: 0 });
  assert.deepEqual(b.params, [0]);
  assert.deepEqual(b.sets, ['price = $1']);
});

test('buildUpdate: mixes scalar columns and content in one statement', () => {
  const b = buildUpdate({ price: 799, content: { faqs: [] } });
  assert.deepEqual(b.sets, ['price = $1', 'content = $2::jsonb']);
  assert.equal(b.params[0], 799);
  assert.equal(b.params[1], JSON.stringify({ faqs: [] }));
});
