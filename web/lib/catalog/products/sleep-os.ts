import type { Product } from '../types';
import { SELF_IMPROVEMENT } from '../categories';

/**
 * Source: Dashrize-Products/PRODUCT-PIPELINE/Tier 2 - Rs 999 (core
 * products)/Sleep OS/BRIEF.md.
 *
 * Compliance (BRIEF guardrails): general sleep-hygiene information, not
 * medical advice. Persistent insomnia, snoring and daytime collapse are routed
 * to a doctor. Nothing here recommends sleep medication or melatonin dosing —
 * deliberately, since both are sold freely in India and neither belongs in a
 * PDF.
 *
 * `gallery` is empty: no cover graphic exists for this product yet (see
 * PRODUCT-PIPELINE/BUILD-STATUS.txt). The storefront generates a fallback.
 */
export const sleepOs: Product = {
  slug: 'sleep-os',
  title: 'Sleep OS — Awake At 2am, Destroyed By 8 (Causes · Protocol · Hard Cases)',
  shortTitle: 'Sleep OS — The Sleep Protocol',
  tagline:
    'Fix your sleep and everything else gets easier. Why you are exhausted and still awake, the protocol that starts with your wake time rather than your bedtime, and the hard cases — night shifts, exam season, a shared room. 19 designed pages + tracker pack. One payment, lifetime access.',
  price: 999,
  pageCount: 19,
  trackerCount: 4,
  audience: 'Students, night-shift and BPO workers, anyone whose sleep collapsed after college',
  accent: { name: 'indigo', hex: '#4263eb' },
  category: SELF_IMPROVEMENT,
  format: 'PDF',
  fileCount: 5,
  modules: [
    {
      id: '01',
      title: 'WHY YOU CANNOT SLEEP',
      pageCount: 6,
      highlights: [
        'Light, caffeine timing, the phone, and an unfinished day — the four inputs that decide the night.',
        'Why you are exhausted and still awake, explained properly rather than blamed on discipline.',
        'The difference between tired and sleepy, which is the distinction the whole protocol rests on.',
      ],
    },
    {
      id: '02',
      title: 'THE PROTOCOL',
      pageCount: 7,
      highlights: [
        'Fixed wake time before fixed bedtime. This ordering is the part people get backwards.',
        'Morning light, and how little of it is enough.',
        'The caffeine cut-off — and an honest count of how much chai is actually in your day.',
        'The wind-down hour and the shutdown ritual.',
        'Room setup on an Indian budget: heat, noise, shared rooms, and no blackout curtains.',
      ],
    },
    {
      id: '03',
      title: 'HARD CASES',
      pageCount: 6,
      highlights: [
        'Night shifts and rotational shifts, which most sleep advice simply ignores.',
        'Exam season, and sharing a room.',
        'Naps done right.',
        'What to do at 3am when you are awake and angry about it.',
        'When it is not a habit problem: the signs that mean see a doctor.',
      ],
    },
  ],
  longDescription: [
    {
      heading: 'You Are Not An Insomniac',
      paragraphs: [
        'You are on your phone, in a bright room, at 1am. Then you lie down and your body — which has had no signal that the day is ending — does exactly what you trained it to do.',
        'Almost nobody in this position has a sleep disorder. They have four inputs pointing the wrong way, and a bedtime they keep trying to fix directly instead of fixing the wake time that sets it.',
      ],
    },
    {
      heading: 'Written For The Room You Actually Sleep In',
      paragraphs: [
        'Most sleep advice assumes a dark, quiet, cool, private bedroom. This one assumes heat, street noise, a shared room, a light someone else controls, and no blackout curtains — and gives you what to do in that room rather than the one in the photograph.',
      ],
    },
    {
      heading: 'And It Tells You When To Stop Reading',
      paragraphs: [
        'Module 03 ends on the signs that are not habits: loud snoring with daytime collapse, sleep that does not improve when the inputs do, waking gasping. Those are medical, the guide says so, and it points at a doctor rather than another routine. It recommends no medication and no melatonin dose, on purpose.',
      ],
    },
  ],
  bulletPoints: [
    'Why you are exhausted and still awake — the four inputs that decide it',
    'Fixed wake time first: the ordering most people get backwards',
    'An honest caffeine audit, chai included',
    'Room setup for heat, noise and shared rooms on no budget',
    'Night shifts, rotational shifts, exam season and naps',
    'What to do at 3am, and the signs that mean see a doctor',
    'Two-week sleep log, caffeine timing sheet, wind-down checklist, 30-day chain',
  ],
  faqs: [
    {
      question: 'What exactly do I receive?',
      answer: 'Five PDFs in one ZIP, delivered instantly: three modules plus the Tracker Pack.',
    },
    {
      question: 'I work night shifts. Is this useless to me?',
      answer:
        'The opposite — Module 03 exists largely for you. Rotational and night shifts get their own section, because the standard advice is written for people who sleep when it is dark and is close to worthless otherwise.',
    },
    {
      question: 'Does it tell me what to take?',
      answer:
        'No. It recommends no sleep medication and no melatonin dosing, deliberately. Both are sold casually in India, both belong in a conversation with a doctor, and neither belongs in a PDF.',
    },
    {
      question: 'I share a room. Half of this cannot apply.',
      answer:
        'It is written on the assumption that you do. Heat, noise, a shared light switch and no blackout curtains are treated as the normal case, not the exception.',
    },
    {
      question: 'How long before it works?',
      answer:
        'The two-week log exists because that is roughly the honest window for a wake-time change to settle. It is not one night.',
    },
    {
      question: 'Refunds?',
      answer:
        "Digital files can't be returned once downloaded, so this is a final sale. Please read the contents above before buying. If a file doesn't arrive or won't open, message me and I'll fix it immediately.",
    },
  ],
  disclaimer:
    'Sleep OS provides general sleep-hygiene information. It is not medical advice, and it recommends no medication, supplement or melatonin dose of any kind. Persistent insomnia, loud snoring, waking gasping for breath, or exhaustion that continues after your habits improve can indicate a treatable medical condition, including sleep apnoea — please see a doctor rather than working harder at a routine. If low mood or anxiety is keeping you awake, India\'s government Tele-MANAS helpline is 14416, free and available at any time.',
  helplines: [
    {
      name: 'Tele-MANAS',
      number: '14416',
      context:
        'If low mood or anxiety is what is keeping you awake, Tele-MANAS is free and available at any time.',
    },
  ],
  tags: [
    'how to sleep better',
    'insomnia india',
    'sleep hygiene',
    'phone before bed',
    'night shift sleep',
    'bpo sleep schedule',
    'caffeine cutoff',
    'wind down routine',
    'sleep schedule fix',
    'exam season sleep',
    'shared room sleep',
    'wake up early',
  ],
  gallery: [],
  deliveryFiles: [
    'Module-01-WHY-YOU-CANNOT-SLEEP.pdf',
    'Module-02-THE-PROTOCOL.pdf',
    'Module-03-HARD-CASES.pdf',
    'Tracker-Pack.pdf',
    'Sleep-OS-Complete.zip',
  ],
};
