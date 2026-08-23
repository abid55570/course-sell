import type { Bundle, BundleSlug, Category, Product, ProductSlug } from './types';
import { glowUpOs } from './products/glow-up-os';
import { auraOs } from './products/aura-os';
import { moneyOs } from './products/money-os';
import { socialOs } from './products/social-os';
import { studyOs } from './products/study-os';
import { careerOs } from './products/career-os';
import { allCharacterGuideProducts } from './products/character-guides';
import { allTalkingToYourParentsProducts } from './products/talking-to-your-parents';
import { allTheTenSeriesProducts } from './products/the-ten-series';
import { bundles as bundleList } from './bundles';

export * from './types';
export { SUPPORT_EMAIL } from './config';

/**
 * The six launch products, in README catalog order, followed by the three
 * imported guide families (40 character guides + the Codex, 12 parents
 * guides + the full set, 23 Ten Series guides + the full set — 84 products
 * total). The six launch product data files are untouched; everything after
 * them is additive.
 */
const products: Product[] = [
  glowUpOs,
  auraOs,
  moneyOs,
  socialOs,
  studyOs,
  careerOs,
  ...allCharacterGuideProducts,
  ...allTalkingToYourParentsProducts,
  ...allTheTenSeriesProducts,
];

const productsBySlug = new Map<ProductSlug, Product>(products.map((p) => [p.slug, p]));
const bundlesBySlug = new Map<BundleSlug, Bundle>(bundleList.map((b) => [b.slug, b]));

/**
 * The pricing ladder, computed from real catalog data rather than restated
 * as hardcoded numbers (see config.ts for why this moved here).
 *
 * `single` is the real catalog-wide minimum price — ₹499, the guide price,
 * now that guides exist. It is deliberately NOT hardcoded to either 499 or
 * 999: if the cheapest product in the catalog ever changes again, this
 * keeps reading correctly without a second edit.
 *
 * `pair` and `allSix` are read off the two bundles that already carry those
 * exact ladder prices as real, shipped catalog data (The Complete Man and
 * the Everything Bundle) rather than restated as separate literals that
 * could drift out of sync with bundles.ts.
 */
export const PRICING_LADDER = {
  single: Math.min(...products.map((p) => p.price)),
  pair: bundleList.find((b) => b.slug === 'the-complete-man')?.price ?? 1499,
  allSix: bundleList.find((b) => b.slug === 'everything-bundle')?.price ?? 2999,
} as const;

/** Every product in the catalog. */
export function listProducts(): Product[] {
  return products;
}

/** A single product by slug, or undefined if the slug isn't in the catalog. */
export function getProduct(slug: string): Product | undefined {
  return productsBySlug.get(slug as ProductSlug);
}

/**
 * Groups any list of products into their categories, in first-seen order,
 * de-duplicated by category slug. Pure and generic: it doesn't know or care
 * whether every category has one product or fifteen, or whether a product's
 * category was ever "registered" anywhere — it just reads `product.category`
 * off whatever list it's given. Exported (not just used internally by
 * `listCategories`) so both the storefront's grid components and
 * tests/catalog.test.ts's openness suite can call the exact same grouping
 * logic the real catalog uses, on an arbitrary product list.
 */
export function groupProductsByCategory(list: Product[]): Category[] {
  const bySlug = new Map<string, Category>();
  for (const product of list) {
    if (!bySlug.has(product.category.slug)) bySlug.set(product.category.slug, product.category);
  }
  return [...bySlug.values()];
}

/** Every category currently in use by the catalog, in first-seen (catalog) order. */
export function listCategories(): Category[] {
  return groupProductsByCategory(products);
}

/** Every product in a given category, in catalog order. Empty array for an unknown slug. */
export function listProductsByCategory(slug: string): Product[] {
  return products.filter((p) => p.category.slug === slug);
}

/** Products curated for homepage/featured placement (`featured: true`). */
export function listFeatured(): Product[] {
  return products.filter((p) => p.featured === true);
}

/** Every named bundle (see bundles.ts for which ones are sellable today). */
export function listBundles(): Bundle[] {
  return bundleList;
}

/** A single bundle by slug, or undefined if the slug isn't in the catalog. */
export function getBundle(slug: string): Bundle | undefined {
  return bundlesBySlug.get(slug as BundleSlug);
}

/**
 * The partner product the README pairs this one with, for cross-sell.
 *
 * From Dashrize-Products/READ-ME-FIRST.txt:
 *   Glow-Up OS + Social OS ....... he fixed the body and face, then someone
 *                                  talked to him and he froze
 *   Money OS   + Career OS ....... a final-year student deciding between
 *                                  "get placed" and "start freelancing"
 *   Study OS   + Career OS ....... the student now graduating
 *   Glow-Up OS + Aura OS ......... partners, siblings, friends
 *
 * Glow-Up OS and Career OS each appear in two README pairings. This function
 * returns one partner per product (the pairing backed by an actual shipped
 * bundle — Social OS for Glow-Up OS via "The Complete Man", Money OS for
 * Career OS via "The Earner Bundle"). The secondary README pairings
 * (Glow-Up OS <-> Aura OS, Study OS <-> Career OS) are not dropped — they are
 * still reachable via each product's own `pairSlug`, since Aura OS's
 * `pairSlug` points back to Glow-Up OS and Study OS's `pairSlug` points to
 * Career OS. See the catalog build report for the full discrepancy note
 * (no shipped bundle actually pairs Glow-Up OS with Aura OS).
 */
export function getPairFor(slug: string): Product | undefined {
  const product = getProduct(slug);
  if (!product?.pairSlug) return undefined;
  return getProduct(product.pairSlug);
}

/**
 * The full-set product a guide is sold individually out of (e.g. one
 * character guide's `setSlug` resolves to "The Character Codex"), or
 * undefined for a product that isn't part of a set. Mirrors `getPairFor`'s
 * shape exactly, but reads `setSlug` instead of `pairSlug` — kept as a
 * separate field and function because a set anchor compares two arbitrary
 * real prices (see components/product/SetAnchor.tsx), not the fixed
 * PRICING_LADDER.pair rung `getPairFor`'s callers assume.
 */
export function getSetFor(slug: string): Product | undefined {
  const product = getProduct(slug);
  if (!product?.setSlug) return undefined;
  return getProduct(product.setSlug);
}

/**
 * The purchasable bundle that contains exactly these two products, or
 * undefined when no such bundle is on sale.
 *
 * Cross-sell used to quote a pair price on every product page by multiplying
 * PRICING_LADDER.single by two. Once Rs 499 guides joined the catalog, `single`
 * became the catalog-wide minimum, so the six Rs 999 product pages advertised
 * "buy both for Rs 1,499 instead of Rs 998" — telling buyers the bundle cost
 * Rs 501 MORE than buying separately, directly above a Rs 999 card.
 *
 * A pair price may only be quoted when a real bundle backs it. Today exactly
 * one does: The Complete Man (Glow-Up OS + Social OS). Everything else shows
 * the partner product without a bundle claim.
 */
export function findPairBundle(slugA: string, slugB: string): Bundle | undefined {
  const wanted = [slugA, slugB].sort().join('|');
  return bundleList.find((bundle) => {
    if (!bundle.availableToday) return false;
    const parts = bundle.components.map((c) => c.slug).filter((s): s is string => Boolean(s));
    if (parts.length !== 2) return false;
    return parts.slice().sort().join('|') === wanted;
  });
}
