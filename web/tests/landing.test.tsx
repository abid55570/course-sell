import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import Hero from '@/components/landing/Hero';
import ProductGrid from '@/components/product/ProductGrid';
import InstallSteps from '@/components/landing/InstallSteps';
import PricingLadder from '@/components/landing/PricingLadder';
import BundlesList from '@/components/landing/BundlesList';
import Faq from '@/components/landing/Faq';
import Footer from '@/components/landing/Footer';
import {
  listProducts as loadProducts,
  listCategories as loadCategories,
  listBundles as loadBundles,
  getPricingLadder,
} from '@/lib/catalog';
/**
 * The catalog accessors are async now that the catalog lives in the database.
 * This suite iterates the catalog at module scope, so it resolves it once here
 * with a top-level await and keeps its assertions synchronous. The read path
 * itself is covered by tests/catalog-loader.test.ts.
 */
const [ALL_PRODUCTS, ALL_CATEGORIES, ALL_BUNDLES, PRICING_LADDER] = await Promise.all([
  loadProducts(),
  loadCategories(),
  loadBundles(),
  getPricingLadder(),
]);
const listProducts = () => ALL_PRODUCTS;
const listCategories = () => ALL_CATEGORIES;
const listBundles = () => ALL_BUNDLES;

// CategoryNav, PricingLadder, BundlesList and Footer are presentational now:
// the page resolves the catalog and hands these down. The tests do the same.
const PRODUCTS_BY_SLUG = new Map(ALL_PRODUCTS.map((p) => [p.slug, p]));
const FOOTER_PROPS = { productCount: ALL_PRODUCTS.length, categories: ALL_CATEGORIES };
const LADDER_PROPS = {
  pricingLadder: PRICING_LADDER,
  everythingBundle: ALL_BUNDLES.find((b) => b.slug === 'everything-bundle'),
  pairBundle: ALL_BUNDLES.find((b) => b.slug === 'the-complete-man'),
};
import { formatRupees } from '@/lib/format';

describe('Hero', () => {
  // The hero represents the store, never its current stock. It must read the
  // same at six products or six thousand, so it reports no counts, no prices
  // and no category names, and it reads nothing from the catalog at all.
  it('reports no catalog figures', () => {
    const { container } = render(<Hero />);
    const text = container.textContent ?? '';
    expect(text, 'the hero must not print a price').not.toMatch(/₹\s*\d/);
    expect(text, 'the hero must not print a product or category count').not.toMatch(
      /\d+\s+(PRODUCTS?|CATEGORIES|CATEGORY)/i
    );
  });

  it('states only terms of sale that hold for any product', () => {
    render(<Hero />);
    for (const term of ['ONE PAYMENT', 'INSTANT DOWNLOAD', 'PAY BY UPI', 'NO ACCOUNT NEEDED']) {
      expect(screen.getAllByText(term).length, `${term} missing from the hero strip`).toBeGreaterThan(0);
    }
  });

  it('never counts the catalog as a fixed number in its headline', () => {
    const { container } = render(<Hero />);
    expect(container.textContent).not.toMatch(/six systems/i);
  });

  it('links its primary CTA to the on-page product grid', () => {
    render(<Hero />);
    const link = screen.getByText('Shop the categories').closest('a');
    expect(link?.getAttribute('href')).toBe('#products');
  });

  it('links its secondary CTA to the full browse page', () => {
    render(<Hero />);
    const link = screen.getByText(/See everything/).closest('a');
    expect(link?.getAttribute('href')).toBe('/products');
  });
});

describe('ProductGrid', () => {
  const products = listProducts();
  const categories = listCategories();

  it('gives every category a real anchor target and a heading naming it', () => {
    const { container } = render(<ProductGrid products={products} />);
    for (const category of categories) {
      const section = container.querySelector(`#${category.slug}`);
      expect(section, `missing section for ${category.slug}`).not.toBeNull();
      // Cover-less product cards repeat the category label as their own
      // typographic kicker (see CoverFallback) so a reader can tell which
      // family a cover-less card belongs to. A category with any cover-less
      // products therefore carries this text more than once inside its
      // section (once as the section heading, once per cover-less card) —
      // the real assertion is "the label appears", not "exactly once".
      expect(within(section as HTMLElement).getAllByText(category.label).length).toBeGreaterThan(0);
    }
  });

  it('links every product to its own page, drawing format, file count and price from catalog data', () => {
    // Looks the card up directly by href instead of re-scanning
    // getAllByRole('link') afresh for every product: that was fine at six
    // products, but is O(products^2) over testing-library's accessible-tree
    // walk and timed out once the catalog grew to 84. A plain querySelector
    // by href is O(1) per product and checks the exact same markup.
    const { container } = render(<ProductGrid products={products} />);
    for (const product of products) {
      const card = container.querySelector(`a[href="/p/${product.slug}"]`);
      expect(card, `missing card link for ${product.slug}`).not.toBeNull();
      expect(within(card as HTMLElement).getByText(formatRupees(product.price))).toBeDefined();
      expect(
        within(card as HTMLElement).getByText(
          `${product.format} · ${product.fileCount} ${product.fileCount === 1 ? 'file' : 'files'}`
        )
      ).toBeDefined();
    }
  });

  it('shows a real product count per category rather than a fixed number', () => {
    const { container } = render(<ProductGrid products={products} />);
    for (const category of categories) {
      const section = container.querySelector(`#${category.slug}`) as HTMLElement;
      const count = products.filter((p) => p.category.slug === category.slug).length;
      expect(within(section).getByText(`${count} ${count === 1 ? 'product' : 'products'}`)).toBeDefined();
    }
  });
});

describe('InstallSteps', () => {
  it('renders the three install steps as an ordered list of mono-numbered ledger rows', () => {
    const { container } = render(<InstallSteps />);
    expect(container.querySelector('ol')).not.toBeNull();
    expect(container.querySelectorAll('ol > li').length).toBe(3);
    expect(screen.getByText('Pick a product')).toBeDefined();
    expect(screen.getByText('Pay by UPI')).toBeDefined();
    expect(screen.getByText('Download and start')).toBeDefined();
    // Row numbers are visual duplicates of the list's own position, so they
    // stay aria-hidden.
    for (const n of ['01', '02', '03']) {
      const marker = screen.getByText(n);
      expect(marker.getAttribute('aria-hidden')).toBe('true');
    }
  });
});

describe('PricingLadder', () => {
  it('shows the single, pair and all-products prices', async () => {
    render(<PricingLadder {...LADDER_PROPS} />);
    expect(screen.getByText(formatRupees(PRICING_LADDER.single))).toBeDefined();
    expect(screen.getByText(formatRupees(PRICING_LADDER.pair))).toBeDefined();
    expect(screen.getByText(formatRupees(PRICING_LADDER.allSix))).toBeDefined();
  });
});

describe('BundlesList', () => {
  it('lists every named bundle and marks the unavailable ones', async () => {
    render(<BundlesList bundles={ALL_BUNDLES} productsBySlug={PRODUCTS_BY_SLUG} />);
    for (const bundle of listBundles()) {
      expect(screen.getAllByText(bundle.title).length).toBeGreaterThan(0);
    }
    const unavailable = listBundles().filter((b) => !b.availableToday);
    expect(screen.getAllByText('Not available yet').length).toBe(unavailable.length);
  });
});

describe('Faq', () => {
  it('renders every question it is given', () => {
    const items = [
      { question: 'Does it expire?', answer: 'No.' },
      { question: 'Is there a refund?', answer: 'Reach out first.' },
    ];
    render(<Faq items={items} />);
    for (const item of items) {
      expect(screen.getByText(item.question)).toBeDefined();
    }
  });
});

describe('no rendered landing section uses shadcn\'s muted namespace', () => {
  it('renders every server-safe section without text-muted anywhere in the output', () => {
    const { container } = render(
      <>
        <Hero />
        <ProductGrid products={listProducts()} />
        <InstallSteps />
        <PricingLadder {...LADDER_PROPS} />
        <BundlesList bundles={ALL_BUNDLES} productsBySlug={PRODUCTS_BY_SLUG} />
        <Footer {...FOOTER_PROPS} />
      </>
    );
    expect(container.innerHTML).not.toContain('text-muted');
  });

  // Belt and braces: scan every landing component's source too, so a future
  // edit that reintroduces `text-muted` fails even before a render check
  // would catch it.
  it('never writes text-muted in a landing component source file', () => {
    const dir = path.resolve(__dirname, '../components/landing');
    for (const file of readdirSync(dir)) {
      const src = readFileSync(path.join(dir, file), 'utf8');
      expect(src, `${file} must not use text-muted`).not.toContain('text-muted');
    }
  });
});

// The hero deliberately reports no catalog figures (see above). The footer is
// now the only place a count appears, so the "derived, never hardcoded" rule
// is enforced here instead of being lost with the hero's old spec line.
describe('Footer catalog counts', () => {
  it('derives its product and category counts from the catalog', async () => {
    const products = listProducts();
    const categories = listCategories();
    const { container } = render(<Footer {...FOOTER_PROPS} />);
    const text = (container.textContent ?? '').replace(/\s+/g, ' ');

    expect(text).toContain(`${products.length} digital products`);
    expect(text).toContain(`across ${categories.length} categories`);
  });
});
