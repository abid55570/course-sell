import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getProduct,
  getPairFor,
  getSetFor,
  listProducts,
  findPairBundle,
  groupProductsByCategory,
  SUPPORT_EMAIL,
} from '@/lib/catalog';
import { formatRupees, titleLead } from '@/lib/format';
import ProductCoverParallax from '@/components/landing/ProductCoverParallax';
import CoverFallback from '@/components/product/CoverFallback';
import Gallery from '@/components/product/Gallery';
import ModuleBreakdown from '@/components/product/ModuleBreakdown';
import Disclaimer from '@/components/product/Disclaimer';
import BuyButton from '@/components/product/BuyButton';
import CrossSell from '@/components/product/CrossSell';
import SetAnchor from '@/components/product/SetAnchor';
import Faq from '@/components/landing/Faq';
import Footer from '@/components/landing/Footer';

const LINK_ON_INK =
  'text-sm font-semibold uppercase tracking-wide text-white/70 underline underline-offset-4 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

export async function generateStaticParams() {
  return (await listProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};

  const cover = product.gallery.find((g) => g.role === 'cover');
  const image = cover ? `/products/${product.slug}/${cover.filename}` : undefined;

  return {
    title: `${product.title} — ₹${product.price} | Dropdesk`,
    description: product.tagline,
    openGraph: {
      title: product.title,
      description: product.tagline,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [pair, set, allProducts] = await Promise.all([
    getPairFor(slug),
    getSetFor(slug),
    listProducts(),
  ]);

  // Resolved here because CrossSell and SetAnchor are synchronous: only the
  // page reads the catalog.
  const pairBundle = pair ? await findPairBundle(product.slug, pair.slug) : undefined;
  const setGuideCount = set
    ? allProducts.filter((p) => p.category.slug === set.category.slug).length - 1
    : 0;
  const footer = {
    productCount: allProducts.length,
    categories: groupProductsByCategory(allProducts),
  };
  const cover = product.gallery.find((g) => g.role === 'cover');
  const secondaryImages = product.gallery.filter((g) => g.role !== 'cover');
  const name = titleLead(product.title);

  const specLine = [
    product.pageCount ? `${product.pageCount} PAGES` : null,
    product.trackerCount ? `${product.trackerCount} TRACKERS` : null,
    formatRupees(product.price),
    product.anchorPrice ? `${formatRupees(product.anchorPrice)} SEPARATELY` : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(' · ');

  const hasModules = (product.modules?.length ?? 0) > 0;
  const moduleSummary = [
    product.pageCount ? `${product.pageCount} designed pages` : null,
    product.trackerCount ? `${product.trackerCount} printable trackers` : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(', ');

  const hasDisclaimer = Boolean(product.disclaimer) || (product.helplines?.length ?? 0) > 0;

  return (
    <main>
      <section className="relative overflow-hidden bg-ink px-5 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ background: `radial-gradient(60% 60% at 80% 30%, ${product.accent.hex}33, transparent 70%)` }}
        />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
          <div className="mx-auto w-full max-w-[420px] shrink-0 lg:order-2 lg:mx-0 lg:w-[420px]">
            {cover ? (
              <ProductCoverParallax
                src={`/products/${product.slug}/${cover.filename}`}
                alt={cover.alt}
                sizes="(min-width: 1024px) 420px, 90vw"
                priority
              />
            ) : (
              <div className="relative aspect-square w-full overflow-hidden bg-ink">
                <CoverFallback
                  title={product.title}
                  kicker={product.category.label}
                  accentHex={product.accent.hex}
                  size="lg"
                />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 lg:order-1">
            {product.audience ? (
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-white/70">
                {product.audience}
              </p>
            ) : null}
            <h1 className="mt-3 font-display text-3xl font-bold leading-[1.02] text-white sm:text-4xl lg:text-5xl">
              {product.title}
            </h1>
            <span aria-hidden="true" className="mt-4 block h-1 w-20" style={{ backgroundColor: product.accent.hex }} />
            <p className="mt-5 max-w-xl text-white/80">{product.tagline}</p>
            <p className="mt-5 font-mono text-xs font-semibold uppercase tracking-[0.15em] text-white/60">
              {specLine}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-5">
              <BuyButton slug={product.slug} title={product.title} price={product.price} className="bg-white text-primary" />
              <Link href={`/category/${product.category.slug}`} className={LINK_ON_INK}>
                See more {product.category.label}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-canvas px-5 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <ul className="grid gap-2 sm:grid-cols-2">
            {product.bulletPoints.map((b) => (
              <li key={b} className="flex gap-2.5 text-sm text-ink-soft">
                <span
                  aria-hidden="true"
                  className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: product.accent.hex }}
                />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-canvas px-5 py-4 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl space-y-10">
          {product.longDescription.map((sec) => (
            <div key={sec.heading}>
              <h2 className="font-display text-2xl font-bold text-ink">{sec.heading}</h2>
              <div className="mt-3 space-y-3 text-ink-soft">
                {sec.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {hasModules ? (
        <section className="bg-canvas-2 px-5 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
              Module breakdown
            </h2>
            {moduleSummary ? (
              <p className="mt-2 font-display text-2xl font-bold text-ink">{moduleSummary}.</p>
            ) : null}
            <div className="mt-6">
              <ModuleBreakdown product={product} />
            </div>
          </div>
        </section>
      ) : null}

      {secondaryImages.length > 0 ? (
        <section className="bg-canvas px-5 py-12 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-5xl">
            <Gallery slug={product.slug} images={secondaryImages} />
          </div>
        </section>
      ) : null}

      {pair ? (
        <section className="bg-canvas px-5 py-12 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-3xl">
            <CrossSell product={product} pair={pair} bundle={pairBundle} />
          </div>
        </section>
      ) : null}

      {set ? (
        <section className="bg-canvas px-5 py-12 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-3xl">
            <SetAnchor guide={product} set={set} guideCount={setGuideCount} />
          </div>
        </section>
      ) : null}

      <Faq items={product.faqs} title="Questions about this product." />

      {hasDisclaimer ? (
        <section className="bg-canvas px-5 py-12 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-3xl">
            <Disclaimer disclaimer={product.disclaimer} helplines={product.helplines} />
          </div>
        </section>
      ) : null}

      <section className="bg-ink px-5 py-16 text-center text-white sm:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-3xl font-bold uppercase">{name}</h2>
          <p className="mt-2 text-white/80">{formatRupees(product.price)}, instant download, pay by UPI.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-5">
            <BuyButton slug={product.slug} title={product.title} price={product.price} className="bg-white text-primary" />
            <Link href="/products" className={LINK_ON_INK}>
              See every product
            </Link>
          </div>
          <p className="mt-4 text-xs text-white/50">Questions before you buy? Email {SUPPORT_EMAIL}.</p>
        </div>
      </section>

      <Footer {...footer} />
    </main>
  );
}
