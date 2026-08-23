import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { listCategories, listProductsByCategory } from '@/lib/catalog';
import ProductCard from '@/components/product/ProductCard';
import Footer from '@/components/landing/Footer';

export function generateStaticParams() {
  return listCategories().map((c) => ({ slug: c.slug }));
}

function getCategory(slug: string) {
  return listCategories().find((c) => c.slug === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};

  const count = listProductsByCategory(slug).length;
  return {
    title: `${category.label} | Dropdesk`,
    description: `${count} ${count === 1 ? 'product' : 'products'} in ${category.label} on Dropdesk.`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const products = listProductsByCategory(slug);

  return (
    <main>
      <section className="bg-canvas px-5 pb-10 pt-24 sm:px-10 sm:pt-28 lg:px-12 lg:pt-32">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/products"
            className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft hover:text-ink"
          >
            ← All products
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span
              aria-hidden="true"
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: category.accent.hex }}
            />
            <h1 className="font-display text-4xl font-bold uppercase leading-[0.95] text-ink sm:text-5xl lg:text-6xl">
              {category.label}
            </h1>
          </div>
          <p className="mt-4 text-ink-soft">
            {products.length} {products.length === 1 ? 'product' : 'products'} in this category.
          </p>
        </div>
      </section>

      <section className="bg-canvas px-5 pb-16 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
