function calcDiscountPercent(originalPrice, discountedPrice) {
  const o = Number(originalPrice);
  const d = Number(discountedPrice);
  if (!Number.isFinite(o) || !Number.isFinite(d)) return 0;
  if (o <= 0 || d < 0 || d >= o) return 0;
  return Math.round(((o - d) / o) * 100);
}

function effectivePrice(course) {
  const d = Number(course.discounted_price);
  const o = Number(course.original_price);
  if (Number.isFinite(d) && d > 0) return d;
  if (Number.isFinite(o) && o > 0) return o;
  return 0;
}

module.exports = { calcDiscountPercent, effectivePrice };
