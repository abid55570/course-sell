import type { Product } from '../types';
import { MONEY_AND_CAREER } from '../categories';

/**
 * Source: Dashrize-Products/Money-OS/3 - LISTING TEXT/listing-copy-paste.md
 * Compliance (README): no earnings claims, no income screenshots, ever.
 *
 * NOTE: the README also asks to "keep the helplines (... cybercrime 1930 in
 * Money OS and Career OS)". The approved listing-copy-paste.md for Money OS
 * (title, description, FAQ, disclaimer) never actually states the 1930
 * number or cybercrime.gov.in — that reference only appears in the reel
 * marketing scripts (5 - MARKETING/30-reel-scripts.md), not in the store
 * listing text this catalog is built from. `helplines` is therefore left
 * empty here rather than inventing copy the approved listing doesn't carry.
 * Flagged in the catalog build report.
 */
export const moneyOs: Product = {
  slug: 'money-os',
  title: 'Money OS — Honest Freelancing for Indian Beginners (Skill · Client · Clipping · System)',
  shortTitle: 'Money OS — The First ₹1,000',
  tagline:
    'The honest version. One sellable skill, real outreach scripts, what to actually charge, and every scam aimed at Indian beginners. 39 designed pages + 5 printable trackers. No income promises, no screenshots, no "passive income". One payment, lifetime access.',
  price: 999,
  pageCount: 39,
  trackerCount: 5,
  audience: 'freelancing beginners 18+',
  accent: { name: 'blue', hex: '#1c7ed6' },
  category: MONEY_AND_CAREER,
  format: 'PDF',
  fileCount: 6,
  featured: true,
  modules: [
    {
      id: '01',
      title: 'SKILL',
      pageCount: 10,
      highlights: [
        'Eight skills people in India actually pay beginners for, scored on real demand, time to hireable, and what gear you need. Pick exactly one.',
        'The 20-minute market walk that finds your skill and your first client list at the same time.',
        'The 30-day sprint: ship ten portfolio pieces instead of watching forty hours of tutorials.',
        'How to build a portfolio with zero clients, honestly and without pretending you were hired.',
        'Learn any of it for ₹0, plus how to use AI tools without handing over raw AI output.',
        'Honest earning ranges per skill, and an honest timeline where month one pays nothing.',
      ],
    },
    {
      id: '02',
      title: 'CLIENT',
      pageCount: 9,
      highlights: [
        'Why Fiverr and Upwork are the hardest place for a beginner to start, and what works first.',
        'Where the first client actually comes from: five sources ranked by difficulty.',
        'Word-for-word scripts for Instagram DMs, WhatsApp, and walking into a shop.',
        'The follow-up sequence, because most replies come from the second or third message.',
        'What to charge for your first three clients versus after, in a real price table.',
        'How to get paid: 50% advance, invoices, UPI, and international via Wise or Payoneer.',
        'A five-line scope message that has settled more disputes than any contract a beginner would pay to have drafted.',
        'EVERY SCAM AIMED AT YOU, across two full pages: Telegram task jobs, fake internships, unpaid "test tasks", MLM in disguise, trading signal groups, fake payment screenshots. Plus what to do, and who to report to, if one already got you.',
      ],
    },
    {
      id: '03',
      title: 'CLIPPING',
      pageCount: 10,
      highlights: [
        'The faceless path: get paid to cut other people\'s long videos into shorts. No clients, no camera, no DMs. A phone is enough.',
        'The two payment models and which one to take while you are learning.',
        'How to find the moment worth clipping, and the six-step edit that takes 15 minutes.',
        'What gets a clip rejected, and the rights rules that keep you legitimate.',
        'The 20-clip sprint: roughly seven hours of total work to become hireable at this.',
      ],
    },
    {
      id: '04',
      title: 'SYSTEM',
      pageCount: 10,
      highlights: [
        'Retainers instead of one-off jobs, and the message that converts a client into one.',
        'When and how to raise your rate, and which clients you should be glad to lose.',
        'Fitting this around college without missing deadlines.',
        'Tax in plain language: what is taxable, PAN, TDS, records, and when to see a CA.',
        'The five traps to ignore completely, and the one question that catches all of them.',
      ],
    },
  ],
  longDescription: [
    {
      heading: 'Nobody Pays for Hustle',
      paragraphs: [
        'Not for motivation, not for discipline, not for a 5am routine. People pay for a specific outcome they cannot produce themselves. That is why nothing has worked yet, and it is good news, because it means the problem is solvable.',
        'Your first ₹1,000 is a skill problem, not a hustle problem.',
      ],
    },
    {
      heading: 'What This Is',
      paragraphs: [
        'Four modules and a tracker pack. 39 designed pages, every number in rupees, and not one earnings screenshot anywhere.',
      ],
    },
    {
      heading: 'Bonus — The Tracker Pack (5 printable sheets)',
      paragraphs: [
        'Skill sprint tracker, outreach pipeline, client and invoice log, clip log, and a monthly money sheet that doubles as your tax record.',
      ],
    },
    {
      heading: 'What This Book Refuses to Do',
      paragraphs: [
        'Promise you an income, or show you a single screenshot.',
        'Recommend dropshipping, crypto or forex trading, betting apps, MLM, or "passive income". Module 04 explains exactly why each one fails someone in your position.',
        'Tell you to pay anything to start. Every method here costs ₹0 to begin.',
      ],
    },
    {
      heading: 'Honest Timeline',
      paragraphs: [
        'Weeks 1-4: ₹0, building skill and proof. This is where most people quit. Weeks 5-8: first paid job, small and probably local. Months 3-6: repeat clients at prices you would have been embarrassed to ask for in month one. Nobody can promise you more than that, and anyone who does is selling you something worse than this book.',
      ],
    },
    {
      heading: 'What You Get',
      paragraphs: [
        'Five PDFs delivered instantly, plus a START-HERE file. Designed to read on a phone and print on A4. Lifetime access including future updates.',
      ],
    },
    {
      heading: 'Note',
      paragraphs: [
        'General educational information about freelancing and online work. Not financial, tax, legal or investment advice. No earnings promised or guaranteed. Full disclaimer below.',
      ],
    },
  ],
  bulletPoints: [
    '39 designed pages across 4 modules + 5 printable trackers',
    '8 sellable skills scored on demand, time-to-hireable and gear needed',
    'The 30-day sprint: ship 10 pieces, not 40 hours of tutorials',
    'Word-for-word DM, WhatsApp and walk-in outreach scripts',
    'Real price tables: what to charge first, and after',
    'How to get paid — advance, invoices, UPI, international',
    'Two full pages on every scam aimed at Indian beginners',
    'A whole module on clipping: the faceless, no-client path',
    'Tax in plain language, and when to see a CA',
    'The 5 traps to ignore: dropshipping, trading, betting, MLM, "passive income"',
    'No income promises. No screenshots. Honest ranges only.',
    'Instant download · One payment · Lifetime access + free updates',
  ],
  faqs: [
    {
      question: 'What exactly do I receive?',
      answer:
        'Five PDFs in one ZIP, delivered instantly, plus a START-HERE file telling you the four things to do today.',
    },
    {
      question: 'How much will I earn?',
      answer:
        "I won't tell you a number, and anyone who does is guessing or lying. The book prints honest market ranges per skill and an honest timeline where the first month pays nothing. What you earn depends on your skill, your market and your consistency.",
    },
    {
      question: 'Do I need money to start?',
      answer:
        'No. Every method in the book costs ₹0 to begin, using free tools. The book also tells you not to spend anything in month one, including on courses.',
    },
    {
      question: 'Do I need a laptop?',
      answer:
        'For video editing, clipping and social media, a phone is enough to start. Other skills are easier with a laptop.',
    },
    {
      question: 'Is this about dropshipping or trading?',
      answer:
        'The opposite. Module 04 explains why dropshipping, crypto and forex trading, betting apps, MLM and "passive income" all fail someone starting out, and the book recommends none of them.',
    },
    {
      question: 'What is the clipping module, and what is Dashrize?',
      answer:
        'Clipping means being paid to cut long videos into short ones, with no client work involved. Dashrize is our own clipping platform, disclosed as ours inside the book. It has not launched yet, so it is a waitlist rather than income today, and the module is written to work on any clipping platform.',
    },
    {
      question: 'Is freelance income taxable?',
      answer:
        'Yes, in India it is. Module 04 explains what to be aware of in plain language and tells you to talk to a chartered accountant about your own situation. That is not something a PDF should decide for you.',
    },
    {
      question: "I'm in school. Can I use this?",
      answer: "The book is written for 18+. If you're younger, talk to a parent first.",
    },
    {
      question: 'Refunds?',
      answer:
        "Digital files can't be returned once downloaded, so this is a final sale. Please read the contents above before buying. If a file doesn't arrive or won't open, message me and I'll fix it immediately.",
    },
  ],
  disclaimer:
    'Money OS provides general educational information about freelancing and online work. It is not financial, tax, legal or investment advice, and it is not an offer of employment or work. No earnings are promised, projected or guaranteed. Any figures shown are typical market ranges at the time of writing, not expected results; what you earn depends entirely on your own skill, market, effort and consistency, and many people earn nothing. Freelance income is taxable in India — consult a chartered accountant about your own circumstances. Consult a qualified, registered adviser before making any investment. Platform names, rates, thresholds and policies were current at the time of writing and change frequently. Dashrize is a platform owned by the publisher of this book, is disclosed as such within it, and is pre-launch at the time of writing; joining its waitlist is not an offer of work.',
  helplines: [],
  tags: [
    'freelancing india',
    'side income india',
    'earn money online india honest',
    'video editing freelance',
    'first freelance client',
    'freelance pricing india',
    'online scams india',
    'work from home scam',
    'clipping',
    'video clipping',
    'social media manager india',
    'student side income',
    'freelance tax india',
  ],
  gallery: [
    {
      filename: '1-cover-thumbnail.png',
      role: 'cover',
      alt: 'Main thumbnail. Leads with "₹0 to start", not an earnings claim.',
    },
    { filename: '2-whats-inside.png', role: 'whats-inside', alt: 'All four modules and the trackers.' },
    {
      filename: '3-proof-scam-page.png',
      role: 'proof',
      alt: 'The scam page. This is the image that earns trust in this category.',
    },
  ],
  deliveryFiles: [
    'Module-01-SKILL.pdf',
    'Module-02-CLIENT.pdf',
    'Module-03-CLIPPING.pdf',
    'Module-04-SYSTEM.pdf',
    'Tracker-Pack.pdf',
    'START-HERE.txt',
  ],
  pairSlug: 'career-os',
};
