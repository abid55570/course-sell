import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getBundle, getProduct, listBundles, SUPPORT_EMAIL } from '@/lib/catalog';
import { formatRupees } from '@/lib/format';
import Disclaimer from '@/components/product/Disclaimer';
import BuyButton from '@/components/product/BuyButton';
import ProductCard from '@/components/product/ProductCard';
import Faq from '@/components/landing/Faq';
import Footer from '@/components/landing/Footer';

export function generateStaticParams() {
  return listBundles().map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const bundle = getBundle(slug);
  if (!bundle) return {};

  return {
    title: `${bundle.title} — ${formatRupees(bundle.price)} | Dropdesk`,
    description: bundle.tagline,
  };
}

export default async function BundlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bundle = getBundle(slug);
  if (!bundle) notFound();

  return (
    <main>
      <section className="bg-primary px-5 py-16 text-white sm:py-20">
        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-[1fr_180px] sm:items-start">
          <div>
            {!bundle.availableToday ? (
              <span className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                Not available yet
              </span>
            ) : null}
            <h1 className="font-display text-3xl font-bold leading-[1.05] sm:text-5xl">{bundle.title}</h1>
            <p className="mt-4 max-w-2xl text-white/85">{bundle.tagline}</p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <span className="font-display text-4xl font-bold">{formatRupees(bundle.price)}</span>
              {bundle.separatePrice ? (
                <span className="text-white/60 line-through">{formatRupees(bundle.separatePrice)}</span>
              ) : null}
            </div>
            <div className="mt-6">
              {bundle.availableToday ? (
                <BuyButton slug={bundle.slug} title={bundle.title} price={bundle.price} className="bg-white text-primary" />
              ) : (
                <p className="max-w-md text-sm text-white/70">
                  Not purchasable yet. One or more products in this bundle have not shipped. Once
                  they do, this page will carry a buy button.
                </p>
              )}
            </div>
          </div>
          <div className="relative order-first aspect-[3/4] w-full overflow-hidden rounded-card bg-white/10 sm:order-last">
            <Image
              src={`/bundles/${bundle.slug}/${bundle.coverImage.filename}`}
              alt={bundle.coverImage.alt}
              fill
              sizes="180px"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-canvas px-5 py-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-bold">What&rsquo;s in this bundle</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {bundle.components.map((c) =>
              c.inCatalog ? (
                <ProductCard key={c.slug} product={getProduct(c.slug)!} />
              ) : (
                <div key={c.label} className="rounded-card bg-canvas-2 p-5">
                  <span className="inline-block rounded-full bg-ink/10 px-2.5 py-1 text-xs font-semibold text-ink-soft">
                    Coming soon
                  </span>
                  <h3 className="mt-2 font-display text-lg font-bold">{c.label}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{c.note}</p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      <section className="bg-canvas-2 px-5 py-12">
        <div className="mx-auto max-w-3xl space-y-10">
          {bundle.longDescription.map((sec) => (
            <div key={sec.heading}>
              <h2 className="font-display text-2xl font-bold">{sec.heading}</h2>
              <div className="mt-3 space-y-3 text-ink-soft">
                {sec.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {bundle.faqs.length > 0 ? <Faq items={bundle.faqs} title="Questions about this bundle." /> : null}

      <section className="bg-canvas px-5 py-12">
        <div className="mx-auto max-w-3xl">
          <Disclaimer disclaimer={bundle.disclaimer} helplines={bundle.helplines} />
        </div>
      </section>

      <section className="bg-primary px-5 py-16 text-center text-white">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-3xl font-bold">{bundle.title}</h2>
          {bundle.availableToday ? (
            <>
              <p className="mt-2 text-white/85">{formatRupees(bundle.price)}, instant download, pay by UPI.</p>
              <div className="mt-6">
                <BuyButton slug={bundle.slug} title={bundle.title} price={bundle.price} className="bg-white text-primary" />
              </div>
            </>
          ) : (
            <p className="mt-2 text-white/85">Not purchasable yet. Check back once every product ships.</p>
          )}
          <div className="mt-4">
            <Link href="/products" className="text-sm text-white/80 underline underline-offset-2">
              See every product
            </Link>
          </div>
          <p className="mt-4 text-xs text-white/60">Questions? Email {SUPPORT_EMAIL}.</p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
