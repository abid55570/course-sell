import type { Product } from '../types';
import { SELF_IMPROVEMENT } from '../categories';

/**
 * Source: Dashrize-Products/PRODUCT-PIPELINE/Tier 2 - Rs 999 (core
 * products)/Wedding Glow-Up OS/BRIEF.md.
 *
 * Priced at ₹999. The brief notes "test Rs 1,499" — a pricing experiment for
 * the owner to run from the admin panel, not a second price to hardcode here.
 *
 * Compliance (BRIEF guardrails): grooming and general fitness only. No crash
 * dieting, no medical or cosmetic-procedure advice, everything clinical routed
 * to a dermatologist early, and no before-and-after imagery.
 */
export const weddingGlowUpOs: Product = {
  slug: 'wedding-glow-up-os',
  title: 'Wedding Glow-Up OS — Ninety Days, Counted Backwards',
  shortTitle: 'Wedding Glow-Up OS',
  tagline:
    'Your wedding, or your sister’s. Skin, body, hair and outfit timed backwards from the date — what has to start at day 90 because it takes 90 days, what starts at day 30, and what you must not try in the final fortnight. 19 designed pages + countdown tracker pack. One payment, lifetime access.',
  price: 999,
  pageCount: 19,
  trackerCount: 4,
  audience: 'Indian brides and grooms, and the siblings and cousins in the wedding party',
  accent: { name: 'gold', hex: '#c8a44a' },
  category: SELF_IMPROVEMENT,
  format: 'PDF',
  fileCount: 5,
  modules: [
    {
      id: '01',
      title: 'THE COUNTDOWN',
      pageCount: 6,
      highlights: [
        'The whole plan timed backwards from the date.',
        'What must start at day 90 because it genuinely takes 90 days — skin and strength both do.',
        'What starts at day 30, and what happens in the final week.',
        'What you must NOT try in the last fortnight, which is the part that ruins people.',
      ],
    },
    {
      id: '02',
      title: 'SKIN, HAIR AND BODY',
      pageCount: 7,
      highlights: [
        'The routine, and actives with a hard cut-off date before the event.',
        'The hair timeline, including when to book the last trim.',
        'A body-recomposition plan that does not wreck you before the day.',
        'When to see a dermatologist — and why the answer is day 90, not day 20.',
      ],
    },
    {
      id: '03',
      title: 'THE DAY AND THE PHOTOS',
      pageCount: 6,
      highlights: [
        'Outfit fittings and the tailoring timeline.',
        'How to stand and pose so the photographs actually work.',
        'Sleep and food in the final week.',
        'The morning-of checklist.',
      ],
    },
  ],
  longDescription: [
    {
      heading: 'A Deadline Changes The Plan',
      paragraphs: [
        'An open-ended routine and a ninety-day countdown are not the same product. Some things take the full ninety days and will not compress — skin turnover does not negotiate, and neither does strength. Others should not be started until day thirty, and a few must never be started in the last two weeks.',
        'Getting that ordering wrong is how people arrive at their own wedding having broken out from an active they introduced nine days before.',
      ],
    },
    {
      heading: 'Timed Backwards, Not Forwards',
      paragraphs: [
        'Everything here is anchored to the date rather than to the day you bought it. Day 90, day 60, day 30, the final week, the morning of. The wall calendar in the tracker pack is the product as much as the modules are.',
      ],
    },
    {
      heading: 'And The Honest Limits',
      paragraphs: [
        'No crash dieting, no cosmetic procedures, and nothing clinical decided in a hurry. Anything that needs a dermatologist needs one at day 90, when there is still time for it to work — which is exactly the advice people ignore until day 20.',
      ],
    },
  ],
  bulletPoints: [
    'The full plan timed backwards from your date',
    'What must start at day 90, at day 60, at day 30',
    'What never to start in the final fortnight',
    'Actives with a hard cut-off date before the event',
    'The hair timeline, including the last trim at day minus 5',
    'Body recomposition that does not wreck you before the day',
    'Fittings, tailoring, posing, and the morning-of checklist',
    '90-day wall calendar, skin and hair log, fitting tracker, final-week checklist',
  ],
  faqs: [
    { question: 'What exactly do I receive?', answer: 'Five PDFs in one ZIP, delivered instantly: three modules plus the Tracker Pack.' },
    {
      question: 'My wedding is in six weeks, not ninety days.',
      answer:
        'The countdown is written so you can enter it at any point and see what is still available to you and what is not. The honest answer at six weeks is that some things are out, and the guide says which.',
    },
    {
      question: 'Is this for brides only?',
      answer: 'No. Grooms, and the siblings and cousins in the wedding party, are covered throughout.',
    },
    {
      question: 'Does it recommend treatments or procedures?',
      answer:
        'No. It is grooming and general fitness only. Anything clinical is routed to a dermatologist, and the guide pushes you to go at day 90 rather than day 20.',
    },
    {
      question: 'Refunds?',
      answer:
        "Digital files can't be returned once downloaded, so this is a final sale. Please read the contents above before buying. If a file doesn't arrive or won't open, message me and I'll fix it immediately.",
    },
  ],
  disclaimer:
    'Wedding Glow-Up OS provides general grooming and fitness information. It is not medical, dermatological, nutritional or cosmetic-procedure advice, and no result is promised or guaranteed. It does not recommend crash dieting, and nothing in it should be used to justify one. Any skin concern, and any procedure of any kind, needs a qualified dermatologist or doctor — and needs them early, not in the final fortnight.',
  tags: [
    'wedding glow up',
    'indian bride skincare',
    'groom grooming india',
    '90 day wedding plan',
    'pre wedding skin',
    'wedding countdown',
    'shaadi preparation',
  ],
  gallery: [],
  deliveryFiles: [
    'Module-01-THE-COUNTDOWN.pdf',
    'Module-02-SKIN-HAIR-BODY.pdf',
    'Module-03-THE-DAY-AND-THE-PHOTOS.pdf',
    'Tracker-Pack.pdf',
    'Wedding-Glow-Up-OS-Complete.zip',
  ],
  pairSlug: 'aura-os',
};
