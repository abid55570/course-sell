/**
 * Drops the cached catalog so an admin's edit shows up without a rebuild.
 *
 * api/routes/admin.js calls this after a successful catalog write. It is the
 * only reason the storefront can be both statically rendered and current: the
 * product pages are generated once and then re-generated on demand when this
 * fires, instead of hitting the database on every request.
 */
import { revalidateTag } from 'next/cache';

export async function POST(request: Request): Promise<Response> {
  const expected = process.env.REVALIDATE_SECRET;

  // Unset means refuse, never "allow anyone". An open revalidation endpoint is
  // a free cache-flush on demand for anyone who finds the URL, and the failure
  // mode is a storefront that rebuilds its catalog on every request.
  if (!expected) {
    return new Response('revalidation is not configured', { status: 503 });
  }

  if (request.headers.get('x-revalidate-secret') !== expected) {
    return new Response('unauthorized', { status: 401 });
  }

  // Two-argument form: the single-argument `revalidateTag(tag)` is deprecated
  // in Next 16 and expires the entry immediately, making the next request a
  // blocking cache miss. `'max'` marks it stale instead, so the next visitor
  // is served the old page while the new one is fetched behind them — which is
  // what Next's own docs recommend for a product catalog.
  revalidateTag('catalog', 'max');
  return new Response(null, { status: 204 });
}
