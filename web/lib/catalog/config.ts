/**
 * Store-wide catalog configuration.
 *
 * The store's support inbox, on the Google Workspace account for dropdesk.in.
 * It appears on the footer, checkout, order, product, bundle, privacy, refunds,
 * terms and contact pages — every one of them imports it from here rather than
 * hardcoding an address, so it is changed in exactly one place.
 *
 * It must stay in step with SUPPORT_EMAIL in the repo-root .env, which is what
 * the API reports on /api/site-info. `npm run check:ready` verifies both.
 */
export const SUPPORT_EMAIL = 'support@dropdesk.in' as const;

/**
 * PRICING_LADDER used to live here as three hardcoded numbers straight off
 * Dashrize-Products/READ-ME-FIRST.txt (single 999 / pair 1499 / allSix
 * 2999). That was true when every product in the catalog cost exactly ₹999
 * — it stopped being true once guides at lower prices joined the catalog,
 * so "single" is now computed in index.ts from the real catalog minimum
 * instead of restated here as a second, driftable copy of the number. See
 * index.ts's getPricingLadder export for the computation and the catalog
 * build report for why this moved.
 *
 * config.ts can't compute it itself: doing so would mean importing the
 * product list here, and index.ts (which assembles that list) imports
 * SUPPORT_EMAIL from this file — a cycle. index.ts already has the full
 * product and bundle lists in scope, so the computation lives there.
 */
