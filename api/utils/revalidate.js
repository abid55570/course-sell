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
 *
 * STOREFRONT_URL, not SITE_URL. The two are the same in production and differ
 * everywhere else: SITE_URL is the public address that goes into delivery
 * emails, so it has to be the real domain even while developing — which meant
 * revalidation was posting to the live site instead of the storefront actually
 * running, and admin edits appeared to save without ever reaching the page.
 * Falls back to SITE_URL, so a deploy that sets only that still works.
 */
async function revalidateStorefront() {
  const base = (process.env.STOREFRONT_URL || process.env.SITE_URL || '').replace(/\/$/, '');
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
