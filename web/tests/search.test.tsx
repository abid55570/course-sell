import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { searchProducts, sortProducts, SORTS, priceTiers } from '@/lib/search';
import { listProducts as loadProducts } from '@/lib/catalog';
/**
 * The catalog accessors are async now that the catalog lives in the database.
 * This suite iterates the catalog at module scope, so it resolves it once here
 * with a top-level await and keeps its assertions synchronous. The read path
 * itself is covered by tests/catalog-loader.test.ts.
 */
const ALL_PRODUCTS = await loadProducts();
const listProducts = () => ALL_PRODUCTS;
import SearchBox from '@/components/search/SearchBox';

describe('searchProducts', () => {
  it('returns nothing for an empty or whitespace query, never everything', async () => {
    expect(await searchProducts('')).toEqual([]);
    expect(await searchProducts('   ')).toEqual([]);
  });

  it('finds a product from a single word inside a long title', async () => {
    const hits = (await searchProducts('bruce')).map((r) => r.product.title);
    expect(hits.some((t) => /bruce wayne/i.test(t))).toBe(true);
  });

  it('matches on a word prefix, so a partial word still finds it', async () => {
    const full = (await searchProducts('disciplined')).map((r) => r.product.slug);
    const partial = (await searchProducts('disciplin')).map((r) => r.product.slug);
    expect(partial.length).toBeGreaterThan(0);
    for (const slug of full) expect(partial).toContain(slug);
  });

  it('treats multiple words as AND, narrowing rather than widening', async () => {
    const one = await searchProducts('parents');
    const two = await searchProducts('parents money');
    expect(one.length).toBeGreaterThan(0);
    expect(two.length).toBeGreaterThan(0);
    expect(two.length).toBeLessThanOrEqual(one.length);
    expect(two[0].product.title.toLowerCase()).toContain('money');
  });

  it('ignores punctuation and case', async () => {
    const a = await searchProducts('glow-up');
    const b = await searchProducts('GLOW UP');
    expect(a.length).toBeGreaterThan(0);
    expect(a.map((r) => r.product.slug)).toEqual(b.map((r) => r.product.slug));
  });

  it('ranks a title match above an incidental category or tag match', async () => {
    // "money" appears in several titles and in the "Money & Career" category
    // label, so it exercises ranking rather than a single lucky hit.
    const results = await searchProducts('money');
    expect(results.length).toBeGreaterThan(1);
    expect(
      results[0].product.title.toLowerCase(),
      'the top hit for "money" should be a product with money in its title'
    ).toContain('money');

    // Anything whose title lacks the term ranks below everything that has it.
    const titled = results.filter((r) => r.product.title.toLowerCase().includes('money'));
    const untitled = results.filter((r) => !r.product.title.toLowerCase().includes('money'));
    if (untitled.length > 0) {
      const worstTitled = Math.min(...titled.map((r) => r.score));
      const bestUntitled = Math.max(...untitled.map((r) => r.score));
      expect(worstTitled).toBeGreaterThan(bestUntitled);
    }
  });

  it('returns nothing for a query that matches no product', async () => {
    expect(await searchProducts('zzzznotathing')).toEqual([]);
  });

  it('can find every product in the catalog by its own title', async () => {
    for (const product of listProducts()) {
      const hits = (await searchProducts(product.title)).map((r) => r.product.slug);
      expect(hits, `${product.slug} is unreachable by its own title`).toContain(product.slug);
    }
  });
});

describe('sorting', () => {
  it('offers no sort derived from popularity, which the store cannot know', async () => {
    for (const sort of SORTS) {
      expect(/popular|trend|best|top.?sell|most/i.test(sort.label)).toBe(false);
      expect(/popular|trend|best|top.?sell/i.test(sort.key)).toBe(false);
    }
  });

  it('sorts by price in both directions', async () => {
    const products = listProducts();
    const asc = sortProducts(products, 'price-asc').map((p) => p.price);
    const desc = sortProducts(products, 'price-desc').map((p) => p.price);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
  });

  it('leaves catalog order untouched', async () => {
    const products = listProducts();
    expect(sortProducts(products, 'catalog').map((p) => p.slug)).toEqual(products.map((p) => p.slug));
  });

  it('derives price tiers from prices actually in the catalog', async () => {
    const tiers = await priceTiers();
    const real = new Set(listProducts().map((p) => p.price));
    expect(tiers.length).toBeGreaterThan(0);
    for (const tier of tiers) expect(real.has(tier)).toBe(true);
    expect(tiers).toEqual([...tiers].sort((a, b) => a - b));
  });
});

describe('SearchBox', () => {
  it('is a labelled search input inside a form, so it works before hydration', async () => {
    render(<SearchBox />);
    const input = screen.getByRole('searchbox', { name: /search products/i });
    expect(input).toHaveAttribute('type', 'search');
    expect(input).toHaveAttribute('name', 'q');
    expect(input.closest('form')).toHaveAttribute('action', '/search');
  });

  it('ships no client JavaScript', async () => {
    const src = readFileSync(path.resolve(__dirname, '../components/search/SearchBox.tsx'), 'utf8');
    expect(src, 'SearchBox must stay a server component: a form needs no hydration').not.toContain(
      "'use client'"
    );
  });
});
