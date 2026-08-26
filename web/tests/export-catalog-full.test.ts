import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fixtureCatalog } from '@/lib/catalog/fixture-source';

/**
 * export-catalog.js has two consumers with different needs: the `courses`
 * mirror wants six trimmed fields, and catalog_products wants every field
 * verbatim. These tests pin both, because the trimmed shape is what the
 * legacy payment path still reads and breaking it silently breaks checkout
 * for the older product lines.
 */
function runExport(args: string[]): { products: Array<Record<string, unknown>>; bundles: Array<Record<string, unknown>> } {
  const script = path.join(process.cwd(), 'scripts', 'export-catalog.js');
  const out = execFileSync(process.execPath, [script, ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return JSON.parse(out);
}

describe('export-catalog --full', () => {
  const source = fixtureCatalog();

  it('exports every product and every bundle, including unavailable ones', () => {
    const full = runExport(['--full']);
    expect(full.products).toHaveLength(source.products.length);
    expect(full.bundles).toHaveLength(source.bundles.length);
    // --full carries every bundle regardless of availability. All six are
    // sellable now, but the export must not start filtering on that: the
    // storefront renders an unavailable bundle as "coming soon" rather than
    // hiding it, so the database has to hold it either way.
    expect(full.bundles).toHaveLength(source.bundles.length);
    expect(full.bundles.filter((b) => b.availableToday === false))
      .toHaveLength(source.bundles.filter((b) => !b.availableToday).length);
  });

  it('preserves each product verbatim, losing no field', () => {
    const bySlug = new Map(runExport(['--full']).products.map((p) => [p.slug as string, p]));
    for (const product of source.products) {
      expect(bySlug.get(product.slug)).toEqual(JSON.parse(JSON.stringify(product)));
    }
  });

  it('preserves each bundle verbatim, components included', () => {
    const bySlug = new Map(runExport(['--full']).bundles.map((b) => [b.slug as string, b]));
    for (const bundle of source.bundles) {
      expect(bySlug.get(bundle.slug)).toEqual(JSON.parse(JSON.stringify(bundle)));
    }
    // Every component resolves to a real product now that the pipeline
    // products are listed, so the export must carry their slugs, not nulls.
    const woman = bySlug.get('the-complete-woman') as { components: Array<{ slug: string | null }> };
    expect(woman.components.every((c) => typeof c.slug === 'string')).toBe(true);
  });

  it('keeps nested content that the flat mirror shape drops', () => {
    const glow = runExport(['--full']).products.find((p) => p.slug === 'glow-up-os')!;
    for (const key of ['modules', 'longDescription', 'faqs', 'gallery', 'category', 'accent', 'bulletPoints']) {
      expect(glow).toHaveProperty(key);
    }
  });

  it('leaves the default (seed) output at its six trimmed fields', () => {
    const seed = runExport([]);
    expect(Object.keys(seed.products[0]).sort()).toEqual(
      ['category', 'description', 'price', 'slug', 'tagline', 'title']
    );
    // The mirror only ever carried the bundles that are actually on sale —
    // which is now all of them.
    expect(seed.bundles).toHaveLength(source.bundles.filter((b) => b.availableToday).length);
  });
});
