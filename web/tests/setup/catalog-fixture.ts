import { vi } from 'vitest';

/**
 * Serves the real TypeScript catalog to every test through the loader seam.
 *
 * The catalog's accessors read the database now, via `lib/catalog/loader`. That
 * would make the whole suite need a running API and a seeded Postgres, which is
 * the wrong trade for tests that are really about rendering and catalog shape.
 *
 * So the loader — the one function that talks to the API — is stubbed here, for
 * every test file at once, and answers from `lib/catalog/fixture-source`: the
 * same 84 products and 6 bundles the migration itself loads into the database.
 * Every existing assertion keeps its meaning, and no test file needs to know
 * the catalog moved.
 */
vi.mock('@/lib/catalog/loader', async () => {
  const { fixtureCatalog } = await import('@/lib/catalog/fixture-source');
  return {
    loadCatalog: async () => fixtureCatalog(),
  };
});

// IntersectionObserver is not available in jsdom. The StickyBuyBar component
// depends on it; without this stub every page render throws a ReferenceError.
class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

(globalThis as Record<string, unknown>).IntersectionObserver = MockIntersectionObserver;
