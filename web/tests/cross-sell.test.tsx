import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';

import CrossSell from '@/components/product/CrossSell';
import { getProduct, getPairFor, listProducts, findPairBundle } from '@/lib/catalog';

/**
 * The bug this guards against shipped to production and sat on the six
 * highest-traffic product pages: CrossSell quoted the "separately" price as
 * PRICING_LADDER.single * 2. When Rs 499 guides joined the catalog, `single`
 * became the catalog-wide minimum, so a Rs 999 product page advertised
 * "buy both for Rs 1,499 instead of Rs 998" — claiming the bundle cost Rs 501
 * MORE than buying separately, with a Rs 999 card rendered directly below.
 *
 * The invariant is simple and worth stating in a test rather than a comment:
 * a discount claim must never be arithmetically false.
 */
describe('CrossSell pair pricing', () => {
  function rupees(text: string): number[] {
    return [...text.matchAll(/₹([\d,]+)/g)].map((m) => Number(m[1].replace(/,/g, '')));
  }

  it('never advertises a bundle that costs more than buying the two separately', () => {
    for (const product of listProducts()) {
      const pair = getPairFor(product.slug);
      if (!pair) continue;

      const { container } = render(<CrossSell product={product} pair={pair} />);
      const text = container.textContent ?? '';
      const bundle = findPairBundle(product.slug, pair.slug);

      if (!bundle) {
        // No real bundle backs this pairing, so no price claim may be made.
        expect(
          text,
          `${product.slug} + ${pair.slug} has no purchasable bundle but quotes a saving`
        ).not.toMatch(/save/i);
        continue;
      }

      const separately = product.price + pair.price;
      expect(
        bundle.price,
        `${bundle.slug} costs ${bundle.price} but is offered against a separate total of ${separately}`
      ).toBeLessThan(separately);

      // Every rupee figure shown must be one of the two real numbers or the
      // real difference between them. A stray constant fails here.
      const allowed = new Set([bundle.price, separately, separately - bundle.price, product.price, pair.price]);
      for (const value of rupees(text)) {
        expect(allowed.has(value), `${product.slug}: unexplained figure ₹${value} in cross-sell copy`).toBe(true);
      }
    }
  });

  it('quotes the two products own prices, never a catalog-wide constant', () => {
    // Glow-Up + Social is the one pairing with a shipped bundle today.
    const product = getProduct('glow-up-os');
    const pair = getProduct('social-os');
    expect(product && pair).toBeTruthy();

    const { container } = render(<CrossSell product={product!} pair={pair!} />);
    const text = container.textContent ?? '';
    const separately = product!.price + pair!.price;

    expect(text).toContain(`₹${separately.toLocaleString('en-IN')}`);
    // The old bug printed 2 x the catalog minimum. Guard the specific wrong number.
    const catalogMin = Math.min(...listProducts().map((p) => p.price));
    if (catalogMin * 2 !== separately) {
      expect(text, 'cross-sell is quoting twice the catalog minimum again').not.toContain(
        `₹${(catalogMin * 2).toLocaleString('en-IN')}`
      );
    }
  });
});
