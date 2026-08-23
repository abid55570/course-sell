/**
 * Store-wide catalog configuration.
 *
 * The owner's support email is not finalised yet. The source listing copy in
 * `Dashrize-Products/*\/READ-ME-FIRST.txt` marks it as something to fill in
 * before publishing ("Add your support email — marked in the listing text
 * and START-HERE"), but the approved listing-copy-paste.md files themselves
 * never spell out a literal address — they only say "reply to this email" in
 * the delivery-email copy, which assumes whatever inbox sends that email.
 *
 * Rather than scatter a hardcoded address (or leave call sites guessing),
 * every place in the app that needs to show a support contact should import
 * SUPPORT_EMAIL from here. Replace this single value once the owner has a
 * real inbox, and every page/email picks it up automatically.
 */
export const SUPPORT_EMAIL = 'REPLACE_SUPPORT_EMAIL@dropdesk.example' as const;

/**
 * PRICING_LADDER used to live here as three hardcoded numbers straight off
 * Dashrize-Products/READ-ME-FIRST.txt (single 999 / pair 1499 / allSix
 * 2999). That was true when every product in the catalog cost exactly ₹999
 * — it stopped being true the moment the ₹499 character/parents/ten-series
 * guides joined the catalog, so "single" is now computed in index.ts from
 * the real catalog minimum instead of restated here as a second, driftable
 * copy of the number. See index.ts's PRICING_LADDER export for the
 * computation and lib/catalog build report for why this moved.
 *
 * config.ts can't compute it itself: doing so would mean importing the
 * product list here, and index.ts (which assembles that list) imports
 * SUPPORT_EMAIL from this file — a cycle. index.ts already has the full
 * product and bundle lists in scope, so the computation lives there.
 */
