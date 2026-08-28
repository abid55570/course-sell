import type { Product } from '../types';
import { SELF_IMPROVEMENT } from '../categories';

/**
 * Source: Dashrize-Products/PRODUCT-PIPELINE/Tier 1 - Rs 299
 * (tripwires)/30 Days of Focus/BRIEF.md.
 *
 * The first ₹299 product in the catalogue — a tripwire, so it is deliberately
 * one PDF and one tracker rather than a module set. Priced below the previous
 * catalogue minimum of ₹499, which is why PRICING_LADDER computes `single`
 * from the real minimum instead of hardcoding it (see lib/catalog/index.ts).
 *
 * Compliance (BRIEF guardrails): not psychological advice, and it signposts
 * help if distress appears — hence the Tele-MANAS helpline, carried the same
 * way Study OS carries it.
 *
 * `gallery` is empty: no cover graphic exists yet (PRODUCT-BUILD status).
 */
export const thirtyDaysOfFocus: Product = {
  slug: '30-days-of-focus',
  title: '30 Days of Focus — The Phone Reset, As A Run You Can Start Tonight',
  shortTitle: '30 Days of Focus',
  tagline:
    'The three-phase phone detox and the 50/10 block, as a thirty-day run with a wall chain and a daily scorecard. You do not have a focus problem — you watched a three-hour film last week. 4 pages + tracker pack. One payment, lifetime access.',
  price: 299,
  pageCount: 4,
  trackerCount: 2,
  audience: 'Students and young workers losing three hours a day to feeds',
  accent: { name: 'orange', hex: '#e8590c' },
  category: SELF_IMPROVEMENT,
  format: 'PDF',
  fileCount: 1,
  longDescription: [
    {
      heading: 'You Do Not Have A Focus Problem',
      paragraphs: [
        'You watched a three-hour film last week without checking your phone once. Your attention works. What has happened is that a feed is easier to start than a textbook, and starting is the only part that is actually hard.',
        'This is thirty days of fixing the starting problem: a 72-hour reset with exact rules, a rebuild from day 4, and a hold phase with one reset day a month.',
      ],
    },
    {
      heading: 'Small On Purpose',
      paragraphs: [
        'Four pages and two trackers. It is the phone protocol and the work block pulled out of the larger systems and turned into something you can begin tonight, rather than a book you mean to read.',
        'If it works and you want the rest — the revision cycle, the error log, the full system — Study OS is where it goes next.',
      ],
    },
  ],
  bulletPoints: [
    'The dopamine ledger, in plain language',
    'Phase 1: the 72-hour reset, with exact rules',
    'Phase 2: rebuild, day 4 to day 30',
    'Phase 3: hold, with one reset day a month',
    'The 50/10 block and the written target',
    'The 5-minute rule, and the shutdown ritual',
    'What days 1, 2 and 3 actually feel like',
    '30-day wall chain plus a daily four-box scorecard',
  ],
  faqs: [
    {
      question: 'What exactly do I receive?',
      answer: 'One PDF, delivered instantly: the thirty-day run plus the wall chain and scorecard.',
    },
    {
      question: 'Is this just part of Study OS?',
      answer:
        'It is the phone protocol and the work block from Study OS and Glow-Up OS, pulled out and turned into a thirty-day run. If you already own either, you have most of this. If you own neither, this is the cheapest way to find out whether the method suits you.',
    },
    {
      question: 'Do I have to delete everything?',
      answer:
        'For 72 hours, the rules are strict and written out exactly. After that it is a rebuild, not abstinence — the point is to end up using the phone deliberately, not to never use it.',
    },
    {
      question: 'What if I break the chain?',
      answer:
        'Phase 3 has a reset day built in, once a month, precisely because everyone breaks it. A missed day is planned for, not a failure.',
    },
    {
      question: 'Refunds?',
      answer:
        "Digital files can't be returned once downloaded, so this is a final sale. Please read the contents above before buying. If a file doesn't arrive or won't open, message me and I'll fix it immediately.",
    },
  ],
  disclaimer:
    '30 Days of Focus provides general habit and attention guidance. It is not psychological, medical or therapeutic advice, and no outcome is promised. Difficulty concentrating can have causes a habit plan cannot address, including anxiety, depression, ADHD and sleep disorders — if that sounds like your situation, please speak to a doctor or a qualified professional. If you are in distress, India\'s government Tele-MANAS helpline is 14416, free and available at any time.',
  helplines: [
    {
      name: 'Tele-MANAS',
      number: '14416',
      context: 'If you are in distress, Tele-MANAS is free and available at any time.',
    },
  ],
  tags: [
    'phone detox',
    'digital detox india',
    'focus challenge',
    'dopamine detox',
    'screen time reduction',
    'deep work',
    '50 10 pomodoro',
    'study focus',
    'attention span',
    'habit tracker',
    '30 day challenge',
  ],
  gallery: [{ filename: '1-cover-thumbnail.png', role: 'cover', alt: '30 Days of Focus cover — rebuild your attention in 30 days.' }],
  deliveryFiles: ['30-Days-of-Focus.pdf'],
  // BRIEF: "Upsell to Study OS, Glow-Up OS or Aura OS".
  pairSlug: 'study-os',
};
