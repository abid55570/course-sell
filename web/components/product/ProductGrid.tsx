import type { Product } from '@/lib/catalog';
import { groupProductsByCategory } from '@/lib/catalog';
import ProductCard from './ProductCard';

const TONE_BG = ['bg-canvas', 'bg-canvas-2'] as const;

/**
 * A scalable replacement for the old one-band-per-product layout: products
 * grouped by category, each category getting its own anchored section, a
 * header naming it and its real product count, and a responsive grid of
 * large-cover cards underneath. Works unchanged whether a category holds one
 * product or fifteen — the grid wraps, it doesn't grow new markup per item.
 * Section backgrounds alternate light tones by category position, purely
 * for rhythm, so a catalog of any size doesn't read as one flat slab.
 */
export default function ProductGrid({ products }: { products: Product[] }) {
  const categories = groupProductsByCategory(products);

  return (
    <div>
      {categories.map((category, i) => {
        const items = products.filter((p) => p.category.slug === category.slug);
        return (
          <section
            key={category.slug}
            id={category.slug}
            className={`px-5 py-16 sm:px-10 sm:py-20 lg:px-12 ${TONE_BG[i % TONE_BG.length]}`}
          >
            <div className="mx-auto max-w-6xl">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 border-t border-ink/10 pt-6">
                <span
                  aria-hidden="true"
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: category.accent.hex }}
                />
                <h2 className="font-display text-3xl font-bold uppercase leading-none text-ink sm:text-4xl">
                  {category.label}
                </h2>
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft">
                  {items.length} {items.length === 1 ? 'product' : 'products'}
                </span>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                {items.map((product) => (
                  <ProductCard key={product.slug} product={product} />
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
