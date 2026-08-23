import Hero from '@/components/landing/Hero';
import FeaturedProducts from '@/components/landing/FeaturedProducts';
import CategoryNav from '@/components/landing/CategoryNav';
import InstallSteps from '@/components/landing/InstallSteps';
import PricingLadder from '@/components/landing/PricingLadder';
import BundlesList from '@/components/landing/BundlesList';
import Faq, { type FaqItem } from '@/components/landing/Faq';
import Footer from '@/components/landing/Footer';
import { getBundle, listFeatured, listCategories, PRICING_LADDER } from '@/lib/catalog';
import { formatRupees } from '@/lib/format';

const everythingBundle = getBundle('everything-bundle');

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'How do I get my product after I pay?',
    answer: 'The moment your payment clears, we email a download link to the address you used at checkout.',
  },
  {
    question: 'Do I need an account?',
    answer: 'No. Give your name and email at checkout. No password, no login.',
  },
  {
    question: 'What payment methods work?',
    answer: 'UPI, cards and netbanking, all through Razorpay.',
  },
  {
    question: 'Can I buy more than one product?',
    answer: `Yes. Any pair is ${formatRupees(PRICING_LADDER.pair)}${
      everythingBundle ? `, and the Everything Bundle is ${formatRupees(everythingBundle.price)}` : ''
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

export default function Home() {
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
  const featured = listFeatured();
  const categories = listCategories();

  return (
    <>
      <main>
        <Hero />
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
        <CategoryNav categories={categories} />
        <div aria-hidden="true" className="tear tear-carbon" />
        <InstallSteps />
        <PricingLadder />
        <BundlesList />
        <Faq items={FAQ_ITEMS} />
        <Footer />
      </main>
    </>
  );
}
