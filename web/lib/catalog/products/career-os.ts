import type { Product } from '../types';
import { MONEY_AND_CAREER } from '../categories';

/**
 * Source: Dashrize-Products/Career-OS/3 - LISTING TEXT/listing-copy-paste.md
 * Compliance (README): no job, placement or salary guarantees, ever. Keep
 * the cybercrime helpline (1930) — present verbatim in the disclaimer below.
 */
export const careerOs: Product = {
  slug: 'career-os',
  title: 'Career OS — Seven Seconds (Resume · Interviews · Offer)',
  shortTitle: 'Career OS — The Fresher Job System',
  tagline:
    "200 applications, zero replies. Your resume takes longer than seven seconds to read, and you're applying through the channel that works worst. The one-page resume that survives the scan, word-for-word referral scripts, the eight interview questions, and every job scam aimed at freshers. 19 designed pages + 5 printable trackers. One payment, lifetime access.",
  price: 999,
  pageCount: 19,
  trackerCount: 5,
  audience: 'final-year students & graduates',
  accent: { name: 'orange', hex: '#e8590c' },
  category: MONEY_AND_CAREER,
  format: 'PDF',
  fileCount: 5,
  modules: [
    {
      id: '01',
      title: 'RESUME & PROFILE',
      pageCount: 6,
      highlights: [
        'What to delete first: the photo, DOB, marital status, father\'s name, the declaration, skill bars, "hardworking and dedicated". Indian fresher resumes are full of conventions copied from a 2009 template, and removing them is the fastest free improvement available.',
        'The format rules that get you past automated screening — one page, one column, standard headings, no tables or graphics, exported as PDF.',
        'The one-page structure in the order that survives a seven-second scan, with Projects placed high because that is where a fresher actually competes.',
        'The bullet formula — action verb + what you did + the result — with weak-versus-strong examples you can copy the shape of.',
        'Where a fresher finds numbers when they think they have none. And why you must never invent one.',
        'LinkedIn in 30 minutes: headline, about, featured, photo, activity.',
      ],
    },
    {
      id: '02',
      title: 'GETTING INTERVIEWS',
      pageCount: 7,
      highlights: [
        'Where fresher jobs actually come from, six channels ranked. Portals are last, and that is where your 200 applications went.',
        'Word-for-word referral scripts — for an alumnus, and for a complete stranger. Two rules make them work: make it easy to say yes, and easy to say no.',
        'The cold email to the person who actually owns the role, which beats any form at startups and small companies.',
        'Internships as the real front door, and the question almost no intern asks in their final fortnight.',
        'Low CGPA, gap years, tier-3 college, no experience, switching fields — each handled with a straight answer rather than a dodge.',
        'EVERY JOB SCAM AIMED AT FRESHERS, across two full pages: paid offer letters, fake internship fees, placement-guarantee courses, unpaid "assignments", training bonds, WhatsApp "HR", and data-harvesting application forms. Plus how to verify a company in three minutes, and who to report to if it already happened.',
      ],
    },
    {
      id: '03',
      title: 'INTERVIEW & OFFER',
      pageCount: 6,
      highlights: [
        'The eight questions nearly every interview asks, and what each one is really testing.',
        'The STAR shape with a full worked example, and why you only need four prepared stories.',
        'Four questions to ask them that tell you whether the role is real.',
        'Online and in-person logistics, and what to say when you do not know something.',
        'Salary as a fresher, honestly: your leverage is small but not zero, what to say when asked your expectation, and why CTC is not take-home.',
        'Offer letter red flags before you sign — bonds, unpaid "training periods", vague titles, mostly-variable CTC, held certificates, and pressure to sign within hours.',
        'Your first 90 days, and how to run a job search as a pipeline instead of a series of verdicts.',
      ],
    },
  ],
  longDescription: [
    {
      heading: 'You Are Not Unqualified. You Are Unreadable.',
      paragraphs: [
        'You applied to 200 jobs and heard nothing. You concluded the market is brutal, or that you needed a better college.',
        'Usually neither is the reason. Two things are actually happening: your resume takes more than seven seconds to understand, so it gets skipped — and you applied through the channel that works worst, job portals, while ignoring the one that fills most fresher roles.',
        'Both are fixable this week. Without new qualifications, without a better CGPA, and without paying anybody for a "placement guarantee".',
      ],
    },
    {
      heading: 'Bonus — The Tracker Pack (5 printable sheets)',
      paragraphs: [
        'Application tracker, referral tracker, resume checklist, interview prep sheet, and an offer comparison sheet with the red-flag checklist.',
      ],
    },
    {
      heading: 'The One Rule This Book Repeats',
      paragraphs: [
        'No legitimate employer or recruiter ever charges you to be hired. Not a registration fee, a training fee, a security deposit, or money to release an offer letter. Freshers are the most targeted group in India for exactly this, and there is no honest exception.',
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
    '19 designed pages across 3 modules + 5 printable trackers',
    'What to delete from an Indian fresher resume, and why',
    'The one-page structure that survives a 7-second scan',
    'The bullet formula, with weak vs strong examples',
    'Where fresher jobs actually come from — portals are last',
    'Word-for-word referral scripts for alumni and strangers',
    'The cold email to the person who owns the role',
    'Low CGPA, gap years and tier-3 college handled honestly',
    'Every job scam aimed at freshers, across two full pages',
    'The eight interview questions, and the STAR shape',
    'Salary honestly — CTC is not take-home',
    'Offer letter red flags: bonds, unpaid training, vague CTC',
    'Instant download · One payment · Lifetime access + free updates',
  ],
  faqs: [
    {
      question: 'What exactly do I receive?',
      answer: 'Four PDFs in one ZIP, delivered instantly: three modules plus the Tracker Pack.',
    },
    {
      question: 'Is this only for engineering students?',
      answer:
        'No. The resume rules, referral method, interview questions and offer checks apply to any field. Some examples are from tech because that is where most fresher hiring volume is.',
    },
    {
      question: 'Will this get me a job?',
      answer:
        'No book can promise that, and anyone promising it is selling you something — usually a "placement guarantee" course. What this fixes is the two things you control: whether your resume is readable, and which channel you spend your effort in.',
    },
    {
      question: 'I have a low CGPA / a gap year. Is it covered?',
      answer:
        'Yes, Module 02 page 05 handles low CGPA, gap years, tier-3 college, no experience and switching fields, each with a straight answer rather than a dodge.',
    },
    {
      question: 'I keep getting interviews but no offers.',
      answer:
        'Then Module 03 is your module. The tracker pack also diagnoses this: if interviews are happening and offers are not, it is your interview prep, not your resume.',
    },
    {
      question: 'Should I pay for a placement guarantee course?',
      answer:
        'Module 02 explains why a guarantee is itself the red flag. Nobody can guarantee you a job, and the conditions are usually buried and unmeetable.',
    },
    {
      question: 'Refunds?',
      answer:
        "Digital files can't be returned once downloaded, so this is a final sale. Please read the contents above before buying. If a file doesn't arrive or won't open, message me and I'll fix it immediately.",
    },
  ],
  disclaimer:
    'Career OS provides general career-guidance information for job seekers. It is not legal, financial or immigration advice, and no job, interview, salary or outcome is promised or guaranteed. Hiring practices, salary ranges and company policies vary by employer, city and sector and change over time. For anything contractual — an employment bond, an unusual clause, or a dispute — seek advice from a qualified professional before you sign. If you encounter recruitment fraud in India, you can report it at cybercrime.gov.in or on the helpline 1930.',
  helplines: [
    {
      name: 'National Cyber Crime Reporting Portal',
      number: '1930',
      context: 'If you encounter recruitment fraud in India, report it at cybercrime.gov.in or on the helpline 1930.',
    },
  ],
  tags: [
    'fresher resume',
    'resume format india',
    'first job',
    'campus placement',
    'off campus jobs',
    'referral linkedin',
    'cold email hiring manager',
    'interview questions freshers',
    'star method',
    'job scams india',
    'fake offer letter',
    'salary negotiation fresher',
    'low cgpa jobs',
    'internship to job',
  ],
  gallery: [
    { filename: '1-cover-thumbnail.png', role: 'cover', alt: '"Seven seconds" is the hook.' },
    { filename: '2-whats-inside.png', role: 'whats-inside', alt: 'All three modules and the trackers.' },
    {
      filename: '3-proof-resume-bullets.png',
      role: 'proof',
      alt: 'Weak vs strong bullets. Instantly useful, which is why it converts.',
    },
  ],
  deliveryFiles: [
    'Module-01-RESUME.pdf',
    'Module-02-INTERVIEWS.pdf',
    'Module-03-INTERVIEW-AND-OFFER.pdf',
    'Tracker-Pack.pdf',
    'START-HERE.txt',
  ],
  pairSlug: 'money-os',
};
