import Link from 'next/link';
import { SUPPORT_EMAIL, listCategories, listProducts } from '@/lib/catalog';

// inline-flex + min-h gives each link a real 44px tap target without changing
// how the column reads. Footer links were 20px tall, which is half the mobile
// touch minimum, and this footer carries the only links to the legal pages.
const LINK_CLASS =
  'inline-flex min-h-[44px] items-center text-white/70 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

const LABEL_CLASS =
  'flex items-center gap-3 font-mono text-xs font-semibold uppercase tracking-[0.15em] text-white/60';

const LEADER = (
  <span aria-hidden="true" className="h-px flex-1 border-b border-dotted border-white/25" />
);

export default function Footer() {
  const products = listProducts();
  const categories = listCategories();

  return (
    <>
      <div aria-hidden="true" className="tear tear-footer" />
      <footer className="bg-ink px-5 pt-12 pb-0 text-white sm:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="font-display text-xl font-bold">Dropdesk</div>
            <p className="mt-2 max-w-xs font-mono text-xs uppercase tracking-[0.1em] text-white/60">
              {products.length} digital products across {categories.length} categories. Instant download.
            </p>
            <p className="mt-2 max-w-xs font-mono text-xs uppercase tracking-[0.1em] text-white/60">
              Payments by Razorpay · UPI · Cards · Netbanking
            </p>
          </div>
          <div className="flex flex-wrap gap-x-12 gap-y-8 text-sm">
            <div className="flex min-w-[9rem] flex-col gap-2">
              <span className={LABEL_CLASS}>
                Products
                {LEADER}
              </span>
              <Link href="/products" className={LINK_CLASS}>
                Browse all
              </Link>
              {categories.map((c) => (
                <Link key={c.slug} href={`/category/${c.slug}`} className={LINK_CLASS}>
                  {c.label}
                </Link>
              ))}
            </div>
            <div className="flex min-w-[9rem] flex-col gap-2">
              <span className={LABEL_CLASS}>
                Support
                {LEADER}
              </span>
              <a href={`mailto:${SUPPORT_EMAIL}`} className={LINK_CLASS}>
                {SUPPORT_EMAIL}
              </a>
              <Link href="/contact" className={LINK_CLASS}>
                Contact
              </Link>
              <Link href="/refunds" className={LINK_CLASS}>
                Refund policy
              </Link>
            </div>
            <div className="flex min-w-[9rem] flex-col gap-2">
              <span className={LABEL_CLASS}>
                Legal
                {LEADER}
              </span>
              <Link href="/privacy" className={LINK_CLASS}>
                Privacy
              </Link>
              <Link href="/terms" className={LINK_CLASS}>
                Terms
              </Link>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-6xl border-t border-white/10 pt-6 font-mono text-[11px] uppercase tracking-[0.1em] text-white/60">
          © {new Date().getFullYear()} Dropdesk. All rights reserved.
        </p>
        <div aria-hidden="true" className="mx-auto max-w-6xl overflow-hidden">
          <span className="block translate-y-[0.16em] select-none whitespace-nowrap font-display text-[clamp(4rem,16vw,13rem)] font-bold leading-[0.8] text-white">
            DROPDESK
          </span>
        </div>
        {/* The route strip doubles as category navigation, so it carries a real
            44px tap target and a visible label. It previously stood 8px tall
            with no text, which made it both untappable on a phone and reliant
            on hue alone to say which category was which. */}
        <div className="-mx-5 flex sm:-mx-12">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              // min-w-0 is load-bearing: a flex child defaults to min-width:auto,
              // so six labels would refuse to shrink below their text and push
              // the page 250px wider than the viewport at 380px.
              className="flex min-h-[44px] min-w-0 flex-1 flex-col justify-end gap-1 pb-1 text-center focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
            >
              <span className="truncate px-1 font-mono text-[9px] uppercase tracking-[0.08em] text-white/70">
                {c.label}
              </span>
              <span aria-hidden="true" className="block h-2 w-full" style={{ backgroundColor: c.accent.hex }} />
            </Link>
          ))}
        </div>
      </footer>
    </>
  );
}
