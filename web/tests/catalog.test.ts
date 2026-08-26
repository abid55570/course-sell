import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  listProducts as loadProducts,
  listBundles as loadBundles,
  listCategories as loadCategories,
  listFeatured as loadFeatured,
  getPricingLadder,
  groupProductsByCategory,
  type ProductSlug,
  type Product,
  type Category,
} from '@/lib/catalog';

/**
 * This suite asserts on catalog DATA — that every product has a disclaimer,
 * that pairings resolve, that no category invents a colour — not on the read
 * path that fetches it. The accessors are async now that the catalog lives in
 * the database, so the whole catalog is resolved once here, through the real
 * accessors, and the assertions below stay synchronous.
 *
 * The read path itself is covered by tests/catalog-loader.test.ts.
 */
const [ALL_PRODUCTS, ALL_BUNDLES, ALL_CATEGORIES, ALL_FEATURED, PRICING_LADDER] = await Promise.all([
  loadProducts(),
  loadBundles(),
  loadCategories(),
  loadFeatured(),
  getPricingLadder(),
]);

const listProducts = () => ALL_PRODUCTS;
const listBundles = () => ALL_BUNDLES;
const listCategories = () => ALL_CATEGORIES;
const listFeatured = () => ALL_FEATURED;
const getProduct = (slug: string) => ALL_PRODUCTS.find((p) => p.slug === slug);
const getBundle = (slug: string) => ALL_BUNDLES.find((b) => b.slug === slug);
const listProductsByCategory = (slug: string) => ALL_PRODUCTS.filter((p) => p.category.slug === slug);
const getPairFor = (slug: string) => {
  const product = getProduct(slug);
  return product?.pairSlug ? getProduct(product.pairSlug) : undefined;
};
const getSetFor = (slug: string) => {
  const product = getProduct(slug);
  return product?.setSlug ? getProduct(product.setSlug) : undefined;
};

// Renamed from ALL_SLUGS: the catalog now holds 84 products (the six launch
// "OS" systems below plus 75 imported guides + their 3 full-set products —
// see tests further down for those). This constant still names only the six
// launch products, since the tests using it check launch-product-specific
// content (module page counts, per-product compliance phrases) that doesn't
// apply to the new guide families.
const LAUNCH_SLUGS: ProductSlug[] = ['glow-up-os', 'aura-os', 'money-os', 'social-os', 'study-os', 'career-os'];

/** The 75 imported guide slugs plus their 3 full-set products, in catalog order. */
/**
 * The three imported guide families, derived from their categories rather than
 * by excluding everything else.
 *
 * This used to be "any product that is not a launch product", which quietly
 * asserted that every product added in future would be a ₹499 guide. It broke
 * the moment the pipeline products were listed, and would have broken again on
 * the next batch. Naming the families means new products land outside it by
 * default, which is the correct behaviour.
 */
const GUIDE_FAMILY_CATEGORIES = ['character-guides', 'talking-to-your-parents', 'the-ten-series'];

const IMPORTED_SLUGS: ProductSlug[] = listProducts()
  .filter((p) => GUIDE_FAMILY_CATEGORIES.includes(p.category.slug))
  .map((p) => p.slug);

/** Everything built in Dashrize-Products/PRODUCT-PIPELINE and listed later. */
const PIPELINE_SLUGS: ProductSlug[] = listProducts()
  .filter(
    (p) =>
      !LAUNCH_SLUGS.includes(p.slug) &&
      !GUIDE_FAMILY_CATEGORIES.includes(p.category.slug) &&
      p.category.slug !== 'the-scam-files'
  )
  .map((p) => p.slug);

/** The Scam Files family: eight ₹499 guides plus the ₹1,999 set. */
const SCAM_FILES_SLUGS: ProductSlug[] = listProducts()
  .filter((p) => p.category.slug === 'the-scam-files')
  .map((p) => p.slug);

/** Product-specific phrases the compliance rules require inside the disclaimer text. */
const REQUIRED_DISCLAIMER_PHRASES: Record<ProductSlug, string[]> = {
  // Glow-Up / Aura — no medical advice; point to doctors and dermatologists.
  'glow-up-os': ['not medical advice', 'doctor', 'dermatologist'],
  'aura-os': ['not medical advice', 'doctor', 'dermatologist'],
  // Money OS — no earnings claims, no income screenshots, ever.
  'money-os': ['No earnings are promised', 'not financial'],
  // Social OS — no pickup-artist framing, ever.
  'social-os': ['not psychological', 'medical or therapeutic advice'],
  // Study OS — no rank, score or selection claims, ever. Tele-MANAS helpline required.
  'study-os': ['no rank, score', '14416'],
  // Career OS — no job, placement or salary guarantees, ever. Cybercrime helpline required.
  'career-os': ['no job, interview, salary or outcome is promised', '1930'],
};

function productImageDir(slug: string) {
  return path.join(process.cwd(), 'public', 'products', slug);
}

function bundleImageDir(slug: string) {
  return path.join(process.cwd(), 'public', 'bundles', slug);
}

describe('catalog products', () => {
  it('accounts for every product across the four families, with no overlap', () => {
    const products = listProducts();
    // 75 individual guides (40 character + 12 parents + 23 ten-series) + 3
    // full-set products (Codex, parents set, ten-series set) = 78 imports.
    expect(IMPORTED_SLUGS).toHaveLength(78);
    // 10 core products at ₹999 + 8 tripwires at ₹299 (PRODUCT-PIPELINE).
    expect(PIPELINE_SLUGS).toHaveLength(18);
    // 8 guides at ₹499 + the ₹1,999 set.
    expect(SCAM_FILES_SLUGS).toHaveLength(9);
    expect(products).toHaveLength(
      LAUNCH_SLUGS.length + IMPORTED_SLUGS.length + PIPELINE_SLUGS.length + SCAM_FILES_SLUGS.length
    );
    const slugs = new Set(products.map((p) => p.slug));
    expect(slugs).toEqual(
      new Set([...LAUNCH_SLUGS, ...IMPORTED_SLUGS, ...PIPELINE_SLUGS, ...SCAM_FILES_SLUGS])
    );
    // No duplicate slugs across the whole catalog.
    expect(slugs.size).toBe(products.length);
  });

  it.each(LAUNCH_SLUGS)('getProduct(%s) resolves the same product', (slug) => {
    const product = getProduct(slug);
    expect(product).toBeDefined();
    expect(product?.slug).toBe(slug);
  });

  it('returns undefined for an unknown slug', () => {
    expect(getProduct('not-a-real-product')).toBeUndefined();
  });

  it.each(LAUNCH_SLUGS)('%s has a non-empty, sectioned long description', (slug) => {
    const product = getProduct(slug)!;
    expect(product.longDescription.length).toBeGreaterThan(0);
    for (const section of product.longDescription) {
      expect(section.heading.trim().length).toBeGreaterThan(0);
      expect(section.paragraphs.length).toBeGreaterThan(0);
      for (const paragraph of section.paragraphs) {
        expect(paragraph.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it.each(LAUNCH_SLUGS)('%s has at least one FAQ entry', (slug) => {
    const product = getProduct(slug)!;
    expect(product.faqs.length).toBeGreaterThan(0);
    for (const faq of product.faqs) {
      expect(faq.question.trim().length).toBeGreaterThan(0);
      expect(faq.answer.trim().length).toBeGreaterThan(0);
    }
  });

  it.each(LAUNCH_SLUGS)('%s is priced at ₹999, the original single-OS-product price', (slug) => {
    const product = getProduct(slug)!;
    expect(product.price).toBe(999);
  });

  // PRICING_LADDER.single used to just BE 999 (every launch product's own
  // price, restated as a constant). It no longer can be: the ₹499 guides
  // imported alongside this test file are now the catalog's real floor, so
  // `single` is computed from actual catalog data (see lib/catalog/index.ts)
  // instead of staying a hardcoded, driftable copy of "999".
  it('PRICING_LADDER.single is the real catalog-wide minimum price, not the launch products’ fixed ₹999', () => {
    const min = Math.min(...listProducts().map((p) => p.price));
    expect(PRICING_LADDER.single).toBe(min);
    // 30 Days of Focus is the first Rs 299 tripwire, so it is the new floor.
    // This is exactly why `single` is computed rather than hardcoded.
    expect(PRICING_LADDER.single).toBe(299);
    expect(PRICING_LADDER.single).toBeLessThan(999);
  });

  it('carries an anchor/value price only where the listing text gives one (Glow-Up OS, Aura OS)', () => {
    expect(getProduct('glow-up-os')!.anchorPrice).toBe(1797);
    expect(getProduct('aura-os')!.anchorPrice).toBe(1797);
    for (const slug of ['money-os', 'social-os', 'study-os', 'career-os'] as ProductSlug[]) {
      expect(getProduct(slug)!.anchorPrice).toBeUndefined();
    }
  });

  it.each(LAUNCH_SLUGS)('%s module page counts sum to the listed page count', (slug) => {
    const product = getProduct(slug)!;
    const sum = (product.modules ?? []).reduce((total, m) => total + m.pageCount, 0);
    expect(sum).toBe(product.pageCount!);
  });

  it.each(LAUNCH_SLUGS)('%s has a non-empty disclaimer', (slug) => {
    const product = getProduct(slug)!;
    expect(product.disclaimer!.trim().length).toBeGreaterThan(0);
  });

  it.each(LAUNCH_SLUGS)('%s disclaimer carries its required compliance phrases verbatim', (slug) => {
    const product = getProduct(slug)!;
    for (const phrase of REQUIRED_DISCLAIMER_PHRASES[slug]) {
      expect(product.disclaimer!.toLowerCase()).toContain(phrase.toLowerCase());
    }
  });

  it('Study OS disclaimer carries the Tele-MANAS helpline', () => {
    const product = getProduct('study-os')!;
    expect(product.helplines!.some((h) => h.name === 'Tele-MANAS' && h.number === '14416')).toBe(true);
  });

  it('Career OS disclaimer carries the cybercrime helpline', () => {
    const product = getProduct('career-os')!;
    expect(product.helplines!.some((h) => h.number === '1930')).toBe(true);
  });

  it.each(LAUNCH_SLUGS)('%s every referenced gallery image exists on disk', (slug) => {
    const product = getProduct(slug)!;
    expect(product.gallery.length).toBeGreaterThan(0);
    const dir = productImageDir(slug);
    for (const image of product.gallery) {
      const filePath = path.join(dir, image.filename);
      expect(fs.existsSync(filePath), `missing ${filePath}`).toBe(true);
    }
  });

  it.each(LAUNCH_SLUGS)('%s cover image is listed first in the gallery', (slug) => {
    const product = getProduct(slug)!;
    expect(product.gallery[0].role).toBe('cover');
  });
});

describe('catalog pairs', () => {
  it('pairs Glow-Up OS with Social OS', () => {
    expect(getPairFor('glow-up-os')?.slug).toBe('social-os');
  });

  it('pairs Social OS back with Glow-Up OS', () => {
    expect(getPairFor('social-os')?.slug).toBe('glow-up-os');
  });

  it('pairs Money OS with Career OS', () => {
    expect(getPairFor('money-os')?.slug).toBe('career-os');
  });

  it('pairs Career OS back with Money OS (its bundle-backed pairing)', () => {
    expect(getPairFor('career-os')?.slug).toBe('money-os');
  });

  it('pairs Study OS with Career OS', () => {
    expect(getPairFor('study-os')?.slug).toBe('career-os');
  });

  it('pairs Aura OS with Glow-Up OS', () => {
    expect(getPairFor('aura-os')?.slug).toBe('glow-up-os');
  });

  it('returns undefined for an unknown slug', () => {
    expect(getPairFor('not-a-real-product')).toBeUndefined();
  });
});

describe('catalog bundles', () => {
  it('loads all six named bundles', () => {
    expect(listBundles()).toHaveLength(6);
  });

  it('Everything Bundle is priced at the all-six ladder rung (₹2,999) and contains all six products', () => {
    const bundle = getBundle('everything-bundle')!;
    expect(bundle.price).toBe(PRICING_LADDER.allSix);
    expect(bundle.price).toBe(2999);
    expect(bundle.components).toHaveLength(6);
    expect(bundle.components.every((c) => c.inCatalog)).toBe(true);
    expect(bundle.availableToday).toBe(true);
  });

  it('The Complete Man is priced at the pair ladder rung (₹1,499) and contains Glow-Up OS + Social OS', () => {
    const bundle = getBundle('the-complete-man')!;
    expect(bundle.price).toBe(PRICING_LADDER.pair);
    expect(bundle.price).toBe(1499);
    const slugs = bundle.components.filter((c) => c.inCatalog).map((c) => c.slug);
    expect(slugs.sort()).toEqual(['glow-up-os', 'social-os']);
    expect(bundle.availableToday).toBe(true);
  });

  it.each(['the-complete-woman', 'the-discipline-bundle', 'the-earner-bundle', 'the-student-bundle'] as const)(
    '%s resolves every component to a real catalog product and is sellable',
    (slug) => {
      const bundle = getBundle(slug)!;
      // These four sat at availableToday: false while their ZIPs were already
      // complete, because the component products had never been listed.
      expect(bundle.components.every((c) => c.inCatalog)).toBe(true);
      expect(bundle.availableToday).toBe(true);
      for (const component of bundle.components) {
        expect(getProduct(component.slug as string), `${slug} -> ${component.label}`).toBeDefined();
      }
    },
  );

  it('every bundle has a non-empty disclaimer', () => {
    for (const bundle of listBundles()) {
      expect(bundle.disclaimer.trim().length).toBeGreaterThan(0);
    }
  });

  it('every bundle cover image exists on disk', () => {
    for (const bundle of listBundles()) {
      const filePath = path.join(bundleImageDir(bundle.slug), bundle.coverImage.filename);
      expect(fs.existsSync(filePath), `missing ${filePath}`).toBe(true);
    }
  });

  it('returns undefined for an unknown bundle slug', () => {
    expect(getBundle('not-a-real-bundle')).toBeUndefined();
  });
});

describe('catalog product metadata fields (open-catalog additions)', () => {
  it.each(LAUNCH_SLUGS)('%s carries a format, a fileCount derived from deliveryFiles, and a category', (slug) => {
    const product = getProduct(slug)!;
    expect(product.format).toBe('PDF');
    expect(product.fileCount).toBe(product.deliveryFiles.length);
    expect(product.category.slug.length).toBeGreaterThan(0);
    expect(product.category.label.length).toBeGreaterThan(0);
    expect(product.category.accent.hex).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('leaves fileSizeLabel undefined rather than guessing, for every launch product', () => {
    for (const slug of LAUNCH_SLUGS) {
      expect(getProduct(slug)!.fileSizeLabel).toBeUndefined();
    }
  });
});

describe('catalog categories', () => {
  it('derives every category in catalog order, launch first and newest last', () => {
    const categories = listCategories();
    expect(categories.map((c) => c.slug)).toEqual([
      'self-improvement',
      'money-and-career',
      'study-skills',
      'character-guides',
      'talking-to-your-parents',
      'the-ten-series',
      'the-scam-files',
    ]);
  });

  it('every category label and accent is non-empty and every product\'s category is one of listCategories()', () => {
    const categories = listCategories();
    for (const c of categories) {
      expect(c.label.trim().length).toBeGreaterThan(0);
      expect(c.accent.hex).toMatch(/^#[0-9a-f]{6}$/i);
    }
    for (const product of listProducts()) {
      expect(categories.some((c) => c.slug === product.category.slug)).toBe(true);
    }
  });

  it('groups every catalog product into its category with none left over and none duplicated', () => {
    const categories = listCategories();
    const total = categories.reduce((sum, c) => sum + listProductsByCategory(c.slug).length, 0);
    expect(total).toBe(listProducts().length);
  });

  it('listProductsByCategory(character-guides) returns all 40 guides plus the Codex set (41)', () => {
    expect(listProductsByCategory('character-guides')).toHaveLength(41);
  });

  it('listProductsByCategory(talking-to-your-parents) returns all 12 guides plus the full set (13)', () => {
    expect(listProductsByCategory('talking-to-your-parents')).toHaveLength(13);
  });

  it('listProductsByCategory(the-ten-series) returns all 23 guides plus the full set (24)', () => {
    expect(listProductsByCategory('the-ten-series')).toHaveLength(24);
  });

  // These assert membership rather than an exact list: every product added to
  // a category would otherwise break an equality check that is not what the
  // test is actually about. The exhaustive accounting lives in the
  // "accounts for every product" test above.
  it.each([
    ['self-improvement', ['glow-up-os', 'aura-os', 'social-os', 'skin-os', 'sleep-os', '30-days-of-focus', 'home-workout-os', 'gym-beginner-os']],
    ['money-and-career', ['money-os', 'career-os', 'money-habits-os', 'creator-os', 'the-scam-shield']],
    ['study-skills', ['study-os', 'english-confidence-os', 'exam-sprint-os', 'presence-os']],
    ['the-scam-files', ['the-scam-files', 'the-digital-arrest-scam', 'upi-and-otp-fraud']],
  ] as const)('listProductsByCategory(%s) contains its known products', (category, expected) => {
    const slugs = listProductsByCategory(category).map((p) => p.slug);
    for (const slug of expected) {
      expect(slugs, `${category} should contain ${slug}`).toContain(slug);
    }
    // And every product it returns really does declare that category.
    for (const product of listProductsByCategory(category)) {
      expect(product.category.slug).toBe(category);
    }
  });

  it.each([
    ['skin-os', ['not medical advice', 'dermatologist', 'steroid']],
    ['sleep-os', ['not medical advice', 'doctor', '14416']],
    // The BRIEF marks Money Habits OS the most compliance-sensitive product in
    // the catalogue: financial-literacy framing only, no product ever named, no
    // returns figure, everything routed to a SEBI-registered adviser and a CA.
    ['money-habits-os', ['not investment', 'sebi-registered', 'chartered accountant', 'does not recommend any specific investment']],
    ['english-confidence-os', ['does not guarantee fluency', 'indian english is a legitimate form of english']],
    ['30-days-of-focus', ['not psychological', '14416']],
  ] as const)('%s disclaimer carries its required compliance phrases', (slug, phrases) => {
    const product = getProduct(slug)!;
    expect(product.disclaimer).toBeDefined();
    for (const phrase of phrases) {
      expect(product.disclaimer!.toLowerCase()).toContain(phrase.toLowerCase());
    }
  });

  it('money-habits-os names no specific investment product anywhere in its copy', () => {
    const product = getProduct('money-habits-os')!;
    const allCopy = [
      product.tagline,
      product.disclaimer ?? '',
      ...product.bulletPoints,
      ...product.longDescription.flatMap((sec) => [sec.heading, ...sec.paragraphs]),
      ...product.faqs.flatMap((f) => [f.question, f.answer]),
      ...(product.modules ?? []).flatMap((m) => [m.title, ...m.highlights]),
    ].join(' ').toLowerCase();
    // Naming a fund, an index or a broker would turn financial literacy into
    // financial advice, which is exactly what the BRIEF forbids.
    for (const forbidden of ['nifty', 'sensex', 'zerodha', 'groww', 'sip in ', 'index fund', 'guaranteed return']) {
      expect(allCopy, `must not mention "${forbidden}"`).not.toContain(forbidden);
    }
  });

  it('returns an empty array, not undefined, for an unknown category slug', () => {
    expect(listProductsByCategory('not-a-real-category')).toEqual([]);
  });
});

describe('catalog featured products', () => {
  it('lists exactly the curated featured products, one per category', () => {
    const featured = listFeatured();
    // The three launch picks, plus one flagship per family — each the
    // family's own "start here" recommendation from its listing copy
    // (Saitama, "Being Treated as an Adult", "What Your Screentime Costs
    // You" — see each product file's FAQ for the exact quote). The Scam
    // Files set is its family's flagship for the same reason: the listing
    // copy points buyers at the set over the individual guides.
    expect(featured.map((p) => p.slug).sort()).toEqual([
      'being-treated-as-an-adult-in-your-own-home',
      'glow-up-os',
      'how-to-be-like-saitama',
      'money-os',
      'study-os',
      'the-scam-files',
      'what-your-screentime-costs-you',
    ]);
    const featuredCategorySlugs = new Set(featured.map((p) => p.category.slug));
    expect(featuredCategorySlugs.size).toBe(listCategories().length);
  });
});

describe('catalog openness — a seventh product, in a seventh category', () => {
  // This suite is the point of Stage 1. `ProductSlug`, `BundleSlug` and
  // `CategorySlug` used to be closed six-literal unions — adding a
  // seventh product or a fourth category was a type error. They're now
  // plain `string`, so a fixture product with a slug and a category that
  // exist nowhere in lib/catalog/categories.ts or lib/catalog/products/
  // still type-checks. What matters is that it then behaves like a real
  // catalog entry everywhere a real product would: listing, category
  // grouping/filtering, and the kind of slug-to-params mapping
  // generateStaticParams performs for static page generation. Every
  // function exercised below (groupProductsByCategory, the slug-equality
  // filter listProductsByCategory itself uses) is the exact production
  // code path, not a test-only reimplementation, and none of it required
  // touching lib/catalog/index.ts, categories.ts or any component.
  const fixtureCategory: Category = {
    slug: 'zines',
    label: 'Zines',
    accent: { name: 'violet', hex: '#9c36b5' },
  };

  const fixtureProduct: Product = {
    slug: 'archive-zine-01',
    title: 'Archive Zine 01 — A Seventh Kind of Product',
    tagline:
      'A fixture product proving the catalog accepts a product and a category the six launch items never anticipated.',
    price: 249,
    pageCount: 12,
    trackerCount: 0,
    audience: 'catalog test fixture',
    accent: { name: 'violet', hex: '#9c36b5' },
    category: fixtureCategory,
    format: 'Zine',
    fileCount: 1,
    modules: [],
    longDescription: [
      { heading: 'Fixture', paragraphs: ['Exists only to prove the catalog is open, not a real product.'] },
    ],
    bulletPoints: ['Not a real product — a catalog-openness test fixture'],
    faqs: [{ question: 'Is this a real product?', answer: 'No. It exists only for tests/catalog.test.ts.' }],
    disclaimer: 'Test fixture disclaimer text.',
    helplines: [],
    tags: ['fixture'],
    gallery: [{ filename: 'fixture-cover.png', role: 'cover', alt: 'Fixture cover image.' }],
    deliveryFiles: ['fixture.pdf'],
  };

  it('type-checks with a slug and category slug outside every enumerated value (a closed union would fail to compile here)', () => {
    expect(fixtureProduct.slug).toBe('archive-zine-01');
    expect(fixtureProduct.category.slug).toBe('zines');
  });

  it('listing: joins an extended product list alongside the real catalog, undisturbed', () => {
    const realCount = listProducts().length;
    const extended = [...listProducts(), fixtureProduct];
    expect(extended).toHaveLength(realCount + 1);
    expect(extended).toContain(fixtureProduct);
    expect(listProducts()).toHaveLength(realCount); // the real catalog itself is untouched
  });

  it('category grouping: groupProductsByCategory surfaces the new category with no registration step', () => {
    const realCategoryCount = listCategories().length;
    const extended = [...listProducts(), fixtureProduct];
    const categories = groupProductsByCategory(extended);
    expect(categories).toHaveLength(realCategoryCount + 1); // the real categories + Zines
    expect(categories.map((c) => c.slug)).toContain('zines');
    expect(categories.find((c) => c.slug === 'zines')).toEqual(fixtureCategory);
  });

  it('category filtering: the same slug-equality predicate listProductsByCategory uses isolates exactly the fixture', () => {
    const extended = [...listProducts(), fixtureProduct];
    const byCategory = (list: Product[], slug: string) => list.filter((p) => p.category.slug === slug);
    expect(byCategory(extended, 'zines')).toEqual([fixtureProduct]);
    expect(byCategory(extended, 'study-skills')).not.toContain(fixtureProduct);
  });

  it('page generation: a generateStaticParams-style slug mapping includes the fixture unmodified', () => {
    const extended = [...listProducts(), fixtureProduct];
    const params = extended.map((p) => ({ slug: p.slug }));
    expect(params).toContainEqual({ slug: 'archive-zine-01' });
    expect(params).toHaveLength(listProducts().length + 1);
  });
});

describe('imported guide families (character-guides, talking-to-your-parents, the-ten-series)', () => {
  const SET_SLUGS = ['the-character-codex', 'talking-to-your-parents-full-set', 'the-ten-series-full-set'];
  const guideSlugs = IMPORTED_SLUGS.filter((slug) => !SET_SLUGS.includes(slug));

  it('has exactly 75 individual guides and 3 full-set products (78 imported SKUs)', () => {
    expect(guideSlugs).toHaveLength(75);
    expect(SET_SLUGS.every((slug) => IMPORTED_SLUGS.includes(slug))).toBe(true);
  });

  it.each(guideSlugs)('%s is a ₹499, 20-page, 3-tracker PDF with no cover image', (slug) => {
    const guide = getProduct(slug)!;
    expect(guide.price).toBe(499);
    expect(guide.pageCount).toBe(20);
    expect(guide.trackerCount).toBe(3);
    expect(guide.format).toBe('PDF');
    expect(guide.fileCount).toBe(1);
    expect(guide.fileCount).toBe(guide.deliveryFiles.length);
    // No cover art ships for any individual guide — only the family's set
    // does. This is the exact case CoverFallback exists for.
    expect(guide.gallery).toEqual([]);
  });

  it.each(guideSlugs)('%s has a non-empty tagline, FAQ and disclaimer, but no fabricated long-form copy', (slug) => {
    const guide = getProduct(slug)!;
    expect(guide.tagline.trim().length).toBeGreaterThan(0);
    expect(guide.faqs.length).toBeGreaterThan(0);
    expect(guide.disclaimer!.trim().length).toBeGreaterThan(0);
    // No per-guide long description or bullet list exists in the approved
    // listing copy for any of the three families — left genuinely absent
    // (empty arrays, which every relevant section already renders
    // conditionally around) rather than invented.
    expect(guide.longDescription).toEqual([]);
    expect(guide.bulletPoints).toEqual([]);
  });

  it.each(guideSlugs)('%s resolves back to its family\'s full-set product via getSetFor', (slug) => {
    const set = getSetFor(slug);
    expect(set, `getSetFor(${slug}) resolved nothing`).toBeDefined();
    expect(SET_SLUGS).toContain(set!.slug);
    expect(set!.category.slug).toBe(getProduct(slug)!.category.slug);
  });

  it.each(SET_SLUGS)('%s ships exactly one cover image, present on disk', (slug) => {
    const set = getProduct(slug)!;
    expect(set.gallery).toHaveLength(1);
    expect(set.gallery[0].role).toBe('cover');
    const filePath = path.join(productImageDir(slug), set.gallery[0].filename);
    expect(fs.existsSync(filePath), `missing ${filePath}`).toBe(true);
  });

  it('The Character Codex is priced at ₹2,999 (₹19,960 separately for 40 guides at ₹499)', () => {
    const codex = getProduct('the-character-codex')!;
    expect(codex.price).toBe(2999);
    expect(codex.anchorPrice).toBe(19960);
    expect(codex.pageCount).toBe(800);
    expect(codex.trackerCount).toBe(120);
  });

  it('Talking to Your Parents full set is priced at ₹1,999 (₹5,988 separately for 12 guides at ₹499)', () => {
    const set = getProduct('talking-to-your-parents-full-set')!;
    expect(set.price).toBe(1999);
    expect(set.anchorPrice).toBe(5988);
    expect(set.pageCount).toBe(240);
    expect(set.trackerCount).toBe(36);
  });

  it('The Ten Series full set is priced at ₹2,999 (₹11,477 separately for 23 guides at ₹499)', () => {
    const set = getProduct('the-ten-series-full-set')!;
    expect(set.price).toBe(2999);
    expect(set.anchorPrice).toBe(11477);
    expect(set.pageCount).toBe(460);
    expect(set.trackerCount).toBe(69);
  });

  it('every guide\'s anchor price equals guide count × ₹499, matching the listing copy\'s own "separately" figure', () => {
    for (const setSlug of SET_SLUGS) {
      const set = getProduct(setSlug)!;
      const guideCount = listProductsByCategory(set.category.slug).length - 1; // minus the set itself
      expect(set.anchorPrice).toBe(guideCount * 499);
    }
  });

  it('the three flagship guides are featured, matching each family\'s own "start here" recommendation', () => {
    expect(getProduct('how-to-be-like-saitama')!.featured).toBe(true);
    expect(getProduct('being-treated-as-an-adult-in-your-own-home')!.featured).toBe(true);
    expect(getProduct('what-your-screentime-costs-you')!.featured).toBe(true);
  });

  it('The Ten Series carries no helpline (the approved disclaimer names none), unlike the other two families', () => {
    expect(getProduct('the-ten-series-full-set')!.helplines).toEqual([]);
    expect(getProduct('10-ways-to-be-dangerously-disciplined')!.helplines).toEqual([]);
  });

  it('Talking to Your Parents carries all four crisis helplines from the approved disclaimer', () => {
    const numbers = getProduct('talking-to-your-parents-full-set')!.helplines!.map((h) => h.number).sort();
    expect(numbers).toEqual(['1098', '112', '14416', '181']);
  });
});
