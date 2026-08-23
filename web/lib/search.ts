import { listProducts, type Product } from './catalog';

/**
 * Search runs on the server.
 *
 * The alternative was shipping a derived index to the browser for instant
 * client-side filtering. At 84 products that index is roughly 12KB gzipped
 * before any matching code, and it grows with the catalog. Dropdesk's buyers
 * arrive from Instagram on mid-range Android over Indian mobile data, and the
 * first-load budget has ~40KB of headroom for three separate pieces of work.
 *
 * Server-side matching costs zero client bytes, works with JavaScript still
 * loading, and does not get slower as the catalog grows past a thousand
 * products. The search box is a plain form; the results page is static-friendly.
 */

/** Lowercased, punctuation-stripped tokens. "How-to-be-like Bruce Wayne" -> [how,to,be,like,bruce,wayne] */
function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** The fields a product is findable by. Long descriptions are excluded on purpose: they add noise, not recall. */
function haystack(product: Product): { title: string[]; rest: string[] } {
  const title = tokenize([product.title, product.shortTitle ?? ''].join(' '));
  const rest = tokenize(
    [
      product.category?.label ?? '',
      product.format ?? '',
      product.audience ?? '',
      (product.tags ?? []).join(' '),
      product.tagline ?? '',
    ].join(' ')
  );
  return { title, rest };
}

/**
 * Scores a product against a query, or returns 0 for no match.
 *
 * Every query term must match something (AND, not OR), so "parents money"
 * narrows rather than widening. A term matches a field token by prefix, which
 * is what makes "disciplin" find "Dangerously Disciplined" and "bruce" find
 * "How to be like Bruce Wayne".
 */
function score(product: Product, terms: string[]): number {
  const { title, rest } = haystack(product);
  let total = 0;

  for (const term of terms) {
    const exactTitle = title.some((t) => t === term);
    const prefixTitle = title.some((t) => t.startsWith(term));
    const prefixRest = rest.some((t) => t.startsWith(term));

    if (exactTitle) total += 10;
    else if (prefixTitle) total += 6;
    else if (prefixRest) total += 2;
    else return 0; // this term matched nothing, so the product is not a result
  }

  // A shorter title carrying the same matches is the more precise answer.
  return total + Math.max(0, 6 - title.length * 0.1);
}

export type SearchResult = { product: Product; score: number };

/** Ranked matches for a query. An empty or whitespace query returns nothing, never everything. */
export function searchProducts(query: string): SearchResult[] {
  const terms = tokenize(query ?? '');
  if (terms.length === 0) return [];

  return listProducts()
    .map((product) => ({ product, score: score(product, terms) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.product.title.localeCompare(b.product.title));
}

export type SortKey = 'catalog' | 'price-asc' | 'price-desc' | 'title';

/**
 * Sort options are derived from real data only. There is deliberately no
 * "popular", "trending" or "bestselling": the store has made no sales, so any
 * such ordering would be invented.
 */
export const SORTS: { key: SortKey; label: string }[] = [
  { key: 'catalog', label: 'Catalog order' },
  { key: 'price-asc', label: 'Price, low to high' },
  { key: 'price-desc', label: 'Price, high to low' },
  { key: 'title', label: 'Name, A to Z' },
];

export function sortProducts(products: Product[], key: SortKey): Product[] {
  const copy = products.slice();
  switch (key) {
    case 'price-asc':
      return copy.sort((a, b) => a.price - b.price || a.title.localeCompare(b.title));
    case 'price-desc':
      return copy.sort((a, b) => b.price - a.price || a.title.localeCompare(b.title));
    case 'title':
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return copy;
  }
}

/** Price tiers derived from the prices actually present, never hardcoded bands. */
export function priceTiers(): number[] {
  return [...new Set(listProducts().map((p) => p.price))].sort((a, b) => a - b);
}
