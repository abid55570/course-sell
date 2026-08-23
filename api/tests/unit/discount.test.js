const test = require('node:test');
const assert = require('node:assert/strict');
const { calcDiscountPercent, effectivePrice } = require('../../utils/discount');

test('calcDiscountPercent: returns rounded percent for valid prices', () => {
  assert.equal(calcDiscountPercent(1000, 750), 25);
  assert.equal(calcDiscountPercent(4999, 1499), 70);
  assert.equal(calcDiscountPercent(2999, 999), 67);
});

test('calcDiscountPercent: returns 0 when no discount', () => {
  assert.equal(calcDiscountPercent(1000, 1000), 0);
  assert.equal(calcDiscountPercent(1000, 1200), 0);
});

test('calcDiscountPercent: returns 0 for invalid input', () => {
  assert.equal(calcDiscountPercent(0, 0), 0);
  assert.equal(calcDiscountPercent(-100, 50), 0);
  assert.equal(calcDiscountPercent(1000, -5), 0);
  assert.equal(calcDiscountPercent('abc', 100), 0);
  assert.equal(calcDiscountPercent(null, undefined), 0);
});

test('calcDiscountPercent: handles a free course (100% off)', () => {
  assert.equal(calcDiscountPercent(1000, 0), 100);
});

test('effectivePrice: prefers discounted price', () => {
  assert.equal(effectivePrice({ original_price: 1000, discounted_price: 750 }), 750);
});

test('effectivePrice: falls back to original when discounted invalid', () => {
  assert.equal(effectivePrice({ original_price: 1000, discounted_price: 0 }), 1000);
  assert.equal(effectivePrice({ original_price: 1000 }), 1000);
});

test('effectivePrice: returns 0 when both missing', () => {
  assert.equal(effectivePrice({}), 0);
});
