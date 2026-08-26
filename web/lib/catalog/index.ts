import type { Bundle, Category, Product } from './types';
import { loadCatalog } from './loader';

export * from './types';
export { SUPPORT_EMAIL } from './config';
export type { CatalogPayload } from './loader';

/**
 * Every accessor below is async, because the catalog lives in the database
 * now rather than in the eleven TypeScript imports this file used to hold.
 * The product files still exist — see ./fixture-source.ts, which is what the
 * migration script and the test suite read — but nothing at runtime reads them.
 *
 * The public names and semantics are unchanged, so call sites needed only an
 * `await`. Every consumer is a server component, which is what makes that
 * possible.
 */

/**
 * The pricing ladder, still computed from real catalog data rather than
 * restated as hardcoded numbers.
 *
 * `single` is the real catalog-wide minimum price — ₹499, the guide price, now
 * that guides exist. It is deliberately NOT hardcoded to either 499 or 999: if
 * the cheapest product in the catalog ever changes again, this keeps reading
 * correctly without a second edit.
 *
 * `pair` and `allSix` are read off the two bundles that already carry those
 * exact ladder prices as real, shipped catalog data (The Complete Man and the
 * Everything Bundle) rather than restated as separate literals that could
 * drift out of sync.
 *
 * This was a module-level const until the catalog moved into the database.
 * It is a function now because the data it reads arrives asynchronously.
 */
export async function getPricingLadder(): Promise<{ single: number; pair: number; allSix: number }> {
  const { products, bundles } = await loadCatalog();
  return {
    single: Math.min(...products.map((p) => p.price)),
    pair: bundles.find((b) => b.slug === 'the-complete-man')?.price ?? 1499,
    allSix: bundles.find((b) => b.slug === 'everything-bundle')?.price ?? 2999,
  };
}

/** Every product in the catalog. */
export async function listProducts(): Promise<Product[]> {
  return (await loadCatalog()).products;
}

/** A single product by slug, or undefined if the slug isn't in the catalog. */
export async function getProduct(slug: string): Promise<Product | undefined> {
  return (await loadCatalog()).products.find((p) => p.slug === slug);
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
 *
 * Stays synchronous: it takes its list as an argument, so it never needs to
 * load anything.
 */
export function groupProductsByCategory(list: Product[]): Category[] {
  const bySlug = new Map<string, Category>();
  for (const product of list) {
    if (!bySlug.has(product.category.slug)) bySlug.set(product.category.slug, product.category);
  }
  return [...bySlug.values()];
}

/** Every category currently in use by the catalog, in first-seen (catalog) order. */
export async function listCategories(): Promise<Category[]> {
  return groupProductsByCategory((await loadCatalog()).products);
}

/** Every product in a given category, in catalog order. Empty array for an unknown slug. */
export async function listProductsByCategory(slug: string): Promise<Product[]> {
  return (await loadCatalog()).products.filter((p) => p.category.slug === slug);
}

/** Products curated for homepage/featured placement (`featured: true`). */
export async function listFeatured(): Promise<Product[]> {
  return (await loadCatalog()).products.filter((p) => p.featured === true);
}

/** Every named bundle (see bundles.ts for which ones are sellable today). */
export async function listBundles(): Promise<Bundle[]> {
  return (await loadCatalog()).bundles;
}

/** A single bundle by slug, or undefined if the slug isn't in the catalog. */
export async function getBundle(slug: string): Promise<Bundle | undefined> {
  return (await loadCatalog()).bundles.find((b) => b.slug === slug);
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
export async function getPairFor(slug: string): Promise<Product | undefined> {
  const { products } = await loadCatalog();
  const product = products.find((p) => p.slug === slug);
  if (!product?.pairSlug) return undefined;
  return products.find((p) => p.slug === product.pairSlug);
}

/**
 * The full-set product a guide is sold individually out of (e.g. one
 * character guide's `setSlug` resolves to "The Character Codex"), or
 * undefined for a product that isn't part of a set. Mirrors `getPairFor`'s
 * shape exactly, but reads `setSlug` instead of `pairSlug` — kept as a
 * separate field and function because a set anchor compares two arbitrary
 * real prices (see components/product/SetAnchor.tsx), not the fixed
 * pricing-ladder pair rung `getPairFor`'s callers assume.
 */
export async function getSetFor(slug: string): Promise<Product | undefined> {
  const { products } = await loadCatalog();
  const product = products.find((p) => p.slug === slug);
  if (!product?.setSlug) return undefined;
  return products.find((p) => p.slug === product.setSlug);
}

/**
 * The purchasable bundle that contains exactly these two products, or
 * undefined when no such bundle is on sale.
 *
 * Cross-sell used to quote a pair price on every product page by multiplying
 * the ladder's `single` rung by two. Once ₹499 guides joined the catalog,
 * `single` became the catalog-wide minimum, so the six ₹999 product pages
 * advertised "buy both for ₹1,499 instead of ₹998" — telling buyers the bundle
 * cost ₹501 MORE than buying separately, directly above a ₹999 card.
 *
 * A pair price may only be quoted when a real bundle backs it. Today exactly
 * one does: The Complete Man (Glow-Up OS + Social OS). Everything else shows
 * the partner product without a bundle claim.
 */
export async function findPairBundle(slugA: string, slugB: string): Promise<Bundle | undefined> {
  const wanted = [slugA, slugB].sort().join('|');
  const { bundles } = await loadCatalog();
  return bundles.find((bundle) => {
    if (!bundle.availableToday) return false;
    const parts = bundle.components.map((c) => c.slug).filter((s): s is string => Boolean(s));
    if (parts.length !== 2) return false;
    return parts.slice().sort().join('|') === wanted;
  });
}
