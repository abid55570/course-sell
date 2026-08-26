import type { Product } from '../types';
import { MONEY_AND_CAREER } from '../categories';

/**
 * Source: Dashrize-Products/PRODUCT-PIPELINE/Tier 2 - Rs 999 (core
 * products)/Creator OS/BRIEF.md.
 *
 * Compliance (BRIEF guardrails): no follower or income guarantees, no
 * engagement-pod or bot tactics, and be explicit that most pages take months.
 * The copy below states the timeline plainly rather than burying it — the
 * brief's own line is "most pages die in week three".
 */
export const creatorOs: Product = {
  slug: 'creator-os',
  title: 'Creator OS — A Faceless Page That Actually Gets Seen',
  shortTitle: 'Creator OS',
  tagline:
    'Start a page without showing your face, post daily without burning out, and understand why the first 1.5 seconds decide everything else. Six faceless formats, the 30-post bank you build before publishing anything, and honest timelines. 18 designed pages + tracker pack. One payment, lifetime access.',
  price: 999,
  pageCount: 18,
  trackerCount: 4,
  audience: 'Anyone who wants to start on Instagram or YouTube without appearing on camera',
  accent: { name: 'violet', hex: '#7048e8' },
  category: MONEY_AND_CAREER,
  format: 'PDF',
  fileCount: 5,
  modules: [
    {
      id: '01',
      title: 'THE PAGE',
      pageCount: 6,
      highlights: [
        'Picking a niche you will not abandon in three weeks.',
        'Faceless formats that work: screen recordings, B-roll with text, carousels, voiceover.',
        'Profile setup, bio, highlight covers.',
        'The 30-post bank you build before you post anything — which is the step people skip and why their page died last time.',
      ],
    },
    {
      id: '02',
      title: 'THE CONTENT',
      pageCount: 6,
      highlights: [
        'The hook in 1.5 seconds, and why the first frame decides everything after it.',
        'Writing text-on-screen that people can actually read.',
        'Batching a week in one sitting.',
        'What to post when you have nothing: the diagnosis reel, the list reel, the myth reel.',
        'Reading your own analytics without spiralling.',
      ],
    },
    {
      id: '03',
      title: 'THE LONG GAME',
      pageCount: 6,
      highlights: [
        'Posting daily without burning out.',
        'What to do at 0 views, at 1,000, and at 10,000 — three different problems.',
        'The comment-to-DM funnel.',
        'When and how to sell without wrecking the page.',
        'Honest timelines, and why most pages die in week three.',
      ],
    },
  ],
  longDescription: [
    {
      heading: 'You Do Not Have To Be On Camera',
      paragraphs: [
        'For a great many people in India that is not modesty, it is the actual blocker — a family that would disapprove, a current employer, or simply no wish to be recognisable. It ends the idea before it starts.',
        'Six formats here never show a face, and none of them are a compromise. Screen recordings, B-roll with text, carousels and voiceover are what a large share of the pages you already follow are made of.',
      ],
    },
    {
      heading: 'Build Thirty Posts Before You Publish One',
      paragraphs: [
        'The usual failure is not bad content. It is starting with four ideas, publishing them across a week, and then facing a blank calendar on day five with the page already demanding to be fed.',
        'A thirty-post bank built before launch is the difference between a page that survives month one and one that does not.',
      ],
    },
    {
      heading: 'And No Numbers Promised',
      paragraphs: [
        'No follower count, no income figure, no timeline where this "takes off". No engagement pods and no bots — both are covered only as things to avoid.',
        'Most pages take months, and the guide says so in the module rather than in the small print.',
      ],
    },
  ],
  bulletPoints: [
    'Six faceless formats that never show you',
    'Picking a niche you will still want in three months',
    'The 30-post bank built before you publish anything',
    'The 1.5-second hook, and writing text-on-screen',
    'Batching a week in one sitting',
    'What to do at 0 views, 1,000 and 10,000',
    'The comment-to-DM funnel, and selling without wrecking the page',
    '30-post content bank sheet, posting calendar, hook swipe file, analytics log',
  ],
  faqs: [
    { question: 'What exactly do I receive?', answer: 'Five PDFs in one ZIP, delivered instantly: three modules plus the Tracker Pack.' },
    {
      question: 'Do I need to show my face at any point?',
      answer: 'No. Every format in the guide works without it, and that is the premise rather than a workaround.',
    },
    {
      question: 'How many followers will I get?',
      answer:
        'No number is promised, here or in the guide. Most pages take months, and a fair number never work — the module on the long game is explicit about that rather than optimistic.',
    },
    {
      question: 'Does it cover engagement pods or growth services?',
      answer: 'Only as things not to do. They do not work, they damage reach, and the guide covers why.',
    },
    { question: 'Is it Instagram or YouTube?', answer: 'Mostly Instagram, with the formats and hook principles applying to short-form on either.' },
    {
      question: 'Refunds?',
      answer:
        "Digital files can't be returned once downloaded, so this is a final sale. Please read the contents above before buying. If a file doesn't arrive or won't open, message me and I'll fix it immediately.",
    },
  ],
  disclaimer:
    'Creator OS provides general guidance on making and publishing short-form content. It is not business, marketing or financial advice, and no audience size, follower count, reach, engagement, income or outcome of any kind is promised or guaranteed. Most pages take months to build an audience and many never do. Platform algorithms, rules and features change without notice. Nothing here recommends engagement pods, follower services, bots or any tactic that breaches a platform’s terms.',
  tags: [
    'faceless instagram page',
    'content creation india',
    'reels hook',
    'instagram growth',
    'short form content',
    'content batching',
    'creator beginner',
  ],
  gallery: [],
  deliveryFiles: [
    'Module-01-THE-PAGE.pdf',
    'Module-02-THE-CONTENT.pdf',
    'Module-03-THE-LONG-GAME.pdf',
    'Tracker-Pack.pdf',
    'Creator-OS-Complete.zip',
  ],
  pairSlug: 'money-os',
};
