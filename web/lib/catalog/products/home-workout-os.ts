import type { Product } from '../types';
import { SELF_IMPROVEMENT } from '../categories';

/**
 * Source: Dashrize-Products/PRODUCT-PIPELINE/Tier 2 - Rs 999 (core
 * products)/Home Workout OS/BRIEF.md.
 *
 * Compliance (BRIEF guardrails): general fitness information, not medical
 * advice. Sharp joint pain means stop and see a doctor. No before-and-after
 * photos — which is also why `gallery` stays empty beyond the missing cover.
 */
export const homeWorkoutOs: Product = {
  slug: 'home-workout-os',
  title: 'Home Workout OS — No Gym, No Equipment, No Membership',
  shortTitle: 'Home Workout OS',
  tagline:
    'Real strength from a loaded backpack, a doorway and a progression rule that never runs out. Six movement patterns with ladders from wall push-up to full, three days a week at 45 minutes, and the fix for why home training stalls. 23 designed pages + tracker pack. One payment, lifetime access.',
  price: 999,
  pageCount: 23,
  trackerCount: 3,
  audience: 'Anyone without gym access — no budget, no gym nearby, or no wish to train in a mixed gym',
  accent: { name: 'teal', hex: '#0ca678' },
  category: SELF_IMPROVEMENT,
  format: 'PDF',
  fileCount: 5,
  modules: [
    {
      id: '01',
      title: 'THE MOVES',
      pageCount: 8,
      highlights: [
        'The six patterns that cover the whole body — everything else is a variation.',
        'Progression ladders for each: wall push-up to full, bodyweight squat to single-leg, glute bridge to single-leg.',
        'Form cues, and how to film yourself to check them when nobody is there to correct you.',
      ],
    },
    {
      id: '02',
      title: 'THE PLAN',
      pageCount: 8,
      highlights: [
        'Three days a week, A/B split, 45 minutes.',
        'The backpack as your barbell — how to load it and how to actually weigh it.',
        'The ₹800 home gym, in order of purchase: a band first, then adjustable dumbbells.',
        'What to do in a hostel room with a roommate asleep.',
      ],
    },
    {
      id: '03',
      title: 'THE PROGRESSION',
      pageCount: 7,
      highlights: [
        'Why home training stalls, and the four fixes in order: add reps, then slow the lowering to three seconds, then move up the ladder, then add load.',
        'The 90-day roadmap, with expectations that match what actually happens.',
      ],
    },
  ],
  longDescription: [
    {
      heading: 'Most Fitness Advice Assumes A Gym You Do Not Have',
      paragraphs: [
        'Either there is no gym near you, or the membership is not in the budget, or you live with family and it is not practical, or you have no interest in training in a mixed gym. All four are ordinary, and none of them mean bodyweight training is a consolation prize.',
        'What home training actually lacks is not equipment. It is a way to keep getting harder, which is why most people plateau in month two and quit in month three.',
      ],
    },
    {
      heading: 'A Rule That Does Not Run Out',
      paragraphs: [
        'Add reps. Then slow the lowering to three seconds — the same movement, roughly twice as hard, for free. Then move up the ladder. Then add load, which is what the backpack is for.',
        'Applied in that order, six movement patterns will keep producing progress far longer than the equipment you do not own would have.',
      ],
    },
  ],
  bulletPoints: [
    'Six movement patterns covering the whole body',
    'Progression ladders: wall push-up to full, squat to single-leg',
    'Three days a week, A/B split, 45 minutes',
    'The backpack as a barbell — loading and weighing it',
    'The ₹800 home gym, in purchase order',
    'Training in a hostel room without waking anyone',
    'Workout log built around the ladders, 90-day chain, per-movement checklist',
  ],
  faqs: [
    { question: 'What exactly do I receive?', answer: 'Five PDFs in one ZIP, delivered instantly: three modules plus the Tracker Pack.' },
    {
      question: 'I own no equipment at all. Can I still start?',
      answer:
        'Yes. Every ladder starts at a step that needs nothing but a wall and a floor. The backpack matters later, and the band and dumbbells are optional even then.',
    },
    {
      question: 'Will I actually build muscle without weights?',
      answer:
        'For a considerable time, yes — because the ladders keep raising the difficulty. The guide is honest about where bodyweight training eventually limits you and what you would need past that point.',
    },
    {
      question: 'I already have Glow-Up OS. Is this a repeat?',
      answer:
        'No. Glow-Up OS assumes gym access as the default and treats home training as the fallback. This is the reverse, and goes far deeper into progression without equipment.',
    },
    {
      question: 'Refunds?',
      answer:
        "Digital files can't be returned once downloaded, so this is a final sale. Please read the contents above before buying. If a file doesn't arrive or won't open, message me and I'll fix it immediately.",
    },
  ],
  disclaimer:
    'Home Workout OS provides general fitness information. It is not medical advice, and no physical result is promised or guaranteed. Speak to a doctor before starting or changing how you train, particularly with an existing injury or condition. Sharp joint pain is not something to train through — stop and see a doctor. Form comes before load at every step.',
  tags: [
    'home workout india',
    'no equipment workout',
    'bodyweight training',
    'calisthenics beginner',
    'push up progression',
    'backpack workout',
    'hostel workout',
    'no gym fitness',
  ],
  gallery: [],
  deliveryFiles: [
    'Module-01-THE-MOVES.pdf',
    'Module-02-THE-PLAN.pdf',
    'Module-03-THE-PROGRESSION.pdf',
    'Tracker-Pack.pdf',
    'Home-Workout-OS-Complete.zip',
  ],
  pairSlug: 'glow-up-os',
};
