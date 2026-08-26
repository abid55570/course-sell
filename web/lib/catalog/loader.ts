/**
 * The catalog's single read path.
 *
 * The storefront used to import 84 TypeScript product files directly. It reads
 * them from the API now, which reads `catalog_products` — so an admin's edit
 * shows up here without a rebuild, and the price this renders is the same row
 * the charge is computed from. Those two numbers used to come from different
 * tables, which is how a product could advertise one price and charge another.
 *
 * One fetch serves a whole render pass, tagged `catalog` so a write on the API
 * side can drop it (see app/api/revalidate/route.ts). The in-memory search
 * wants the entire list anyway, so loading it whole costs nothing extra.
 */
import type { Bundle, Product } from './types';
import { API_BASE } from '../env';

export type CatalogPayload = { products: Product[]; bundles: Bundle[] };

export async function loadCatalog(): Promise<CatalogPayload> {
  const res = await fetch(`${API_BASE}/api/catalog/storefront`, {
    next: { tags: ['catalog'], revalidate: 3600 },
  });

  if (!res.ok) {
    // Fail loudly. Returning an empty catalog here would build a storefront
    // with no products in it and nothing anywhere saying why.
    throw new Error(`catalog fetch failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as Partial<CatalogPayload> | null;

  // A 200 is not proof of the right payload. An older API build answers this
  // path from routes/catalog.js's `/:slug` handler and returns `{}` with a 200,
  // and `data.products ?? []` quietly turned that into an empty storefront —
  // a build that generated zero product pages and reported success. Check the
  // shape, not just the status.
  if (!data || !Array.isArray(data.products) || !Array.isArray(data.bundles)) {
    throw new Error(
      `catalog fetch returned an unexpected shape from ${API_BASE}/api/catalog/storefront ` +
        '(expected { products: [], bundles: [] }). Is the API running a build that has that route?'
    );
  }

  // An empty catalog is never a storefront worth shipping, and it is always a
  // misconfiguration rather than a real state: the products live in the
  // database, so zero rows means the migration has not run.
  if (data.products.length === 0) {
    throw new Error(
      'catalog fetch returned no products. Run `npm --prefix api run migrate:catalog` ' +
        'to load the catalog into catalog_products.'
    );
  }

  return { products: data.products, bundles: data.bundles };
}
