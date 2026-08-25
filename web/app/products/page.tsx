import type { Metadata } from 'next';
import { listCategories, listProducts } from '@/lib/catalog';
import SearchBox from '@/components/search/SearchBox';
import ProductGrid from '@/components/product/ProductGrid';
import Footer from '@/components/landing/Footer';
import { getFooterData } from '@/lib/catalog/footer-data';

export async function generateMetadata(): Promise<Metadata> {
  const count = (await listProducts()).length;
  return {
    title: `All products (${count}) | Dropdesk`,
    description: `Every digital product Dropdesk sells, grouped by category. ${count} products, instant download.`,
  };
}

export default async function ProductsPage() {
  const footer = await getFooterData();
  const products = await listProducts();
  const categories = await listCategories();

  return (
    <main>
      <section className="bg-canvas px-5 pb-10 pt-24 sm:px-10 sm:pt-28 lg:px-12 lg:pt-32">
        <div className="mx-auto max-w-6xl">
          <h1 className="font-display text-4xl font-bold uppercase leading-[0.95] text-ink sm:text-5xl lg:text-6xl">
            All products
          </h1>
          <p className="mt-4 max-w-xl text-ink-soft">
            {products.length} products across {categories.length} categories. Every one ships instantly
            after payment.
          </p>

          <div className="mt-8 max-w-xl">
            <SearchBox size="lg" />
          </div>
        </div>
      </section>

      {categories.length > 0 ? (
        <nav
          aria-label="Jump to category"
          className="sticky top-14 z-30 border-y border-ink/15 bg-canvas"
        >
          <ul className="flex gap-2 overflow-x-auto px-5 py-2 sm:px-10 lg:px-12">
            {categories.map((category) => (
              <li key={category.slug} className="shrink-0">
                <a
                  href={`#${category.slug}`}
                  className="inline-flex min-h-[44px] items-center gap-2 border border-ink/15 px-4 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-ink hover:border-ink/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 shrink-0"
                    style={{ backgroundColor: category.accent.hex }}
                  />
                  {category.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <ProductGrid products={products} />

      <Footer {...footer} />
    </main>
  );
}
