import type { Metadata } from 'next';
import Link from 'next/link';
import { getProduct, getBundle, SUPPORT_EMAIL } from '@/lib/catalog';
import { formatRupees } from '@/lib/format';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import Footer from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'Checkout | Dropdesk',
};

/** Looks the slug up as a product first, then a bundle — /checkout?slug=... serves both, same as BuyButton does. */
function resolveCheckoutItem(slug: string) {
  const product = getProduct(slug);
  if (product) {
    return { title: product.title, tagline: product.tagline, price: product.price, available: true as const };
  }
  const bundle = getBundle(slug);
  if (bundle) {
    return { title: bundle.title, tagline: bundle.tagline, price: bundle.price, available: bundle.availableToday };
  }
  return null;
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string | string[] }>;
}) {
  const { slug: rawSlug } = await searchParams;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  if (!slug) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-canvas px-5 py-16">
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl font-bold text-ink">No product selected</h1>
          <p className="mt-3 text-ink-soft">
            This page needs a product to check out. Go back and pick one from the store.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground"
          >
            Browse products
          </Link>
        </div>
      </main>
    );
  }

  const item = resolveCheckoutItem(slug);

  if (!item) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-canvas px-5 py-16">
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl font-bold text-ink">Product not found</h1>
          <p className="mt-3 text-ink-soft">&ldquo;{slug}&rdquo; doesn&rsquo;t match anything in the store.</p>
          <Link
            href="/products"
            className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground"
          >
            Browse products
          </Link>
        </div>
      </main>
    );
  }

  // A named bundle that isn't sellable yet (one of its components hasn't
  // shipped) never reaches a payment form — no CheckoutForm is rendered at
  // all, so there is no way to trigger an order for it from here.
  if (!item.available) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-canvas px-5 py-16">
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl font-bold text-ink">Not available yet</h1>
          <p className="mt-3 text-ink-soft">
            {item.title} isn&rsquo;t purchasable yet — one or more of the products in it haven&rsquo;t
            shipped. Check back once they have.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground"
          >
            Browse what&rsquo;s available now
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[70vh] bg-canvas">
      {/* Padding lives on this inner wrapper, not on <main>, so it never
          stacks with Footer's own horizontal padding below (Footer is an
          unpadded direct child of <main>, same as every other route). */}
      <div className="px-5 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-lg">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">Checkout</p>
          <h1 className="mt-2 font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">{item.title}</h1>
          <p className="mt-2 text-sm text-ink-soft">{item.tagline}</p>
          <p className="mt-4 font-display text-3xl font-bold text-ink">{formatRupees(item.price)}</p>
          <p className="mt-1 text-xs text-ink-soft">Instant delivery by email once payment is confirmed.</p>

          <div className="mt-8 rounded-card border border-border bg-canvas-2 p-6 sm:p-8">
            <CheckoutForm slug={slug} title={item.title} price={item.price} />
          </div>

          <p className="mt-6 text-center text-xs text-ink-soft">
            Trouble paying? Email {SUPPORT_EMAIL} with your name and what you tried to buy.
          </p>
        </div>
      </div>
      <div className="mt-16">
        <Footer />
      </div>
    </main>
  );
}
