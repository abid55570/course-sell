import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { BundleComponent } from '@/lib/catalog';
import type { Bundle, Product } from '@/lib/catalog';
import { formatRupees } from '@/lib/format';

/** A left-to-right gradient stripe of every in-catalog component's accent, or
 * a single flat accent when there is only one. Purely decorative. */
function stripeStyle(hexes: string[]): CSSProperties {
  if (hexes.length === 0) return { backgroundColor: 'var(--color-ink-soft)', opacity: 0.35 };
  if (hexes.length === 1) return { backgroundColor: hexes[0] };
  const stops = hexes.map((hex, i) => `${hex} ${(i / (hexes.length - 1)) * 100}%`).join(', ');
  return { backgroundImage: `linear-gradient(90deg, ${stops})` };
}

// Synchronous: a descendant of a page the test suite awaits at the top, so it
// takes its data already resolved rather than fetching it here.
// Each available bundle shows a "Save {amount}" chip when its separatePrice is
// genuinely larger than the bundle price — both figures come from catalog data.
export default function BundlesList({
  bundles,
  productsBySlug,
}: {
  bundles: Bundle[];
  productsBySlug: Map<string, Product>;
}) {

  return (
    <section className="band-leaders px-5 py-20 sm:py-24 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <h2 className="flex items-center gap-3 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
          Bundles
          <span aria-hidden="true" className="h-px flex-1 border-b border-dotted border-ink/25" />
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {bundles.map((bundle) => {
            const hexes = bundle.components
              .filter((c): c is Extract<BundleComponent, { inCatalog: true }> => c.inCatalog)
              .map((c) => productsBySlug.get(c.slug)?.accent.hex)
              .filter((hex): hex is string => Boolean(hex));
            const savings = bundle.separatePrice ? bundle.separatePrice - bundle.price : 0;

            return (
              <Link
                key={bundle.slug}
                href={`/bundle/${bundle.slug}`}
                className="group flex flex-col overflow-hidden border border-ink/15 bg-canvas shadow-[0_14px_36px_-24px_rgba(11,16,32,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span
                  aria-hidden="true"
                  className="block h-2 w-full"
                  style={bundle.availableToday ? stripeStyle(hexes) : { backgroundColor: 'var(--color-ink-soft)', opacity: 0.3 }}
                />
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h3 className="font-display text-xl font-bold leading-tight text-ink sm:text-2xl">
                      {bundle.title}
                    </h3>
                    {!bundle.availableToday ? (
                      <span className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-soft">
                        Not available yet
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-ink-soft">{bundle.tagline}</p>

                  <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-soft">
                    {bundle.components.map((c) => (
                      <li key={c.label} className="flex items-center gap-1.5">
                        <span
                          aria-hidden="true"
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor: c.inCatalog ? productsBySlug.get(c.slug)?.accent.hex : 'var(--color-ink-soft)',
                          }}
                        />
                        {c.label}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto flex flex-wrap items-end justify-between gap-x-4 gap-y-2 pt-4">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-display text-3xl font-bold text-ink">{formatRupees(bundle.price)}</span>
                      {bundle.separatePrice ? (
                        <span className="font-mono text-xs text-ink-soft">
                          {formatRupees(bundle.separatePrice)} separately
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      {savings > 0 ? (
                        <span className="inline-block rounded bg-primary/10 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">
                          Save {formatRupees(savings)}
                        </span>
                      ) : null}
                      <span className="shrink-0 font-mono text-xs font-semibold uppercase tracking-wide text-ink group-hover:text-primary">
                        {bundle.availableToday ? 'Open bundle →' : "See what's inside →"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
