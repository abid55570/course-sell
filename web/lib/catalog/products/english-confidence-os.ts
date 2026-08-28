import type { Product } from '../types';
import { STUDY_SKILLS } from '../categories';

/**
 * Source: Dashrize-Products/PRODUCT-PIPELINE/Tier 2 - Rs 999 (core
 * products)/English Confidence OS/BRIEF.md.
 *
 * Compliance (BRIEF guardrails): never mock any accent or regional
 * background; not a certification and not a guarantee of fluency; respectful
 * about medium of instruction. The copy below takes the BRIEF's own position —
 * "your accent is not the problem" — rather than treating Indian English as
 * something to correct.
 *
 * `gallery` is empty: no cover graphic exists yet (PRODUCT-PIPELINE/
 * BUILD-STATUS.txt). The storefront generates a fallback.
 */
export const englishConfidenceOs: Product = {
  slug: 'english-confidence-os',
  title: 'English Confidence OS — You Can Read It Fine. You Freeze When You Speak.',
  shortTitle: 'English Confidence OS — Speak Without Freezing',
  tagline:
    'Not grammar drills. The sentence bank, the practice ladder and the interview answers, for Indians who read English fine but freeze when they have to speak it. Your accent is not the problem. 25 designed pages + tracker pack. One payment, lifetime access.',
  price: 999,
  pageCount: 25,
  trackerCount: 4,
  audience: 'Indian students and young workers from Hindi and regional-medium backgrounds',
  accent: { name: 'blue', hex: '#1c7ed6' },
  category: STUDY_SKILLS,
  format: 'PDF',
  fileCount: 6,
  modules: [
    {
      id: '01',
      title: 'WHY YOU FREEZE',
      pageCount: 6,
      highlights: [
        'It is not vocabulary. It is retrieval under pressure, plus the fear of being laughed at — two different problems with two different fixes.',
        'The Indian-English question, answered directly: your accent is not a problem, and here is why.',
        'What actually gets judged in an interview, which is not what you think it is.',
      ],
    },
    {
      id: '02',
      title: 'THE SENTENCE BANK',
      pageCount: 7,
      highlights: [
        '100 sentences that cover most daily situations: introductions, requests, disagreement, small talk, explaining your work.',
        'Learn patterns, not words — why a hundred sentences beats a thousand vocabulary cards.',
        'How to buy yourself thinking time in English without filling it with "umm".',
      ],
    },
    {
      id: '03',
      title: 'THE PRACTICE LADDER',
      pageCount: 6,
      highlights: [
        'Twenty reps, in order: talking to yourself, then a shopkeeper, then a colleague, then a room.',
        'Recording yourself, and the two-minute drill.',
        'Reading aloud daily, and why it works faster than listening.',
      ],
    },
    {
      id: '04',
      title: 'THE INTERVIEW AND THE ROOM',
      pageCount: 6,
      highlights: [
        'The eight interview questions, answered in English, with the structure written out.',
        'Presenting to a class or a team.',
        'Professional emails and messages.',
        'What to do when you lose the word mid-sentence — the recovery move nobody teaches.',
      ],
    },
  ],
  longDescription: [
    {
      heading: 'Two Different Problems, One Wrong Fix',
      paragraphs: [
        'You read English without difficulty. You write it well enough. Then someone asks you a question in a room and the sentence will not come out, and afterwards you know exactly what you should have said.',
        'That is not a vocabulary gap, and another grammar app will not close it. It is retrieval under pressure combined with the fear of being laughed at — and those need practice structured for pressure, not more input.',
      ],
    },
    {
      heading: 'Your Accent Is Not The Problem',
      paragraphs: [
        'This guide takes that seriously rather than saying it politely and then teaching you to sound like someone else. Indian English is English. What costs people interviews is hesitation, not vowels, and the whole book is aimed at the hesitation.',
        'Nothing here mocks any accent, any regional background, or anyone whose schooling was in another medium.',
      ],
    },
    {
      heading: 'A Ladder, Because Confidence Is Not A Decision',
      paragraphs: [
        'Module 03 is twenty graded reps, starting with talking to yourself in a room alone. You do not need courage for rep one, and by rep twenty you are presenting. That ordering is the product.',
      ],
    },
  ],
  bulletPoints: [
    'Why you freeze: retrieval under pressure, not vocabulary',
    'The Indian-English question answered without condescension',
    '100 sentences covering most daily situations',
    'Patterns rather than word lists',
    'A 20-rep practice ladder from talking to yourself to presenting',
    'The eight interview questions, with structure',
    'What to do when you lose the word mid-sentence',
    '20-rep ladder log, sentence-bank flashcards, 10-minute drill tracker, recording comparison sheet',
  ],
  faqs: [
    {
      question: 'What exactly do I receive?',
      answer: 'Six PDFs in one ZIP, delivered instantly: four modules plus the Tracker Pack.',
    },
    {
      question: 'Will this fix my accent?',
      answer:
        'It will not try to. Your accent is not what is costing you interviews — hesitation is, and that is what the book works on. Indian English is English.',
    },
    {
      question: 'Is this a grammar course?',
      answer:
        'No. You already know more grammar than you can use under pressure. This is about producing sentences in real time, which is a different skill entirely.',
    },
    {
      question: 'I studied in a regional-medium school. Is this written for me?',
      answer:
        'Yes, explicitly. It is written for people who can read English comfortably and freeze when speaking, which is the most common outcome of exactly that background — and it does not treat it as a deficiency.',
    },
    {
      question: 'Does it come with a certificate?',
      answer:
        'No. It is a system for practising, not a course or a qualification, and it does not guarantee fluency. What it gives you is a ladder and a bank of sentences, and both work only if you use them.',
    },
    {
      question: 'How long until I improve?',
      answer:
        'The tracker runs a ten-minute daily drill and twenty graded reps. People usually notice the difference somewhere in the middle of the ladder, not at the end of it.',
    },
    {
      question: 'Refunds?',
      answer:
        "Digital files can't be returned once downloaded, so this is a final sale. Please read the contents above before buying. If a file doesn't arrive or won't open, message me and I'll fix it immediately.",
    },
  ],
  disclaimer:
    'English Confidence OS provides general language-practice guidance. It is not a course, a certification or a qualification, and it does not guarantee fluency, an interview result, a job or an admission — improvement depends on how much you practise. It is not a substitute for a teacher or a speech-language professional where one is needed. Indian English is a legitimate form of English: nothing in this guide asks you to change your accent or treats any regional background or medium of instruction as a disadvantage.',
  tags: [
    'english speaking practice',
    'spoken english india',
    'english confidence',
    'interview english',
    'fluency practice',
    'english for freshers',
    'regional medium english',
    'public speaking india',
    'professional email english',
    'sentence bank',
    'english hesitation',
  ],
  gallery: [{ filename: '1-cover-thumbnail.png', role: 'cover', alt: 'English Confidence OS cover — speaking under pressure.' }],
  deliveryFiles: [
    'Module-01-WHY-YOU-FREEZE.pdf',
    'Module-02-SENTENCE-BANK.pdf',
    'Module-03-PRACTICE-LADDER.pdf',
    'Module-04-THE-INTERVIEW.pdf',
    'Tracker-Pack.pdf',
    'English-Confidence-OS-Complete.zip',
  ],
  // BRIEF: "the missing half of the interview module" in Career OS.
  pairSlug: 'career-os',
};
