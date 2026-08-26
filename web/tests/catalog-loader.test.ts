import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * The loader is the one place the storefront talks to the API, so it is also
 * the one place that can quietly turn a misconfigured backend into a
 * storefront with nothing in it. These tests pin the loud failures.
 *
 * This suite deliberately does NOT use the global loader stub from
 * tests/setup/catalog-fixture.ts — it is testing the real loader — so it
 * unmocks that path first.
 */
vi.unmock('@/lib/catalog/loader');

const FIXTURE = {
  products: [
    { slug: 'a', title: 'A', tagline: 'ta', price: 499, tags: [] },
    { slug: 'b', title: 'B', tagline: 'tb', price: 999, tags: [] },
  ],
  bundles: [{ slug: 'the-complete-man', title: 'CM', tagline: 't', price: 1499 }],
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('loadCatalog', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches the storefront endpoint and returns its payload', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(FIXTURE)));
    const { loadCatalog } = await import('@/lib/catalog/loader');
    const catalog = await loadCatalog();

    expect(catalog.products).toHaveLength(2);
    expect(catalog.bundles).toHaveLength(1);
    const url = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('/api/catalog/storefront');
  });

  it('tags the fetch so a write on the API side can revalidate it', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(FIXTURE)));
    const { loadCatalog } = await import('@/lib/catalog/loader');
    await loadCatalog();

    const init = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1] as {
      next?: { tags?: string[] };
    };
    expect(init.next?.tags).toContain('catalog');
  });

  it('throws on a non-OK response rather than returning an empty store', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })));
    const { loadCatalog } = await import('@/lib/catalog/loader');
    await expect(loadCatalog()).rejects.toThrow(/catalog fetch failed: 500/);
  });

  it('throws on a 200 whose body is the wrong shape', async () => {
    // Not hypothetical: an older API build answers this path from
    // routes/catalog.js's `/:slug` handler and returns `{}` with a 200. That
    // once produced a successful build containing zero product pages.
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({})));
    const { loadCatalog } = await import('@/lib/catalog/loader');
    await expect(loadCatalog()).rejects.toThrow(/unexpected shape/);
  });

  it('throws when products is not an array', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ products: 'nope', bundles: [] })));
    const { loadCatalog } = await import('@/lib/catalog/loader');
    await expect(loadCatalog()).rejects.toThrow(/unexpected shape/);
  });

  it('throws when bundles is missing entirely', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ products: FIXTURE.products })));
    const { loadCatalog } = await import('@/lib/catalog/loader');
    await expect(loadCatalog()).rejects.toThrow(/unexpected shape/);
  });

  it('throws on an empty catalog, naming the command that fixes it', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ products: [], bundles: [] })));
    const { loadCatalog } = await import('@/lib/catalog/loader');
    await expect(loadCatalog()).rejects.toThrow(/migrate:catalog/);
  });

  it('accepts an empty bundle list, which is a real state', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ products: FIXTURE.products, bundles: [] })));
    const { loadCatalog } = await import('@/lib/catalog/loader');
    const catalog = await loadCatalog();
    expect(catalog.bundles).toEqual([]);
    expect(catalog.products).toHaveLength(2);
  });
});
