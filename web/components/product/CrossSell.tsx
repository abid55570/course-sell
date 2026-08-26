import Link from 'next/link';
import type { Product } from '@/lib/catalog';
import type { Bundle } from '@/lib/catalog';
import { formatRupees } from '@/lib/format';
import ProductCard from './ProductCard';

/**
 * The partner product, and a bundle offer only when a real one exists.
 *
 * This block previously quoted `PRICING_LADDER.single * 2` as the "separately"
 * price. Once Rs 499 guides joined the catalog that constant became the
 * catalog-wide minimum, so every Rs 999 product page read "buy both for
 * Rs 1,499 instead of Rs 998" — advertising a bundle as Rs 501 more expensive
 * than buying the two products on their own, with a Rs 999 card rendered
 * directly beneath it.
 *
 * Two rules now hold. The separate total is the two products' own prices added
 * together, never a global constant. And a bundle is offered only when
 * `findPairBundle` returns one that is actually on sale AND that genuinely
 * costs less than buying the pair separately.
 */
export default function CrossSell({ product, pair, bundle }: { product: Product; pair: Product; bundle?: Bundle }) {
  const separately = product.price + pair.price;
  const saves = bundle ? separately - bundle.price : 0;

  return (
    <div className="border-t border-ink/10 pt-8">
      <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
        Pairs well with
      </h3>

      {bundle && saves > 0 ? (
        <p className="mt-2 text-sm text-ink-soft">
          Both together cost {formatRupees(bundle.price)} as{' '}
          <Link
            href={`/bundle/${bundle.slug}`}
            className="font-semibold text-primary underline decoration-2 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {bundle.title}
          </Link>
          , against {formatRupees(separately)} bought on their own. You save {formatRupees(saves)}.
        </p>
      ) : (
        <p className="mt-2 text-sm text-ink-soft">
          People who buy {product.shortTitle ?? product.title} tend to want this next.
        </p>
      )}

      <div className="mt-5 max-w-[240px]">
        <ProductCard product={pair} />
      </div>
    </div>
  );
}
