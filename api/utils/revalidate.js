/**
 * Tells the storefront its cached catalog is stale.
 *
 * The storefront renders product pages statically and re-generates them when
 * this fires, so without it an admin's edit would not appear until the cache
 * expired on its own an hour later.
 *
 * Best-effort by design: the save has already committed by the time this runs,
 * so a failed or unconfigured revalidation must not turn a successful save into
 * an error response. It warns and moves on.
 */
async function revalidateStorefront() {
  const base = (process.env.SITE_URL || '').replace(/\/$/, '');
  const secret = process.env.REVALIDATE_SECRET;
  if (!base || !secret) return { skipped: true };
  try {
    const res = await fetch(`${base}/api/revalidate`, {
      method: 'POST',
      headers: { 'x-revalidate-secret': secret },
    });
    if (!res.ok) {
      console.warn('storefront revalidation returned', res.status);
      return { ok: false, status: res.status };
    }
    return { ok: true };
  } catch (e) {
    console.warn('storefront revalidation failed', e.message);
    return { ok: false, error: e.message };
  }
}

module.exports = { revalidateStorefront };
