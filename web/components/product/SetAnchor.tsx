import type { Product } from '@/lib/catalog';

import { formatRupees } from '@/lib/format';
import ProductCard from './ProductCard';

/**
 * Shown on a guide's own page when it belongs to a larger set (one
 * character guide pointing at "The Character Codex", and so on) — the
 * "buy this alone or get the whole set" comparison the three imported
 * listing files all ask for. Unlike CrossSell (which pairs two *different*
 * top-level products at the fixed PRICING_LADDER.pair rung), a set anchor
 * compares two real, arbitrary prices read straight off the two catalog
 * records: this guide's own price and the set's own price. Nothing here is
 * a computed discount or an invented comparison figure.
 */
export default function SetAnchor({ guide, set, guideCount }: { guide: Product; set: Product; guideCount: number }) {
  // Every product in the set's category except the set product itself is a
  // guide in that set — real catalog data, not a hardcoded "40".

  return (
    <div className="border-t border-ink/10 pt-8">
      <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
        Part of {set.title.split(' — ')[0]}
      </h3>
      <p className="mt-2 text-sm text-ink-soft">
        This guide alone costs {formatRupees(guide.price)}. All {guideCount}, together, cost{' '}
        {formatRupees(set.price)}.
      </p>
      <div className="mt-5 max-w-[240px]">
        <ProductCard product={set} />
      </div>
    </div>
  );
}
