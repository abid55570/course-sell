import ProductCard from './ProductCard';
import type { Product } from '@/lib/catalog';

/**
 * "You might also like" grid. Renders up to 6 sibling products so buyers on a
 * ₹29–99 reel-bundle page see how much more they could grab in the same visit,
 * without having to hunt back to the category grid.
 *
 * Passed a pre-filtered, pre-sorted list; the component is presentational.
 * When the list is empty (edge case: a product with no siblings), the section
 * is skipped entirely rather than rendering an empty header.
 */
export default function RelatedPicks({
  headline,
  eyebrow,
  products,
}: {
  headline: string;
  eyebrow: string;
  products: Product[];
}) {
  if (products.length === 0) return null;
  return (
    <section className="bg-canvas-2 px-5 py-14 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
          {eyebrow}
        </h2>
        <p className="mt-2 font-display text-2xl font-bold text-ink">{headline}</p>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
