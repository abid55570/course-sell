import type { Product } from '../types';
import { STUDY_SKILLS } from '../categories';

/**
 * Source: Dashrize-Products/PRODUCT-PIPELINE/Tier 2 - Rs 999 (core
 * products)/Exam Sprint OS/BRIEF.md.
 *
 * Compliance (BRIEF guardrails): no rank, score or selection claims, and the
 * brief asks specifically to "keep the Tele-MANAS helpline 14416 visible —
 * this audience is under real pressure at exactly this moment". It is in the
 * disclaimer and carried as a helpline, the same as Study OS.
 */
export const examSprintOs: Product = {
  slug: 'exam-sprint-os',
  title: 'Exam Sprint OS — Sixty Days Out, And Behind',
  shortTitle: 'Exam Sprint OS',
  tagline:
    'The triage plan for when you cannot cover everything and have to score anyway. Weightage analysis in one afternoon, deciding what you will consciously not study, and a sixty-day plan built backwards from the date. 19 designed pages + 5-sheet tracker pack. No rank promises. One payment, lifetime access.',
  price: 999,
  pageCount: 19,
  trackerCount: 5,
  audience: 'Board and competitive-exam candidates in the final two months, and their parents',
  accent: { name: 'orange', hex: '#e8590c' },
  category: STUDY_SKILLS,
  format: 'PDF',
  fileCount: 5,
  modules: [
    {
      id: '01',
      title: 'TRIAGE',
      pageCount: 6,
      highlights: [
        'Weightage analysis in one afternoon — count the marks per chapter across past papers and sort.',
        'Deciding what you will consciously not study. This is the module, and it is the decision people avoid until it is made for them.',
        'The honest audit of where you actually are.',
        'Building the 60-day plan backwards from the date.',
      ],
    },
    {
      id: '02',
      title: 'THE SPRINT',
      pageCount: 7,
      highlights: [
        'Recall over reading, always — at this stage there is no time for anything passive.',
        'Past papers as the primary material rather than the final check.',
        'The error log, and the Sunday count.',
        'What a realistic day looks like now, and why fourteen hours is a story rather than a plan.',
      ],
    },
    {
      id: '03',
      title: 'THE LAST TEN DAYS AND THE DAY',
      pageCount: 6,
      highlights: [
        'What to stop doing.',
        'Sleep as the priority over the extra hour — an all-nighter before an exam is a bad trade every time.',
        'Exam-day protocol: the first three minutes, order of attack, when to abandon a question, what to do if you blank.',
        'After the exam, whatever happens.',
      ],
    },
  ],
  longDescription: [
    {
      heading: 'You Are Behind. That Is The Starting Condition.',
      paragraphs: [
        'Study OS is the year-long system, and it assumes you have a year. This assumes you have sixty days, an unfinished syllabus, and no possibility of covering all of it.',
        'The work is triage: counting what each chapter is actually worth, being honest about where you are, and then deciding — deliberately, on paper — what you are not going to study. Made consciously, that decision buys you the marks. Avoided, it gets made for you at random in the last week.',
      ],
    },
    {
      heading: 'Nothing Passive Survives This Timeline',
      paragraphs: [
        'Re-reading was always weak and at sixty days it is unaffordable. Everything here is recall and past papers, with an error log that turns your wrong answers into the only syllabus that still matters.',
      ],
    },
    {
      heading: 'And No Promises',
      paragraphs: [
        'No rank, no score, no selection. Your result depends on where you started, what you get asked, and a great deal outside anyone’s control. What this fixes is how the remaining sixty days are spent, which is the part you hold.',
      ],
    },
  ],
  bulletPoints: [
    'Weightage analysis in one afternoon',
    'Deciding, on paper, what you will not study',
    'A 60-day plan built backwards from the date',
    'Recall and past papers as the primary work',
    'The error log and the Sunday count',
    'What a realistic day looks like — and why 14 hours is not one',
    'Exam-day protocol, including what to do if you blank',
    '60-day countdown calendar, weightage sheet, error log, mock log, last-10-days checklist',
  ],
  faqs: [
    { question: 'What exactly do I receive?', answer: 'Five PDFs in one ZIP, delivered instantly: three modules plus the Tracker Pack.' },
    {
      question: 'I already own Study OS. Is this the same thing?',
      answer:
        'No. Study OS is the year-long system, built on the assumption you have time to cover the syllabus properly. This one assumes you do not, and is largely about choosing what to drop.',
    },
    {
      question: 'Will this get me a good rank?',
      answer:
        "I won't claim that, and anyone who does is guessing. What this changes is how the last sixty days are spent, which is the part you actually control.",
    },
    { question: 'Which exam is it for?', answer: 'Any of them. Weightage counting, recall, past papers and error logging are subject-agnostic; you fill in the weightage sheet for your own syllabus.' },
    { question: 'Is it too late at thirty days?', answer: 'The plan is built backwards from your date, so it works from a shorter runway too — with fewer options, which the guide states plainly rather than pretending otherwise.' },
    {
      question: 'Refunds?',
      answer:
        "Digital files can't be returned once downloaded, so this is a final sale. Please read the contents above before buying. If a file doesn't arrive or won't open, message me and I'll fix it immediately.",
    },
  ],
  disclaimer:
    'Exam Sprint OS provides general study-skills guidance for students. It is not medical or psychological advice, and no rank, score, percentage, selection or admission is promised or guaranteed. Results depend on your starting point, syllabus, available time, effort and factors outside anyone\'s control. If exam pressure is affecting a student\'s sleep, eating or mood, or if they have thoughts of harming themselves, please speak to a parent, teacher, school counsellor or doctor. In India, the government\'s Tele-MANAS mental health helpline is 14416, free and available at any time.',
  helplines: [
    {
      name: 'Tele-MANAS',
      number: '14416',
      context:
        "If exam pressure is affecting a student's sleep, eating or mood, or if they have thoughts of harming themselves, speak to a parent, teacher, school counsellor or doctor. Tele-MANAS is free and available at any time.",
    },
  ],
  tags: [
    'exam preparation last 60 days',
    'board exam revision',
    'competitive exam sprint',
    'syllabus triage',
    'past papers method',
    'error log',
    'exam day strategy',
    'exam stress',
  ],
  gallery: [{ filename: '1-cover-thumbnail.png', role: 'cover', alt: 'Exam Sprint OS cover — last-minute revision that sticks.' }],
  deliveryFiles: [
    'Module-01-TRIAGE.pdf',
    'Module-02-THE-SPRINT.pdf',
    'Module-03-LAST-10-DAYS-AND-THE-DAY.pdf',
    'Tracker-Pack.pdf',
    'Exam-Sprint-OS-Complete.zip',
  ],
  pairSlug: 'study-os',
};
