import type { Product } from '../types';
import { SELF_IMPROVEMENT } from '../categories';

/**
 * Source: Dashrize-Products/PRODUCT-PIPELINE/Tier 2 - Rs 999 (core
 * products)/Gym Beginner OS/BRIEF.md.
 *
 * Compliance (BRIEF guardrails): general fitness information, not medical
 * advice; form before load; sharp joint pain means stop.
 *
 * The brief is explicit that the gym-anxiety chapter is the differentiator —
 * "every competitor writes the workout plan and none of them write the part
 * about being watched, which is the actual blocker" — so Module 01 leads the
 * copy rather than the training plan.
 */
export const gymBeginnerOs: Product = {
  slug: 'gym-beginner-os',
  title: 'Gym Beginner OS — Your First 90 Days, Including Walking In',
  shortTitle: 'Gym Beginner OS',
  tagline:
    'For the person who paid for the membership and is too intimidated to use it. What to wear, what the etiquette actually is, what every machine is for, and the first 90 days — plus the part nobody writes about, which is being watched. 18 designed pages + tracker pack. One payment, lifetime access.',
  price: 999,
  pageCount: 18,
  trackerCount: 4,
  audience: 'Complete beginners with a membership they are not using properly',
  accent: { name: 'blue', hex: '#1c7ed6' },
  category: SELF_IMPROVEMENT,
  format: 'PDF',
  fileCount: 5,
  modules: [
    {
      id: '01',
      title: 'WALKING IN',
      pageCount: 6,
      highlights: [
        'What to wear, what to carry, and what the etiquette actually is.',
        'Gym anxiety handled honestly: a fixed time, headphones, knowing your plan before you enter, and using the dumbbell area rather than waiting on machines.',
        'Choosing a gym — including what a good one does about staring.',
      ],
    },
    {
      id: '02',
      title: 'THE MACHINES AND THE MOVES',
      pageCount: 6,
      highlights: [
        'What each machine is for, in plain language.',
        'The six lifts that matter, and how to learn them without a trainer.',
        'Warm-up, rest times, and how much weight to start with.',
        'When a personal trainer is worth paying for, and when they are selling you supplements.',
      ],
    },
    {
      id: '03',
      title: 'THE FIRST 90 DAYS',
      pageCount: 6,
      highlights: [
        'The A/B plan and progressive overload.',
        'What soreness means, and what it does not.',
        'The plateau at week six, which arrives for everyone.',
        'Supplements, honestly — and what to ignore.',
        'When to deload, and when to see a doctor.',
      ],
    },
  ],
  longDescription: [
    {
      heading: 'The Blocker Is Not The Workout Plan',
      paragraphs: [
        'You have the membership. You have watched enough videos to know roughly what a squat is. And you still have not gone properly, because the actual obstacle is walking into a room full of people who look like they know exactly what they are doing.',
        'Every other guide writes the training programme and skips this. It is the first module here, because it is the thing standing between you and everything else.',
      ],
    },
    {
      heading: 'Nobody Is Watching You',
      paragraphs: [
        'They are all worried about themselves. That is true, and it does not help much on its own — so the module is practical instead: go at a fixed time, know your exact plan before you enter, use the dumbbell area rather than hovering near a machine someone is on.',
        'Knowing your plan before you walk in is what the confident person is doing. That is the whole trick.',
      ],
    },
    {
      heading: 'Then The Boring, Correct Part',
      paragraphs: [
        'Six lifts. Start with a weight you could manage fifteen times and use it for eight. Add slowly. Expect the week-six plateau. Deload when you need to.',
        'None of it is exciting, and it is what actually works over ninety days.',
      ],
    },
  ],
  bulletPoints: [
    'Gym anxiety handled as a real obstacle, not a pep talk',
    'What to wear, carry, and how the etiquette works',
    'Every machine explained in plain language',
    'The six lifts that matter, learnable without a trainer',
    'How much weight to start with, and how to add',
    'The week-six plateau, and what soreness does not mean',
    'Supplements, honestly',
    'Workout log, first-visit checklist, 90-day chain, machine-familiarity checklist',
  ],
  faqs: [
    { question: 'What exactly do I receive?', answer: 'Five PDFs in one ZIP, delivered instantly: three modules plus the Tracker Pack.' },
    {
      question: 'I am genuinely anxious about going. Is that covered or just mentioned?',
      answer:
        'It is the first module, not a paragraph. Fixed times, a plan you already know, where to stand, and what a decent gym does about staring.',
    },
    { question: 'Do I need a personal trainer?', answer: 'Usually not at the start. The guide is specific about when one is worth paying for and when they are really selling supplements.' },
    { question: 'I already own Glow-Up OS.', answer: 'Glow-Up OS assumes you can already function in a gym. This is written for the person standing outside it.' },
    {
      question: 'Refunds?',
      answer:
        "Digital files can't be returned once downloaded, so this is a final sale. Please read the contents above before buying. If a file doesn't arrive or won't open, message me and I'll fix it immediately.",
    },
  ],
  disclaimer:
    'Gym Beginner OS provides general fitness information. It is not medical advice, and no physical result is promised or guaranteed. Speak to a doctor before starting to train, particularly with an existing injury or condition. Form comes before load, always. Sharp joint pain is not something to train through — stop and see a doctor. No supplement is recommended or endorsed.',
  tags: [
    'gym for beginners india',
    'gym anxiety',
    'first time gym',
    'gym etiquette',
    'progressive overload',
    'beginner workout plan',
    'gym machines explained',
  ],
  gallery: [],
  deliveryFiles: [
    'Module-01-WALKING-IN.pdf',
    'Module-02-MACHINES-AND-MOVES.pdf',
    'Module-03-THE-FIRST-90-DAYS.pdf',
    'Tracker-Pack.pdf',
    'Gym-Beginner-OS-Complete.zip',
  ],
  pairSlug: 'home-workout-os',
};
