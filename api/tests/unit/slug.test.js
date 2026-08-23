const test = require('node:test');
const assert = require('node:assert/strict');
const { slugify } = require('../../utils/slug');

test('slugify: lowercases and joins with hyphens', () => {
  assert.equal(slugify('Full Stack Web Development'), 'full-stack-web-development');
});

test('slugify: strips special characters', () => {
  assert.equal(slugify('UI/UX Design: 2026!'), 'ui-ux-design-2026');
});

test('slugify: collapses repeated separators and trims', () => {
  assert.equal(slugify('   --hello---world--   '), 'hello-world');
});

test('slugify: caps at 80 chars', () => {
  const long = 'a'.repeat(200);
  const out = slugify(long);
  assert.equal(out.length, 80);
});

test('slugify: handles empty / null / undefined', () => {
  assert.equal(slugify(''), '');
  assert.equal(slugify(null), '');
  assert.equal(slugify(undefined), '');
});

test('slugify: handles unicode by stripping', () => {
  assert.equal(slugify('Café — Naïve'), 'caf-na-ve');
});
