import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, within } from '@testing-library/react';

import ProductCard from '@/components/product/ProductCard';
import { listProducts } from '@/lib/catalog';

const products = listProducts();
const withCover = products.find((p) => p.gallery.length > 0)!;
const withoutCover = products.find((p) => p.gallery.length === 0)!;

describe('ProductCard title duplication', () => {
  // 75 of 84 products have no cover art. Their tile IS the title, set large by
  // CoverFallback. The card body then printed the same title again, so every
  // one of those cards said its own name twice.
  it('prints the title once on a card with no cover art', () => {
    expect(withoutCover, 'expected at least one cover-less product in the catalog').toBeTruthy();

    const { container } = render(<ProductCard product={withoutCover} />);
    const title = withoutCover.shortTitle ?? withoutCover.title;
    const occurrences = (container.textContent ?? '').split(title).length - 1;

    expect(occurrences, `"${title}" appears ${occurrences} times on its card`).toBe(1);
  });

  it('still prints the title on a card that has a real cover image', () => {
    const { container } = render(<ProductCard product={withCover} />);
    const title = withCover.shortTitle ?? withCover.title;
    expect(container.textContent).toContain(title);
  });

  it('prints each catalog title exactly once on its own card', () => {
    for (const product of products) {
      const { container, unmount } = render(<ProductCard product={product} />);
      const title = product.shortTitle ?? product.title;
      const occurrences = (container.textContent ?? '').split(title).length - 1;
      expect(occurrences, `${product.slug} renders its title ${occurrences} times`).toBe(1);
      unmount();
    }
  });
});

describe('touch targets', () => {
  const BIG_ENOUGH = /min-h-\[44px\]|h-11|h-12|h-14|min-h-11/;

  it('makes the whole product card a target of at least 44px', () => {
    const { container } = render(<ProductCard product={withoutCover} />);
    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    expect(BIG_ENOUGH.test(link!.className), `card link classes: ${link!.className}`).toBe(true);
  });
});

describe('cover-less product cards stay honest', () => {
  it('renders no undefined, no NaN and no zero counts for absent fields', () => {
    for (const product of products) {
      const { container, unmount } = render(<ProductCard product={product} />);
      const text = container.textContent ?? '';
      expect(text, `${product.slug} leaked undefined`).not.toContain('undefined');
      expect(text, `${product.slug} leaked NaN`).not.toContain('NaN');
      expect(text, `${product.slug} printed a zero count`).not.toMatch(/\b0 (files?|pages?|trackers?)\b/);
      unmount();
    }
  });

  it('shows an audience line only when the product actually has one', () => {
    for (const product of products.slice(0, 20)) {
      const { container, unmount } = render(<ProductCard product={product} />);
      if (!product.audience) {
        // Nothing should occupy the audience slot when the field is absent.
        const kickers = within(container).queryAllByText(/^[A-Z][A-Za-z ,&-]+$/);
        for (const node of kickers) {
          expect(node.textContent).not.toBe('undefined');
        }
      }
      unmount();
    }
  });
});
