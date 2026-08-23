export const API_BASE = process.env.API_BASE ?? 'http://localhost:4000';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/**
 * The API origin as seen from the browser. Next.js only inlines
 * NEXT_PUBLIC_-prefixed vars into client bundles, so the checkout and order
 * pages (both client components — they call the API directly, after the
 * user submits a form / on mount) read this instead of the server-only
 * API_BASE above, which would silently come back `undefined` in the browser.
 */
export const PUBLIC_API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? API_BASE;
