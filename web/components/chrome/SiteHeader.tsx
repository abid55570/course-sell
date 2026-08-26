import Link from 'next/link';
import { listCategories, listProducts } from '@/lib/catalog';
import MobileDrawer, { type DrawerCategory } from './MobileDrawer';

/**
 * The site's persistent header.
 *
 * Before this existed there was no navigation anywhere. A buyer who tapped a
 * category chip on /products landed 12,400px down a 17,543px page with no way
 * back but scrolling, because nothing on any page was pinned.
 *
 * The header stays solid canvas at every scroll position rather than going
 * transparent over the hero's vermilion field. Transparent would mean the
 * wordmark sits on white in one place and on #C42B22 in another, and only one
 * of those can clear 4.5:1 without a second colour. Solid is the honest answer.
 *
 * `searchSlot` is where the search entry point mounts. It is a prop rather than
 * a hardcoded import so search can be built without editing this file.
 */
// The props object defaults to empty: every field in it is optional, so
// requiring the object itself made `SiteHeader()` a type error for no reason.
export default async function SiteHeader({ searchSlot }: { searchSlot?: React.ReactNode } = {}) {
  const products = await listProducts();
  const categories: DrawerCategory[] = (await listCategories()).map((category) => ({
    slug: category.slug,
    label: category.label,
    hex: category.accent.hex,
    count: products.filter((p) => p.category.slug === category.slug).length,
  }));

  return (
    <header className="sticky top-0 z-40 border-b border-ink/15 bg-canvas">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-5 sm:px-10 lg:px-12">
        <Link
          href="/"
          className="flex min-h-[44px] items-center font-display text-xl font-extrabold uppercase leading-none tracking-tight text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Dropdesk
        </Link>

        <nav
          aria-label="Main"
          className="ml-auto hidden items-center gap-6 sm:flex"
        >
          <Link
            href="/products"
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-soft hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            All products
          </Link>
          <Link
            href="/products#bundles"
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-soft hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Bundles
          </Link>
          <Link
            href="/blog"
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-soft hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Blog
          </Link>
        </nav>

        {/* Desktop keeps the field inline. On mobile the bar has no room for it,
            so the header offers a search link and /search carries the real field
            at full width. Both routes reach the same server-side matching. */}
        <div className="ml-auto hidden sm:block">{searchSlot}</div>

        <Link
          href="/search"
          aria-label="Search products"
          className="ml-auto flex h-11 w-11 items-center justify-center border border-ink/15 text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:hidden"
        >
          <span aria-hidden="true" className="font-mono text-sm font-semibold">
            ⌕
          </span>
        </Link>

        <div className="ml-2 sm:hidden">
          <MobileDrawer categories={categories} />
        </div>
      </div>
    </header>
  );
}
