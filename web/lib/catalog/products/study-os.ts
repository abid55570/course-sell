import type { Product } from '../types';
import { STUDY_SKILLS } from '../categories';

/**
 * Source: Dashrize-Products/Study-OS/3 - LISTING TEXT/listing-copy-paste.md
 * Compliance (README): no rank, score or selection claims, ever. Keep the
 * Tele-MANAS helpline (14416) — present verbatim in the disclaimer below.
 */
export const studyOs: Product = {
  slug: 'study-os',
  title: 'Study OS — Six Hours, Nothing Remembered (System · Focus · Exam Craft)',
  shortTitle: 'Study OS — The Revision System',
  tagline:
    "You sat with the book for six hours and remembered nothing. That's not a discipline problem. The four study methods that actually work, the day 1/3/7/21 revision cycle, the phone protocol, and the error log that turns your wrong answers into your real syllabus. 18 designed pages + 5 printable trackers. No rank promises. One payment, lifetime access.",
  price: 999,
  pageCount: 18,
  trackerCount: 5,
  audience: 'Indian students, class 9 up',
  accent: { name: 'teal', hex: '#0ca678' },
  category: STUDY_SKILLS,
  format: 'PDF',
  fileCount: 5,
  featured: true,
  modules: [
    {
      id: '01',
      title: 'THE SYSTEM',
      pageCount: 6,
      highlights: [
        "The four things that feel like studying and aren't — including the two that quietly eat Indian students' years: attending coaching, and collecting material.",
        'The four methods that do work: active recall, problems before solutions, past papers early, and explaining it out loud.',
        'How to turn your notes question-first so they test you instead of comforting you.',
        'The day 1 / 3 / 7 / 21 revision cycle, and why a "touch" is 10-20 minutes rather than a re-study. This is the part that stops you forgetting.',
        'A timetable that survives Tuesday: tasks not hours, three blocks not eight, one empty slot.',
      ],
    },
    {
      id: '02',
      title: 'FOCUS',
      pageCount: 6,
      highlights: [
        'Why 20 minutes of studying feels harder than 4 hours of scrolling, explained properly.',
        'The three-phase phone protocol with exact rules, from a 72-hour reset to permanent maintenance.',
        "The 50/10 block with a written target, and the 5-minute rule for when you can't start.",
        'The shutdown ritual that stops you scrolling at midnight feeling guilty.',
        'Sleep as a study technique, and why an all-nighter before an exam is a bad trade every time.',
        'Burnout warning signs — and what to do about parents, pressure and comparison, which is the heaviest part of this for most Indian students and which no study guide mentions.',
      ],
    },
    {
      id: '03',
      title: 'EXAM CRAFT',
      pageCount: 6,
      highlights: [
        'Syllabus triage: count the marks per chapter across 5-10 years of papers, then sort into heavy, medium and rare. One afternoon of counting changes how you spend three months.',
        'The past-paper method, used from week one instead of the last week.',
        'THE ERROR LOG — the single highest-value habit in the book. Every wrong answer logged by reason, not by topic, because the reasons repeat far more than the topics do.',
        'Exam day protocol: the first three minutes, order of attack, when to abandon a question, what to check in the last ten minutes, and exactly what to do if you blank.',
        'The last 30 days, broken into four stages.',
      ],
    },
  ],
  longDescription: [
    {
      heading: 'You Are Not Studying Wrong Hours. You Are Studying Wrong.',
      paragraphs: [
        "You sat with the book for six hours. You felt productive. Two days later you couldn't answer a single question on it.",
        'Almost everything you were taught about studying is passive: read the chapter, highlight the important lines, make neat notes, watch the lecture again. All of it feels like learning and produces very little, because your brain only keeps what it has been forced to retrieve.',
        'Nothing in this book asks you to study more hours. Most students who switch to this method end up studying fewer.',
      ],
    },
    {
      heading: 'Bonus — The Tracker Pack (5 printable sheets)',
      paragraphs: [
        'Daily study log, revision cycle tracker, error log, syllabus weightage sheet, mock test log.',
      ],
    },
    {
      heading: 'What This Book Will Not Do',
      paragraphs: [
        'It will not promise you a rank, a percentage or a selection. Anybody guaranteeing those is selling you something, and results depend on your starting point, your syllabus, your time and a good deal of luck on the day. What this will do is stop you wasting the hours you already put in — which is entirely within your control.',
      ],
    },
    {
      heading: "Who It's For",
      paragraphs: [
        'School students from about class 9 upward, board candidates, and anyone preparing for competitive exams. The methods are subject-agnostic: they work for physics and for history.',
      ],
    },
    {
      heading: 'What You Get',
      paragraphs: [
        'Four PDFs delivered instantly. Designed to read on a phone and print on A4. Lifetime access including future updates.',
      ],
    },
  ],
  bulletPoints: [
    '18 designed pages across 3 modules + 5 printable trackers',
    "The four study methods that actually work (and the four that don't)",
    'The day 1 / 3 / 7 / 21 revision cycle that stops you forgetting',
    'Question-first notes that test you instead of comforting you',
    'The three-phase phone protocol with exact rules',
    'The 50/10 block, and the 5-minute rule for starting',
    'Syllabus triage — find where the marks actually live',
    'The error log: your wrong answers, sorted by reason',
    'Exam day protocol, including what to do if you blank',
    'Sleep, burnout signs, and handling parents and comparison',
    'No rank promises. No 14-hour days. No extra hours needed.',
    'Instant download · One payment · Lifetime access + free updates',
  ],
  faqs: [
    {
      question: 'What exactly do I receive?',
      answer: 'Four PDFs in one ZIP, delivered instantly: three modules plus the Tracker Pack.',
    },
    {
      question: 'Which exam is this for?',
      answer:
        'Any of them. The methods are subject-agnostic — active recall, spaced revision, past papers and error logging work for boards, JEE, NEET, UPSC, CA and university exams alike. What changes between exams is the weightage sheet, which you fill in yourself for your syllabus.',
    },
    {
      question: 'Will this get me a good rank?',
      answer:
        "I won't claim that, and anyone who does is guessing. Your result depends on your starting point, your time, your syllabus and the paper you get. What this fixes is the wasted hours — which is the part you control.",
    },
    {
      question: 'I already study 8 hours a day. Do I need this?',
      answer:
        "Especially then. Eight passive hours can produce less than three active ones, and this book is about which kind you're doing.",
    },
    {
      question: "I'm in class 10 / 12. Is it too advanced?",
      answer: "No. It's written plainly and works from about class 9 upward.",
    },
    {
      question: 'Is it Indian-specific?',
      answer:
        'Yes. It covers coaching-class reality, board and competitive exam patterns, parental pressure, and the Tele-MANAS helpline for students who need it.',
    },
    {
      question: 'Refunds?',
      answer:
        "Digital files can't be returned once downloaded, so this is a final sale. Please read the contents above before buying. If a file doesn't arrive or won't open, message me and I'll fix it immediately.",
    },
  ],
  disclaimer:
    'Study OS provides general study-skills guidance for students. It is not medical or psychological advice, and no rank, score, percentage or admission is promised or guaranteed. Results depend on your starting point, syllabus, available time, effort and factors outside anyone\'s control. If exam pressure is affecting a student\'s sleep, eating or mood, or if they have thoughts of harming themselves, please speak to a parent, teacher, school counsellor or doctor. In India, the government\'s Tele-MANAS mental health helpline is 14416, free and available at any time.',
  helplines: [
    {
      name: 'Tele-MANAS',
      number: '14416',
      context:
        "If exam pressure is affecting a student's sleep, eating or mood, or if they have thoughts of harming themselves, speak to a parent, teacher, school counsellor or doctor. Tele-MANAS is free and available at any time.",
    },
  ],
  tags: [
    'study tips india',
    'how to study effectively',
    'active recall',
    'spaced repetition',
    'revision timetable',
    'board exam preparation',
    'jee preparation',
    'neet preparation',
    'upsc study plan',
    'how to focus while studying',
    'phone distraction study',
    'error log',
    'past papers',
    'exam anxiety',
    'study motivation india',
  ],
  gallery: [
    {
      filename: '1-cover-thumbnail.png',
      role: 'cover',
      alt: 'Main thumbnail. "Six hours, nothing remembered" is the hook every student recognises.',
    },
    { filename: '2-whats-inside.png', role: 'whats-inside', alt: 'All three modules and the trackers.' },
    {
      filename: '3-proof-revision-cycle.png',
      role: 'proof',
      alt: "The revision cycle. Proves it's a method, not motivation.",
    },
  ],
  deliveryFiles: [
    'Module-01-SYSTEM.pdf',
    'Module-02-FOCUS.pdf',
    'Module-03-EXAM-CRAFT.pdf',
    'Tracker-Pack.pdf',
    'START-HERE.txt',
  ],
  pairSlug: 'career-os',
};
