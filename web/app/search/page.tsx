import type { Metadata } from 'next';
import Link from 'next/link';
import { listCategories } from '@/lib/catalog';
import { searchProducts } from '@/lib/search';
import ProductCard from '@/components/product/ProductCard';
import SearchBox from '@/components/search/SearchBox';

export const metadata: Metadata = {
  title: 'Search | Dropdesk',
  description: 'Search every product in the Dropdesk catalog.',
  robots: { index: false },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;
  const query = q.trim();
  const results = await searchProducts(query);
  const categories = await listCategories();

  return (
    <main className="bg-canvas px-5 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-3xl font-bold uppercase text-ink sm:text-4xl">Search</h1>

        <div className="mt-5 max-w-xl">
          <SearchBox defaultValue={query} size="lg" autoFocus={!query} />
        </div>

        {query ? (
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.15em] text-ink-soft">
            {results.length} {results.length === 1 ? 'result' : 'results'} for &ldquo;{query}&rdquo;
          </p>
        ) : (
          <p className="mt-4 max-w-xl text-sm text-ink-soft">
            Type part of a product name. Searching also matches a category, a format or a tag.
          </p>
        )}

        {query && results.length === 0 ? (
          <div className="mt-8 border-t border-ink/15 pt-8">
            <p className="text-ink">
              Nothing matches &ldquo;{query}&rdquo;. Try a shorter word, or start from a category.
            </p>
            <ul className="mt-5 flex flex-wrap gap-3">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="flex min-h-[44px] items-center gap-2 border border-ink/20 px-4 font-mono text-xs uppercase tracking-[0.1em] text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0"
                      style={{ backgroundColor: category.accent.hex }}
                    />
                    {category.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {results.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {results.map(({ product }) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
