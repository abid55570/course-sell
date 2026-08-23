import { PRICING_LADDER, getBundle } from '@/lib/catalog';
import { formatRupees } from '@/lib/format';

// The Everything Bundle and The Complete Man are real, shipped catalog
// records priced at exactly the "all six" and "any pair" ladder tiers — their
// `separatePrice` is genuine catalog data, not a number computed here. No
// other comparison figure is shown; nothing here is invented.
const everythingBundle = getBundle('everything-bundle');
const pairBundle = getBundle('the-complete-man');

// The Everything Bundle's component count is real catalog data (how many
// products it actually contains today), not a hardcoded "six" — this label
// keeps reading correctly if the bundle ever grows.
const everythingCount = everythingBundle?.components.length ?? 0;

const TIERS = [
  {
    label: 'From',
    price: PRICING_LADDER.single,
    body: 'The lowest single-item price in the catalog. Bigger systems and full sets cost more.',
    includes: ['1 product', 'Instant download', 'Yours to keep'],
    separatePrice: undefined as number | undefined,
    favoured: false,
  },
  {
    label: 'Any pair',
    price: PRICING_LADDER.pair,
    body: 'Two products, your choice.',
    includes: ['2 products, your choice', 'Instant download', 'Yours to keep'],
    separatePrice: pairBundle?.separatePrice,
    favoured: true,
  },
  {
    label: `All ${everythingCount}`,
    price: PRICING_LADDER.allSix,
    body: 'Every launch product, plus everything released later.',
    includes: [`${everythingCount} products`, 'Instant download', 'Future releases included'],
    separatePrice: everythingBundle?.separatePrice,
    favoured: false,
  },
];

export default function PricingLadder() {
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
