import Link from 'next/link';
import HeroHeadline from './HeroHeadline';

/**
 * The strip states the terms of the sale, not the contents of the catalog.
 * Every line is checked against the API: Razorpay takes UPI, cards and
 * netbanking; checkout collects a name and an email and creates no account;
 * the delivery email carries a download link and goes out when payment clears.
 * None of it changes when a product is added, so it holds at six items or six
 * thousand.
 */
const TERMS = [
  'ONE PAYMENT',
  'INSTANT DOWNLOAD',
  'PAY BY UPI',
  'CARDS & NETBANKING',
  'NO ACCOUNT NEEDED',
  'NO SUBSCRIPTION',
] as const;

export default function Hero() {
  return (
    <>
      <section className="relative overflow-hidden hero-field px-5 pb-0 pt-24 text-white sm:px-10 sm:pt-28 lg:px-12 lg:pt-32">
        <div className="mx-auto max-w-6xl">
          <div className="min-w-0 flex flex-col items-center text-center">
            <HeroHeadline lines={['PAY ONCE.', 'DOWNLOAD NOW.', 'USE IT TONIGHT.']} />

            <p className="mt-6 max-w-xl text-base text-white/90 sm:text-lg">
              Dropdesk sells finished digital products you can start using the day you buy them.
              Pay once, download immediately, priced honestly in rupees. No subscription, no
              login, no waiting.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              <Link
                href="#products"
                className="inline-block bg-white px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Shop the categories
              </Link>
              <Link
                href="/products"
                className="text-sm font-semibold uppercase tracking-wide text-white underline decoration-2 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                See everything →
              </Link>
            </div>
          </div>

        </div>

        <div
          aria-hidden="true"
          className="-mx-5 mt-12 overflow-hidden border-y border-white/15 sm:-mx-10 lg:-mx-12"
        >
          <div className="dep-track flex w-max">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex items-center gap-10 py-2.5 pl-10">
                {TERMS.map((term) => (
                  <span
                    key={`${copy}-${term}`}
                    className="flex items-center gap-2 whitespace-nowrap font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-white"
                  >
                    <span className="h-2 w-2 shrink-0 bg-white/50" />
                    {term}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
      <div aria-hidden="true" className="tear tear-hero" />
    </>
  );
}
