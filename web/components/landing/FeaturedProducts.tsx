import type { Product } from '@/lib/catalog';
import ProductCard from '@/components/product/ProductCard';

/**
 * A small, curated grid of `product.featured` items — one per category, the
 * same invariant tests/catalog.test.ts checks. Replaces the old homepage
 * behaviour of rendering every product grouped by category: that worked at
 * six products, but 84 products across nine categories turned the homepage
 * into a very long, very heavy page. This keeps the homepage light and
 * fast, and treats /products (the full browse page) as the place people go
 * to see everything — see CategoryNav for how the homepage points there.
 */
export default function FeaturedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section className="px-5 py-16 sm:px-10 sm:py-20 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 border-t border-ink/10 pt-6">
          <h2 className="font-display text-3xl font-bold uppercase leading-none text-ink sm:text-4xl">Featured</h2>
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft">
            One pick per category
          </span>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
