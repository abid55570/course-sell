// Env-driven pricing tiers for invite-video templates, so prices can be changed
// per occasion by editing .env (no code change). A template carries a
// `price_tier` (low/mid/high); the actual amount + "was" price + discount % are
// computed from the env values below.
//
//   VIDEO_PRICE_LOW / _MID / _HIGH   final (discounted) price per tier
//   VIDEO_DISCOUNT_PERCENT           headline discount, e.g. 70 -> "70% OFF"
//
// original ("was") price is derived so that discounted is exactly (100-pct)%
// of it:  original = round(discounted / (1 - pct/100)).

function num(v, fallback) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function tierAmounts() {
  return {
    low: num(process.env.VIDEO_PRICE_LOW, 699),
    mid: num(process.env.VIDEO_PRICE_MID, 999),
    high: num(process.env.VIDEO_PRICE_HIGH, 1299),
  };
}

function discountPercent() {
  return Math.min(95, Math.max(0, num(process.env.VIDEO_DISCOUNT_PERCENT, 70)));
}

function tierPricing(tier) {
  const amounts = tierAmounts();
  const discounted = amounts[tier];
  if (discounted == null) return null;
  const pct = discountPercent();
  const original = pct > 0 ? Math.round(discounted / (1 - pct / 100)) : discounted;
  return { original_price: original, discounted_price: discounted, discount_percent: pct };
}

/**
 * Effective pricing for a template row. Uses its tier when set, otherwise falls
 * back to the stored original/discounted columns.
 */
function resolveTemplatePricing(template) {
  const tiered = template && template.price_tier ? tierPricing(template.price_tier) : null;
  if (tiered) return tiered;
  const o = Number(template && template.original_price) || 0;
  const d = Number(template && template.discounted_price) || 0;
  const pct = o > d && o > 0 ? Math.round(((o - d) / o) * 100) : 0;
  return { original_price: o, discounted_price: d, discount_percent: pct };
}

// ---- Purchase plans (the buyer-chosen feature ladder) ---------------------
// Prices come from the env tiers (low->Basic, mid->Standard, high->Premium);
// the feature limits are product definition (constants).
const PLAN_KEYS = ['basic', 'standard', 'premium'];

function planCatalog() {
  const amounts = tierAmounts();
  const pct = discountPercent();
  const withWas = (price) => ({
    price,
    original: pct > 0 ? Math.round(price / (1 - pct / 100)) : price,
    discount_percent: pct,
  });
  return {
    basic: {
      key: 'basic', label: 'Basic', ...withWas(amounts.low),
      seconds: 15, maxPhotos: 1, width: 720, height: 1280, resolution: '720p HD',
      revisions: 0, priority: false,
      features: ['Up to 15s video', '1 photo', '720p HD', 'WhatsApp-ready copy'],
    },
    standard: {
      key: 'standard', label: 'Standard', ...withWas(amounts.mid),
      seconds: 25, maxPhotos: 3, width: 1080, height: 1920, resolution: '1080p Full HD',
      revisions: 1, priority: false,
      features: ['Up to 25s video', 'Up to 3 photos', '1080p Full HD', '1 free revision'],
    },
    premium: {
      key: 'premium', label: 'Premium', ...withWas(amounts.high),
      seconds: 40, maxPhotos: 5, width: 1080, height: 1920, resolution: '1080p Full HD',
      revisions: 2, priority: true,
      features: ['Up to 40s video', 'Up to 5 photos', '1080p Full HD', '2 free revisions', 'Priority render'],
    },
  };
}

function isValidPlan(key) { return PLAN_KEYS.includes(key); }
function getPlan(key) { return planCatalog()[key] || null; }

// A template's `price_tier` (low/mid/high) is the DEFAULT plan pre-selected in
// the editor; the buyer can still pick any plan.
function defaultPlanForTier(tier) {
  return ({ low: 'basic', mid: 'standard', high: 'premium' })[tier] || 'standard';
}

// Pricing for a chosen plan (used for the order amount + display).
function planPricing(key) {
  const p = getPlan(key);
  if (!p) return null;
  return { plan: key, discounted_price: p.price, original_price: p.original, discount_percent: p.discount_percent };
}

module.exports = {
  tierAmounts, discountPercent, tierPricing, resolveTemplatePricing,
  PLAN_KEYS, planCatalog, isValidPlan, getPlan, defaultPlanForTier, planPricing,
};
