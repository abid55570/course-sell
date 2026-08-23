import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BundlePage, { generateStaticParams } from '@/app/bundle/[slug]/page';
import { listBundles } from '@/lib/catalog';
import { formatRupees } from '@/lib/format';

describe('generateStaticParams', () => {
  it('generates a static param for every named bundle, available or not', () => {
    const params = generateStaticParams();
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
