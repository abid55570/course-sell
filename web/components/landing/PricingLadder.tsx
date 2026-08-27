import type { Bundle } from '@/lib/catalog';
import { formatRupees } from '@/lib/format';

// The Everything Bundle and The Complete Man are real, shipped catalog
// records priced at exactly the "all six" and "any pair" ladder tiers — their
// `separatePrice` is genuine catalog data, not a number computed here. No
// other comparison figure is shown; nothing here is invented.
//
// These were module-level constants until the catalog became a database read.
// The tiers are built per render now, from values the component awaits.
// Synchronous: a descendant of a page the test suite awaits at the top.
export default function PricingLadder({
  paymentMode,
  pricingLadder,
  everythingBundle,
  pairBundle,
}: {
  paymentMode: 'razorpay' | 'whatsapp' | 'dev';
  pricingLadder: { single: number; pair: number; allSix: number };
  everythingBundle?: Bundle;
  pairBundle?: Bundle;
}) {

  // The Everything Bundle's component count is real catalog data (how many
  // products it actually contains today), not a hardcoded "six" — this label
  // keeps reading correctly if the bundle ever grows.
  const everythingCount = everythingBundle?.components.length ?? 0;
  const downloadLabel = paymentMode === 'whatsapp' ? 'Delivered by email' : 'Instant download';
  const pairTitle = pairBundle?.title?.split(' — ')[0] ?? 'Popular pair';
  const pairSavings = pairBundle?.separatePrice ? pairBundle.separatePrice - pricingLadder.pair : 0;

  const TIERS = [
  {
    label: 'From',
    price: pricingLadder.single,
    body: 'The lowest single-item price in the catalog. Bigger systems and full sets cost more.',
    includes: ['1 product', downloadLabel, 'Yours to keep'],
    separatePrice: undefined as number | undefined,
    favoured: false,
  },
  {
    label: 'Most popular pair',
    price: pricingLadder.pair,
    body: `${pairTitle} at ${formatRupees(pricingLadder.pair)} — save ${formatRupees(pairSavings)} versus buying the two products on their own.`,
    includes: [`${pairBundle?.components.length ?? 2} products`, downloadLabel, 'Yours to keep'],
    separatePrice: pairBundle?.separatePrice,
    favoured: true,
  },
  {
    label: `All ${everythingCount}`,
    price: pricingLadder.allSix,
    body: 'Every product in the catalog, plus every future release.',
    includes: [`${everythingCount} products`, downloadLabel, 'Future releases included'],
    separatePrice: everythingBundle?.separatePrice,
    favoured: false,
  },
  ];

  return (
    <section className="band-register px-5 py-20 sm:py-24 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">Pricing</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:items-stretch">
          {TIERS.map((tier) => (
            <div
              key={tier.label}
              className={
                tier.favoured
                  ? 'flex h-full flex-col gap-4 bg-ink px-7 py-10 text-white sm:shadow-[0_24px_60px_-20px_rgba(11,16,32,0.5)]'
                  : 'flex h-full flex-col gap-4 bg-canvas px-7 py-10 text-ink'
              }
            >
              <span
                className={`font-mono text-xs font-semibold uppercase tracking-[0.15em] ${
                  tier.favoured ? 'text-white/70' : 'text-ink-soft'
                }`}
              >
                {tier.label}
              </span>
              <span
                className={`font-display font-bold leading-none ${
                  'text-5xl sm:text-6xl'
                }`}
              >
                {formatRupees(tier.price)}
              </span>
              {tier.separatePrice ? (
                <span
                  className={`font-mono text-xs uppercase tracking-[0.1em] ${
                    tier.favoured ? 'text-white/60' : 'text-ink-soft'
                  }`}
                >
                  {formatRupees(tier.separatePrice)} separately
                </span>
              ) : null}
              {pairSavings > 0 && tier.favoured ? (
                <span className="inline-block w-fit rounded bg-white/15 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white">
                  You save {formatRupees(pairSavings)}
                </span>
              ) : null}
              <p className={tier.favoured ? 'text-white/80' : 'text-ink-soft'}>{tier.body}</p>
              <ul
                className={`mt-2 space-y-1.5 border-t pt-4 font-mono text-xs uppercase tracking-[0.1em] ${
                  tier.favoured ? 'border-white/15 text-white/70' : 'border-ink/10 text-ink-soft'
                }`}
              >
                {tier.includes.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
