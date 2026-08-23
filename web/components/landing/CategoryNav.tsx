import Link from 'next/link';
import type { Category } from '@/lib/catalog';
import { listProductsByCategory } from '@/lib/catalog';

/**
 * Every category as a linked tile: accent, label, a real product count, a
 * link to that category's own page. This is the homepage's answer to
 * "where did all the products go" once FeaturedProducts stopped showing
 * every item — nine categories fit on one screen far better than 84 product
 * cards would, and each tile hands the reader straight to the full list for
 * that category. /products remains the single page that lists everything at
 * once, for anyone who wants the whole catalog in one scroll.
 */
export default function CategoryNav({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="band-leaders px-5 py-16 sm:px-10 sm:py-20 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <h2 className="flex items-center gap-3 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
          Browse by category
          <span aria-hidden="true" className="h-px flex-1 border-b border-dotted border-ink/25" />
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const count = listProductsByCategory(category.slug).length;
            return (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="group flex flex-col gap-3 border border-ink/15 bg-canvas p-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span aria-hidden="true" className="h-2 w-10" style={{ backgroundColor: category.accent.hex }} />
                <h3 className="font-display text-xl font-bold text-ink sm:text-2xl">{category.label}</h3>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <span className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-ink-soft">
                    {count} {count === 1 ? 'product' : 'products'}
                  </span>
                  <span className="font-mono text-xs font-semibold uppercase tracking-wide text-ink group-hover:text-primary">
                    Browse →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
