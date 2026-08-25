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
 *
 * Registered as a vitest setup file, so it applies before any test module is
 * imported. A test that wants different catalog data can still override this
 * with its own `vi.mock` of the same path.
 */
vi.mock('@/lib/catalog/loader', async () => {
  const { fixtureCatalog } = await import('@/lib/catalog/fixture-source');
  return {
    loadCatalog: async () => fixtureCatalog(),
  };
});
