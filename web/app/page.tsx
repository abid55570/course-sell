import Hero from '@/components/landing/Hero';
import FeaturedProducts from '@/components/landing/FeaturedProducts';
import CategoryNav from '@/components/landing/CategoryNav';
import InstallSteps from '@/components/landing/InstallSteps';
import PricingLadder from '@/components/landing/PricingLadder';
import BundlesList from '@/components/landing/BundlesList';
import Faq, { type FaqItem } from '@/components/landing/Faq';
import Footer from '@/components/landing/Footer';
import { readPaymentMode } from '@/lib/payment-mode';
import { getBundle, listProducts, listFeatured, listCategories, listBundles, getPricingLadder, groupProductsByCategory } from '@/lib/catalog';
import { formatRupees } from '@/lib/format';

// Built per render rather than declared as a module constant: the prices it
// quotes come from the catalog, which is a database read now.
// paymentMode affects how the FAQ answers refer to payments and downloads.
function buildFaqItems(pairPrice: number, everythingBundlePrice: number | undefined, paymentMode: PaymentMode): FaqItem[] {
  const isWhatsapp = paymentMode === 'whatsapp';
  return [
  {
    question: 'What if my download link never arrives?',
    answer: 'Email support@dropdesk.in with your order ID. We fix the delivery problem first — resend the link or the correct file — and refund you only if we cannot. Full policy on the Refund Policy page.',
  },
  {
    question: 'How do I get my product after I pay?',
    answer: isWhatsapp
      ? 'After we confirm your payment on WhatsApp, we email a download link to the address you gave. Check inbox and spam.'
      : 'The moment your payment clears, we email a download link to the address you used at checkout.',
  },
  {
    question: 'Do I need an account?',
    answer: 'No. Give your name and email at checkout. No password, no login.',
  },
  {
    question: 'What payment methods work?',
    answer: isWhatsapp
      ? 'Transfer to UPI using the details on the checkout page. We confirm on WhatsApp once the money arrives.'
      : 'UPI, cards and netbanking, all through Razorpay.',
  },
  {
    question: `Can I buy more than one product?`,
    answer: `Yes. Any pair is ${formatRupees(pairPrice)}${
      everythingBundlePrice !== undefined ? `, and the Everything Bundle is ${formatRupees(everythingBundlePrice)}` : ''
    }. See the bundles above.`,
  },
  {
    question: 'Can I get a refund?',
    answer:
      'Digital products are non-refundable once the download link is sent, since the file is available to you immediately. If a link is broken or never arrives, we fix it or refund you. Full policy on the Refund Policy page.',
  },
  {
    question: 'Is any of this professional advice?',
    answer:
      'No. Products are general information, not professional advice. Where a disclaimer applies, such as for medical, financial or career content, it sits on that product\'s own page. For anything specific to you, talk to a qualified professional in that field.',
  },
  ];
}

type PaymentMode = 'razorpay' | 'whatsapp' | 'dev';

export default async function Home() {
  // The homepage used to list every product grouped by category
  // (ProductGrid, unfiltered). That doesn't scale: the catalog now holds 84
  // products across 9 categories, and rendering all of them here would make
  // the homepage enormous — a slow first load and a wall of guide titles
  // before a visitor even reaches pricing. /products already exists as the
  // dedicated full-browse page, so the homepage now shows a small curated
  // set (one per category, the same `featured` products the pricing FAQ and
  // catalog tests already treat as the storefront's public face) plus a
  // category-nav grid that hands visitors straight to whichever category
  // they want. Both are still fully catalog-derived — nothing here is a
  // fixed list — so this keeps working unchanged if the catalog grows again.
  const [products, featured, categories, bundles, pricingLadder, everythingBundle, pairBundle, paymentMode] =
    await Promise.all([
      listProducts(),
      listFeatured(),
      listCategories(),
      listBundles(),
      getPricingLadder(),
      getBundle('everything-bundle'),
      getBundle('the-complete-man'),
      readPaymentMode(),
    ]);
  const faqItems = buildFaqItems(pricingLadder.pair, everythingBundle?.price, paymentMode);

  // Resolved once here and handed down: the children are synchronous, so the
  // page is the only place allowed to touch the catalog.
  const productsBySlug = new Map(products.map((product) => [product.slug, product]));
  const countBySlug = new Map<string, number>();
  for (const product of products) {
    countBySlug.set(product.category.slug, (countBySlug.get(product.category.slug) ?? 0) + 1);
  }
  const footer = { productCount: products.length, categories: groupProductsByCategory(products) };

  return (
    <>
      <main>
        <Hero paymentMode={paymentMode} />
        {/* ground-chart carries the hero's chart ruling through the featured
            band. CategoryNav sits outside it and supplies its own dotted
            ground (band-leaders) — nesting it inside .ground-chart would let
            that wrapper's own background-image win on specificity and erase
            the dots, the same reason BundlesList (band-leaders further down
            this page) has never lived inside .ground-chart either. The tear
            perforates the install slip off whichever of the two sits last. */}
        <div id="products" className="ground-chart">
          <FeaturedProducts products={featured} />
        </div>
        <CategoryNav categories={categories} countBySlug={countBySlug} />
        <div aria-hidden="true" className="tear tear-carbon" />
        <InstallSteps paymentMode={paymentMode} />
        <PricingLadder paymentMode={paymentMode} pricingLadder={pricingLadder} everythingBundle={everythingBundle} pairBundle={pairBundle} />
        <BundlesList bundles={bundles} productsBySlug={productsBySlug} />
        <Faq items={faqItems} />
        <Footer {...footer} paymentMode={paymentMode} />
      </main>
    </>
  );
}
