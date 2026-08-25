import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BundlePage, { generateStaticParams } from '@/app/bundle/[slug]/page';
import { listBundles as loadBundles } from '@/lib/catalog';
/**
 * The catalog accessors are async now that the catalog lives in the database.
 * This suite iterates the catalog at module scope, so it resolves it once here
 * with a top-level await and keeps its assertions synchronous. The read path
 * itself is covered by tests/catalog-loader.test.ts.
 */
const ALL_BUNDLES = await loadBundles();
const listBundles = () => ALL_BUNDLES;
import { formatRupees } from '@/lib/format';

describe('generateStaticParams', () => {
  it('generates a static param for every named bundle, available or not', async () => {
    const params = await generateStaticParams();
    const slugs = params.map((p) => p.slug).sort();
    expect(slugs).toEqual(listBundles().map((b) => b.slug).sort());
  });
});

describe('BundlePage', () => {
  for (const bundle of listBundles()) {
    it(`renders ${bundle.slug} (availableToday: ${bundle.availableToday})`, async () => {
      const Page = await BundlePage({ params: Promise.resolve({ slug: bundle.slug }) });
      const { container } = render(Page);
      expect(screen.getAllByText(bundle.title).length).toBeGreaterThan(0);

      const buyButtons = screen.queryAllByText(`Buy for ${formatRupees(bundle.price)}`);
      if (bundle.availableToday) {
        expect(buyButtons.length).toBeGreaterThan(0);
      } else {
        expect(buyButtons.length).toBe(0);
        expect(container.innerHTML).toContain('Not available yet');
      }
    });
  }
});
