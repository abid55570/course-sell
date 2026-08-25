import type { Product } from '../types';
import { SELF_IMPROVEMENT } from '../categories';

/**
 * Source: Dashrize-Products/PRODUCT-PIPELINE/Tier 2 - Rs 999 (core
 * products)/Skin OS/BRIEF.md — pitch, audience, module structure, tracker
 * pack and guardrails all come from there.
 *
 * Compliance (BRIEF guardrails): grooming, not medical advice. Product
 * categories, never brands. Melasma, cystic acne and scarring are routed to a
 * dermatologist explicitly, and unregulated whitening injections and steroid
 * creams are warned against by name.
 *
 * `gallery` is deliberately empty: the cover graphic for this product has not
 * been made yet (see PRODUCT-PIPELINE/BUILD-STATUS.txt, "what is still
 * missing"). The storefront falls back to a generated cover, so an empty
 * gallery is honest rather than broken — see tests/cover-fallback.test.tsx.
 */
export const skinOs: Product = {
  slug: 'skin-os',
  title: 'Skin OS — The Barrier, The Actives, The Hard Problems',
  shortTitle: 'Skin OS — The Skincare System',
  tagline:
    'A full skincare system for Indian skin and Indian weather. How the barrier actually works, what each active does and what never to layer, and honest limits on what a routine can fix. 18 designed pages + tracker pack. Product categories, not brands. One payment, lifetime access.',
  price: 999,
  pageCount: 18,
  trackerCount: 3,
  audience: 'Indian women and men 18-30 who already have a basic routine',
  accent: { name: 'pink', hex: '#d6336c' },
  category: SELF_IMPROVEMENT,
  format: 'PDF',
  fileCount: 5,
  modules: [
    {
      id: '01',
      title: 'THE BARRIER',
      pageCount: 6,
      highlights: [
        'How skin actually works, and why over-washing made it worse rather than better.',
        'The three steps that do the work, and what everything else is.',
        'Building the routine for oily, dry, combination and sensitive skin — in Indian humidity, not in a climate the advice was written for.',
      ],
    },
    {
      id: '02',
      title: 'ACTIVES, PROPERLY',
      pageCount: 6,
      highlights: [
        'Niacinamide, vitamin C, salicylic and glycolic acid, retinoids and benzoyl peroxide: what each one does, what strength to start at.',
        'What never to layer, and why the combination is the part that damages people.',
        'The patch-test protocol, written as steps rather than a warning.',
        'Signs of a damaged barrier, and the two-week recovery plan for one.',
      ],
    },
    {
      id: '03',
      title: 'THE HARD PROBLEMS',
      pageCount: 6,
      highlights: [
        'Tanning versus pigmentation versus melasma — three different problems that get one wrong answer.',
        'Post-acne marks, and why sunscreen is what fades them.',
        'Body skin: keratosis pilaris, ingrowns, back acne.',
        'Where a PDF stops. Cystic acne, scarring and melasma need a dermatologist, and going early is the cheap version.',
      ],
    },
  ],
  longDescription: [
    {
      heading: 'You Have A Routine. It Is Not Working.',
      paragraphs: [
        'You already wash, moisturise and wear sunscreen most days. You have bought the serum everyone recommended. Your skin is still not doing what you want, and you cannot tell whether the problem is the products, the order, the weather or you.',
        'Most skincare content is written for a climate that is not yours and sells a brand rather than explaining a mechanism. This is the mechanism: what the barrier is, what each active actually does to it, and which of your problems a routine can genuinely fix.',
      ],
    },
    {
      heading: 'Categories, Not Brands',
      paragraphs: [
        'Nothing here names a product to buy. Actives are covered by category and concentration, so the guide keeps working when a brand reformulates, discontinues a line or raises its price — and so nobody is being sold to twice.',
      ],
    },
    {
      heading: 'And The Part Most Guides Skip',
      paragraphs: [
        'Module 03 is largely about the limits. Melasma, cystic acne and scarring are not routine problems, and the honest answer is a dermatologist early rather than eighteen months of experiments. The guide says so plainly, and warns against the two things this market pushes hardest and most dangerously: unregulated whitening injections, and steroid creams used without supervision.',
      ],
    },
  ],
  bulletPoints: [
    'Routines for oily, dry, combination and sensitive skin in Indian humidity',
    'Every common active: what it does, where to start, what never to layer',
    'The patch-test protocol and a two-week barrier-recovery plan',
    'Pigmentation, melasma and post-acne marks told apart properly',
    'Body skin: keratosis pilaris, ingrowns, back acne',
    'Routine tracker, active-introduction log with patch-test dates, 12-week photo comparison sheet',
  ],
  faqs: [
    {
      question: 'What exactly do I receive?',
      answer: 'Five PDFs in one ZIP, delivered instantly: three modules plus the Tracker Pack.',
    },
    {
      question: 'Does it recommend specific products?',
      answer:
        'No, and that is deliberate. It covers actives by category and starting concentration, so it stays accurate when brands reformulate or disappear, and so you are not being sold a second time inside something you already paid for.',
    },
    {
      question: 'I already bought Aura OS. Is this a repeat?',
      answer:
        'No. Aura OS gives skin about twelve pages inside a broader system. This is eighteen pages on skin alone, and goes considerably deeper on actives, layering and the pigmentation problems Aura OS only mentions.',
    },
    {
      question: 'Will this clear my acne?',
      answer:
        'It will fix a routine that is working against you, which is what most people have. It will not treat cystic acne — that is a medical problem, the guide says so, and it tells you to see a dermatologist early rather than late.',
    },
    {
      question: 'Is it for men or women?',
      answer: 'Both. Skin does not read the label.',
    },
    {
      question: 'Refunds?',
      answer:
        "Digital files can't be returned once downloaded, so this is a final sale. Please read the contents above before buying. If a file doesn't arrive or won't open, message me and I'll fix it immediately.",
    },
  ],
  disclaimer:
    'Skin OS provides general grooming and skincare information. It is not medical advice, and no result is promised or guaranteed. It names categories of ingredient rather than brands, and nothing in it is a prescription. Cystic acne, scarring, melasma and any skin change that is spreading, bleeding or painful need a qualified dermatologist — go early rather than after a year of experiments. Do not use unregulated skin-whitening injections or prescription steroid creams without a doctor supervising: both cause lasting damage and both are widely and irresponsibly sold in India.',
  tags: [
    'skincare routine india',
    'indian skin care',
    'niacinamide',
    'vitamin c serum',
    'retinoid beginner',
    'salicylic acid acne',
    'pigmentation treatment',
    'melasma',
    'post acne marks',
    'skin barrier repair',
    'humid weather skincare',
    'keratosis pilaris',
    'back acne',
    'sunscreen india',
  ],
  gallery: [],
  deliveryFiles: [
    'Module-01-THE-BARRIER.pdf',
    'Module-02-ACTIVES-PROPERLY.pdf',
    'Module-03-THE-HARD-PROBLEMS.pdf',
    'Tracker-Pack.pdf',
    'Skin-OS-Complete.zip',
  ],
  // BRIEF: "Upsell from Aura OS and from The Rs 2000 Skincare Kit."
  pairSlug: 'aura-os',
};
