import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProductPage, { generateStaticParams, generateMetadata } from '@/app/p/[slug]/page';
import { listProducts as loadProducts } from '@/lib/catalog';
/**
 * The catalog accessors are async now that the catalog lives in the database.
 * This suite iterates the catalog at module scope, so it resolves it once here
 * with a top-level await and keeps its assertions synchronous. The read path
 * itself is covered by tests/catalog-loader.test.ts.
 */
const ALL_PRODUCTS = await loadProducts();
const listProducts = () => ALL_PRODUCTS;
import { formatRupees } from '@/lib/format';

describe('generateStaticParams', () => {
  it('generates a static param for every catalog product (89: 6 launch + 78 imported + 5 pipeline)', async () => {
    const params = await generateStaticParams();
    const slugs = params.map((p) => p.slug).sort();
    expect(slugs).toEqual(listProducts().map((p) => p.slug).sort());
    expect(slugs.length).toBe(89);
  });
});

describe('ProductPage', () => {
  for (const product of listProducts()) {
    it(`renders ${product.slug} with title, price and buy CTA`, async () => {
      const Page = await ProductPage({ params: Promise.resolve({ slug: product.slug }) });
      render(Page);
      expect(screen.getAllByText(product.title).length).toBeGreaterThan(0);
      expect(screen.getAllByText(formatRupees(product.price), { exact: false }).length).toBeGreaterThan(0);
    });
  }

  it('generates OpenGraph metadata from the product cover', async () => {
    const product = listProducts()[0];
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: product.slug }) });
    expect(metadata.title).toContain(product.title);
    expect(metadata.description).toBe(product.tagline);
  });
});
