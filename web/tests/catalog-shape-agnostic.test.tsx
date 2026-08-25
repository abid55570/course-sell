import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { formatRupees } from '@/lib/format';
import type { Product, Category } from '@/lib/catalog';

/**
 * The chrome (hero, browse page, category pages, product cards) used to
 * assume every product looked like the six launch "OS" items: numbered
 * modules, a page count, a tracker count, a title shaped "Name — descriptor".
 * A future product does not have to look like that at all — the owner's own
 * words are "so vague ... not only these products should be its point".
 *
 * This suite injects one deliberately un-OS-like product into the catalog
 * (no modules, no page count, no tracker count, no audience line, no
 * disclaimer, a plain title with no dash, a format other than "PDF") and
 * renders the real page components — the homepage, the browse page, the
 * product's own category page, and its own product page — to prove the
 * chrome degrades cleanly: no empty section headings, no literal
 * "undefined" in the output, and no "0 pages"/"0 trackers"/"0 files" where a
 * count should simply be absent.
 *
 * `@/lib/catalog` is mocked (keeping every real export via importOriginal,
 * only extending the product/category lists) so the six real products and
 * bundles are completely untouched — this never edits the six shipped
 * product data files, it only asks the real page and component code to
 * render one extra product they didn't anticipate.
 */

const { fixtureCategory, fixtureProduct } = vi.hoisted(() => {
  const fixtureCategory: Category = {
    slug: 'fixture-office-templates',
    label: 'Office Templates',
    accent: { name: 'orange', hex: '#e8590c' },
  };

  const fixtureProduct: Product = {
    slug: 'invoice-template-pack-fixture',
    title: 'Invoice Template Pack',
    tagline: 'Twelve ready-to-send invoice layouts for freelancers, delivered as editable spreadsheets.',
    price: 349,
    accent: { name: 'orange', hex: '#e8590c' },
    category: fixtureCategory,
    format: 'Spreadsheet',
    fileCount: 1,
    longDescription: [
      {
        heading: 'What you get',
        paragraphs: ['Twelve invoice layouts in one spreadsheet file, ready to duplicate and send.'],
      },
    ],
    bulletPoints: ['Twelve layouts in one file', 'Works in Sheets and Excel', 'No fonts to install'],
    faqs: [{ question: 'Does this need special software?', answer: 'No. It opens in Google Sheets or Excel.' }],
    tags: ['fixture', 'templates'],
    gallery: [{ filename: 'fixture-cover.png', role: 'cover', alt: 'Invoice Template Pack cover.' }],
    deliveryFiles: ['invoice-template-pack.xlsx'],
    // Deliberately absent, unlike every launch product: shortTitle,
    // anchorPrice, pageCount, trackerCount, audience, modules, disclaimer,
    // helplines, pairSlug, featured.
  };

  return { fixtureCategory, fixtureProduct };
});

vi.mock('@/lib/catalog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/catalog')>();
  const extendedProducts: Product[] = [...(await actual.listProducts()), fixtureProduct];

  return {
    ...actual,
    listProducts: () => extendedProducts,
    getProduct: (slug: string) => extendedProducts.find((p) => p.slug === slug),
    listCategories: () => actual.groupProductsByCategory(extendedProducts),
    listProductsByCategory: (slug: string) => extendedProducts.filter((p) => p.category.slug === slug),
  };
});

import Home from '@/app/page';
import ProductsPage from '@/app/products/page';
import CategoryPage from '@/app/category/[slug]/page';
import ProductPage from '@/app/p/[slug]/page';

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

/** No literal "undefined" and no zero-count label anywhere in the render. */
function expectNoBrokenCounts(container: HTMLElement) {
  expect(container.textContent).not.toContain('undefined');
  expect(container.textContent).not.toMatch(/\b0\s*(pages?|trackers?|files?)\b/i);
}

describe('a shape-agnostic product on the homepage', () => {
  // The homepage used to render every catalog product grouped by category
  // (including this fixture's own card, which the original version of this
  // test checked for directly). It no longer does — see app/page.tsx: with
  // 84 real products the full grouped grid became too large for a
  // homepage, so the homepage now shows a small curated "Featured" set
  // (this fixture isn't `featured`, so it doesn't appear there) plus a
  // CategoryNav grid linking to every category, including ones no launch
  // product anticipated. What this test checks now is that the fixture's
  // brand-new category still surfaces there, with a real count and a real
  // link — not that its card renders inline on the homepage itself (the
  // browse-page describe block below still covers that, unchanged, since
  // /products keeps listing every product).
  it("surfaces the fixture product's new category via the homepage's category-nav grid, with no broken counts", async () => {
    const { container } = render(await Home());
    expectNoBrokenCounts(container);

    const categoryLink = screen
      .getAllByRole('link')
      .find((link) => link.getAttribute('href') === `/category/${fixtureCategory.slug}`);
    expect(categoryLink, "no category-nav tile links to the fixture's category").toBeDefined();
    const tile = categoryLink as HTMLElement;
    expect(within(tile).getByText(fixtureCategory.label)).toBeDefined();
    expect(within(tile).getByText('1 product')).toBeDefined();
  });

  it('keeps the storefront chrome generic even with a non-OS product in the mix', async () => {
    // The real six products' own approved titles/taglines may legitimately
    // say "System" (e.g. Money OS's bracketed descriptor) -- that data is
    // untouched. What must be gone is the *chrome* assuming every product
    // has modules to read before paying, or is itself a "system".
    render(await Home());
    expect(screen.getByText('Pick a product')).toBeDefined();
    expect(screen.queryByText('Pick a system')).toBeNull();
    expect(screen.queryByText(/Read the modules before you pay/i)).toBeNull();
    expect(screen.queryByText('Numbered modules')).toBeNull();
    expect(screen.queryByText('Printable tracker pack')).toBeNull();
    expect(screen.queryByText(/Guides, systems and templates/i)).toBeNull();
  });
});

describe('a shape-agnostic product on the browse page', () => {
  it('lists the fixture under its own category with a real product count', async () => {
    const { container } = render(await ProductsPage());
    expectNoBrokenCounts(container);
    expect(screen.getAllByText(fixtureCategory.label).length).toBeGreaterThanOrEqual(2); // jump nav + section heading
    expect(screen.getByText(fixtureProduct.title)).toBeDefined();
  });
});

describe('a shape-agnostic product on its own category page', () => {
  it('renders the fixture category page with the fixture product and nothing broken', async () => {
    const Page = await CategoryPage({ params: Promise.resolve({ slug: fixtureCategory.slug }) });
    const { container } = render(Page);
    expectNoBrokenCounts(container);
    expect(screen.getAllByText(fixtureCategory.label).length).toBeGreaterThan(0);
    expect(screen.getByText(fixtureProduct.title)).toBeDefined();
    expect(screen.getByText(formatRupees(fixtureProduct.price))).toBeDefined();
    expect(screen.getByText('1 product in this category.')).toBeDefined();
  });
});

describe('a shape-agnostic product on its own product page', () => {
  it('renders with no empty "Module breakdown" or "Disclaimer" headings, no undefined, no stray "0"', async () => {
    const Page = await ProductPage({ params: Promise.resolve({ slug: fixtureProduct.slug }) });
    const { container } = render(Page);
    expectNoBrokenCounts(container);

    // No module content exists for this product, so the heading must not render at all.
    expect(screen.queryByText('Module breakdown')).toBeNull();
    // No disclaimer or helplines exist for this product, so the heading must not render at all.
    expect(screen.queryByText('Disclaimer')).toBeNull();

    // Title renders (top hero heading and bottom closing CTA both use it).
    expect(screen.getAllByText(fixtureProduct.title).length).toBeGreaterThan(0);

    // The top spec line has no pageCount or trackerCount to show, so it must
    // read as exactly the price -- no leading/trailing/doubled "·" leftover
    // from joining an array that had holes in it.
    expect(screen.getByText(formatRupees(fixtureProduct.price))).toBeDefined();

    // Generic FAQ framing, not "this system".
    expect(screen.getByText('Questions about this product.')).toBeDefined();
    expect(container.textContent).not.toMatch(/\bsystem\b/i);
    expect(container.textContent).not.toMatch(/\bmodule\b/i);

    // Tagline, bullet points and long description -- the parts of a product
    // page that *should* stay product-specific -- render normally.
    expect(screen.getByText(fixtureProduct.tagline)).toBeDefined();
    expect(screen.getByText('What you get')).toBeDefined();
    expect(screen.getByText(fixtureProduct.faqs[0].question)).toBeDefined();
  });
});
