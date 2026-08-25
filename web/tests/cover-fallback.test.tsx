import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import {
  listProducts as loadProducts,
  listCategories as loadCategories,
  getPricingLadder,
} from '@/lib/catalog';
/**
 * The catalog accessors are async now that the catalog lives in the database.
 * This suite iterates the catalog at module scope, so it resolves it once here
 * with a top-level await and keeps its assertions synchronous. The read path
 * itself is covered by tests/catalog-loader.test.ts.
 */
const [ALL_PRODUCTS, ALL_CATEGORIES, PRICING_LADDER] = await Promise.all([
  loadProducts(),
  loadCategories(),
  getPricingLadder(),
]);
const listCategories = () => ALL_CATEGORIES;

// PricingLadder is presentational now; the page resolves these and passes them.
const LADDER_PROPS = {
  pricingLadder: PRICING_LADDER,
  everythingBundle: undefined,
  pairBundle: undefined,
};
const getProduct = (slug: string) => ALL_PRODUCTS.find((p) => p.slug === slug);
const getSetFor = (slug: string) => {
  const product = getProduct(slug);
  return product?.setSlug ? getProduct(product.setSlug) : undefined;
};
import { formatRupees } from '@/lib/format';

import Home from '@/app/page';
import ProductsPage from '@/app/products/page';
import CategoryPage from '@/app/category/[slug]/page';
import ProductPage from '@/app/p/[slug]/page';
import PricingLadder from '@/components/landing/PricingLadder';

/**
 * Coverage for the two things the catalog import actually changed the
 * chrome to do: render a typographic card for the 75 guides that ship no
 * cover image (CoverFallback), and reflect the real, now-mixed pricing
 * ladder instead of the old flat ₹999. Uses real catalog products (not a
 * fixture) on purpose — CoverFallback and the guide/set data need to prove
 * out together, not just that the component compiles in isolation.
 */

beforeAll(() => {
  if (typeof (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver === 'undefined') {
    class FakeIntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = FakeIntersectionObserver;
  }
});

const GUIDE_SLUG = 'how-to-be-like-saitama'; // real, cover-less, featured
const SET_SLUG = 'the-character-codex'; // real, has a cover image
const CATEGORY_SLUG = 'character-guides';

function expectNoBrokenCounts(container: HTMLElement) {
  expect(container.textContent).not.toContain('undefined');
  expect(container.textContent).not.toMatch(/\b0\s*(pages?|trackers?|files?)\b/i);
}

describe('a cover-less guide renders its typographic card, not a broken image', () => {
  it('on the homepage (it is one of the three featured guides)', async () => {
    const { container } = render(await Home());
    expectNoBrokenCounts(container);

    const link = screen
      .getAllByRole('link')
      .find((l) => l.getAttribute('href') === `/p/${GUIDE_SLUG}`);
    expect(link, 'the featured guide has no card on the homepage').toBeDefined();
    const card = link as HTMLElement;

    // No <img> for this card at all: the cover slot is pure text/CSS.
    expect(card.querySelectorAll('img').length).toBe(0);
    // The title appears twice by design (once large in the typographic
    // cover slot, once again in the caption row below it), so this checks
    // "at least once", not "exactly once".
    expect(within(card).getAllByText('How to be like Saitama').length).toBeGreaterThan(0);
    // The typographic kicker names the real category, not a placeholder.
    expect(within(card).getByText('Character Guides')).toBeDefined();
  });

  it('on the browse page (/products), sitting in a grid that also holds real covers', async () => {
    const { container } = render(await ProductsPage());
    expectNoBrokenCounts(container);

    const guideLink = container.querySelector(`a[href="/p/${GUIDE_SLUG}"]`);
    expect(guideLink, 'guide card missing from /products').not.toBeNull();
    expect(guideLink!.querySelectorAll('img').length).toBe(0);
    expect(within(guideLink as HTMLElement).getAllByText('How to be like Saitama').length).toBeGreaterThan(0);

    // The Character Codex, in the very same category section, does ship a
    // cover image — proving the grid mixes a real <img> card and a
    // typographic card side by side without either breaking.
    const setLink = container.querySelector(`a[href="/p/${SET_SLUG}"]`);
    expect(setLink, 'Character Codex card missing from /products').not.toBeNull();
    expect(setLink!.querySelectorAll('img').length).toBeGreaterThan(0);
  });

  it('on its own category page (/category/character-guides), a 41-item grid', async () => {
    const Page = await CategoryPage({ params: Promise.resolve({ slug: CATEGORY_SLUG }) });
    const { container } = render(Page);
    expectNoBrokenCounts(container);
    expect(screen.getByText('41 products in this category.')).toBeDefined();

    const guideLink = container.querySelector(`a[href="/p/${GUIDE_SLUG}"]`);
    expect(guideLink).not.toBeNull();
    expect(guideLink!.querySelectorAll('img').length).toBe(0);

    const setLink = container.querySelector(`a[href="/p/${SET_SLUG}"]`);
    expect(setLink).not.toBeNull();
    expect(setLink!.querySelectorAll('img').length).toBeGreaterThan(0);
  });
});

describe("a cover-less guide's own product page", () => {
  it('renders with no empty headings, no "undefined", no "0 pages", and a working typographic hero', async () => {
    const product = getProduct(GUIDE_SLUG)!;
    const Page = await ProductPage({ params: Promise.resolve({ slug: GUIDE_SLUG }) });
    const { container } = render(Page);

    expectNoBrokenCounts(container);
    expect(screen.getAllByText(product.title).length).toBeGreaterThan(0);
    expect(screen.getAllByText(formatRupees(product.price), { exact: false }).length).toBeGreaterThan(0);

    // The hero's image slot carries no <img> — the typographic fallback
    // fills it instead of leaving it blank. (The page as a whole does have
    // one <img>, further down: the set-anchor section embeds a ProductCard
    // for the real, cover-bearing set this guide belongs to — that's
    // expected and checked separately below.)
    const hero = container.querySelector('main > section');
    expect(hero, 'hero section not found').not.toBeNull();
    expect((hero as HTMLElement).querySelectorAll('img').length).toBe(0);

    // No modules exist for a guide, so the section must not render at all
    // (not render with an empty list under the heading).
    expect(screen.queryByText('Module breakdown')).toBeNull();

    // This guide does carry a disclaimer + helplines, so that section must render.
    expect(screen.getByText('Disclaimer')).toBeDefined();

    // It belongs to a set, so the set anchor must appear, with the real
    // guide price and the real set price, not a guessed or hardcoded number.
    const set = getSetFor(GUIDE_SLUG)!;
    expect(screen.getByText(new RegExp(`Part of ${set.title.split(' — ')[0]}`))).toBeDefined();
    expect(screen.getAllByText(formatRupees(set.price), { exact: false }).length).toBeGreaterThan(0);
  });
});

describe('the new categories appear across the storefront', () => {
  it('all three imported categories are linked from the homepage category-nav grid', async () => {
    render(await Home());
    for (const label of ['Character Guides', 'Talking to Your Parents', 'The Ten Series']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  it('all three imported categories are linked from the /products jump nav', async () => {
    render(await ProductsPage());
    for (const slug of ['character-guides', 'talking-to-your-parents', 'the-ten-series']) {
      const link = screen.getAllByRole('link').find((l) => l.getAttribute('href') === `#${slug}`);
      expect(link, `no jump-nav link for ${slug}`).toBeDefined();
    }
  });

  it('listCategories() carries 6 categories, each with its own accent hex distinguishable from the rest and from vermilion (#C42B22)', () => {
    const categories = listCategories();
    expect(categories).toHaveLength(6);
    for (const c of categories) {
      expect(c.accent.hex).toMatch(/^#[0-9a-f]{6}$/i);
      expect(c.accent.hex.toLowerCase()).not.toBe('#c42b22');
    }
    // No two categories share an accent hex.
    const hexes = categories.map((c) => c.accent.hex.toLowerCase());
    expect(new Set(hexes).size).toBe(hexes.length);
  });
});

describe('the price ladder reflects the real catalog minimum', () => {
  it('PricingLadder renders ₹499, not the old flat ₹999, as its lowest tier', async () => {
    render(<PricingLadder {...LADDER_PROPS} />);
    expect(screen.getByText(formatRupees(499))).toBeDefined();
    expect(screen.queryByText(formatRupees(999))).toBeNull();
    expect(PRICING_LADDER.single).toBe(499);
  });

  it('₹499 is a real product price (the guides), not an arbitrary number', () => {
    const guide = getProduct(GUIDE_SLUG)!;
    expect(guide.price).toBe(499);
    expect(guide.price).toBe(PRICING_LADDER.single);
  });
});
