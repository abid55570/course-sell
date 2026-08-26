import type { Product } from '../types';
import { STUDY_SKILLS } from '../categories';

/**
 * Source: Dashrize-Products/PRODUCT-PIPELINE/Tier 2 - Rs 999 (core
 * products)/Presence OS/BRIEF.md.
 *
 * Compliance (BRIEF guardrails): general skills guidance, and "signpost
 * counselling if fear of speaking is disabling" — so the disclaimer names
 * Tele-MANAS rather than treating a genuine phobia as a confidence problem.
 */
export const presenceOs: Product = {
  slug: 'presence-os',
  title: 'Presence OS — Speak To A Room Without Your Voice Shaking',
  shortTitle: 'Presence OS',
  tagline:
    'Presentations, vivas, meetings and the campus stage. What is actually happening in your body, why it peaks in the first thirty seconds, and the twenty-rep ladder from speaking up in class to presenting to a hall. 18 designed pages + tracker pack. One payment, lifetime access.',
  price: 999,
  pageCount: 18,
  trackerCount: 4,
  audience: 'Students who have to present, freshers in a first job, and anyone who dreads a viva',
  accent: { name: 'indigo', hex: '#4263eb' },
  category: STUDY_SKILLS,
  format: 'PDF',
  fileCount: 5,
  modules: [
    {
      id: '01',
      title: 'THE FEAR',
      pageCount: 6,
      highlights: [
        'What is actually happening in your body, and why it peaks in the first thirty seconds.',
        'The audience is not hostile and is barely paying attention — both of which are true and neither of which helps until you believe them.',
        'Preparing the opening line, so that the worst moment of the whole thing is the one part that is scripted.',
      ],
    },
    {
      id: '02',
      title: 'THE DELIVERY',
      pageCount: 6,
      highlights: [
        'Voice: volume, pace, and ending your sentences downward.',
        'Where to put your hands and your feet.',
        'Eye contact across a room, which is not the same skill as eye contact with a person.',
        'Reading your slides is the failure mode — what to do instead, and slides that support you rather than compete with you.',
      ],
    },
    {
      id: '03',
      title: 'THE ROOM',
      pageCount: 6,
      highlights: [
        'Vivas, and the questions afterwards.',
        'Meetings: how to make one useful point rather than none.',
        'Being interrupted or talked over.',
        'Online presentations, which fail differently.',
        'The 20-rep ladder, from speaking in a class to presenting to a hall.',
      ],
    },
  ],
  longDescription: [
    {
      heading: 'The First Thirty Seconds Are The Whole Problem',
      paragraphs: [
        'Your heart rate climbs, your hands go, your voice thins — and then, usually, it settles. The fear is front-loaded, and almost everyone judges the entire experience by its worst thirty seconds.',
        'So script exactly those. If the opening is the one part you have said out loud twenty times, the spike arrives while you are on rails.',
      ],
    },
    {
      heading: 'Social OS Stops At The Conversation',
      paragraphs: [
        'Talking to one person and talking to a room are different skills with different failure modes. A room does not respond, cannot be read easily, and will let a silence sit.',
        'This is the room: volume, pace, hands, eye contact across distance, and what to do with slides that everyone else reads aloud.',
      ],
    },
    {
      heading: 'A Ladder, Not A Leap',
      paragraphs: [
        'Twenty graded reps, starting with one sentence in a class you were going to sit through anyway. Nobody talks themselves into confidence, and nobody needs to if the first rung is low enough.',
      ],
    },
  ],
  bulletPoints: [
    'Why the fear peaks in the first 30 seconds — and scripting exactly those',
    'Voice: volume, pace, ending sentences down',
    'Hands, feet, and eye contact across a room',
    'Slides that support you instead of competing with you',
    'Vivas and the questions after',
    'Making one useful point in a meeting',
    'Being interrupted, and online presentations',
    'Rep ladder log, prep sheet, recording comparison, feedback capture',
  ],
  faqs: [
    { question: 'What exactly do I receive?', answer: 'Five PDFs in one ZIP, delivered instantly: three modules plus the Tracker Pack.' },
    {
      question: 'I have a presentation next week. Where do I start?',
      answer:
        'Module 01 and the prep sheet, in that order. Script the opening line and record yourself once — that combination does more in an evening than anything else here.',
    },
    {
      question: 'I already own Social OS.',
      answer: 'Social OS covers one-to-one conversation and stops short of speaking to a room, which is where most of the fear actually lives. They pair rather than overlap.',
    },
    {
      question: 'What if my fear is severe?',
      answer:
        'If it is stopping you attending classes or work, that is worth talking to a professional about rather than practising through. The guide says so and points to where.',
    },
    {
      question: 'Refunds?',
      answer:
        "Digital files can't be returned once downloaded, so this is a final sale. Please read the contents above before buying. If a file doesn't arrive or won't open, message me and I'll fix it immediately.",
    },
  ],
  disclaimer:
    'Presence OS provides general communication-skills guidance. It is not psychological, medical or therapeutic advice, and no outcome — in a viva, an interview, a presentation or a meeting — is promised or guaranteed. A fear of speaking that is severe enough to stop you attending classes, work or social situations may be a diagnosable anxiety condition, and practice alone is not the right tool for it: please speak to a doctor or a qualified counsellor. In India, the government\'s Tele-MANAS helpline is 14416, free and available at any time.',
  helplines: [
    {
      name: 'Tele-MANAS',
      number: '14416',
      context:
        'If fear of speaking is severe enough to stop you attending classes, work or social situations, Tele-MANAS is free and available at any time.',
    },
  ],
  tags: [
    'public speaking india',
    'presentation skills',
    'viva preparation',
    'stage fear',
    'speaking anxiety',
    'meeting confidence',
    'campus presentation',
  ],
  gallery: [],
  deliveryFiles: [
    'Module-01-THE-FEAR.pdf',
    'Module-02-THE-DELIVERY.pdf',
    'Module-03-THE-ROOM.pdf',
    'Tracker-Pack.pdf',
    'Presence-OS-Complete.zip',
  ],
  pairSlug: 'social-os',
};
