import type { Product } from '../types';
import { SELF_IMPROVEMENT } from '../categories';

/**
 * Source: Dashrize-Products/Glow-Up-OS/3 - LISTING TEXT/listing-copy-paste.md
 * Compliance (README): no medical advice; point to doctors and dermatologists.
 */
export const glowUpOs: Product = {
  slug: 'glow-up-os',
  title: 'Glow-Up OS — The Complete System (Body · Looks · Mind)',
  shortTitle: 'Glow-Up OS — Body, Looks & Mind',
  tagline:
    'The complete glow-up system built for Indian men. Food math in rupees, grooming you can actually afford, and a discipline protocol that survives past Thursday. 39 designed pages + 5 printable trackers. One payment, lifetime access.',
  price: 999,
  anchorPrice: 1797,
  anchorNote:
    'Anchor it as "₹1,797 value" — the three modules priced separately are ₹699 + ₹599 + ₹499. Do not run a permanent fake discount; it kills trust and most Indian buyers now read through it. If you want a launch offer, make it real and time-boxed (e.g. first 100 buyers at ₹749).',
  pageCount: 39,
  trackerCount: 5,
  audience: 'Indian men 18-28',
  accent: { name: 'green', hex: '#2f9e44' },
  category: SELF_IMPROVEMENT,
  format: 'PDF',
  fileCount: 5,
  featured: true,
  modules: [
    {
      id: '01',
      title: 'BODY',
      pageCount: 16,
      highlights: [
        'The Desi Protein Index: every protein source in your kitchen ranked by what 20g of protein actually costs. Soya chunks: ₹4. Whey: ₹50. Same 20 grams.',
        'The ₹100 Bulk Menu: 12 meal builds with calories, protein and cost per serving.',
        'Full-day templates at 2,200 / 2,600 / 3,000 calories, veg and non-veg.',
        'A 3-day gym plan with exact progression rules — plus a full home version that needs nothing but a loaded backpack.',
        'The weekly correction rule that makes the whole thing self-adjusting.',
        'Your first 90 days, week by week, and the 6 ways skinny guys fail.',
      ],
    },
    {
      id: '02',
      title: 'LOOKS',
      pageCount: 12,
      highlights: [
        'The 3-step skincare routine and exactly what to buy at an Indian pharmacy — ₹700 to ₹1,500 for all three products.',
        'Haircuts by face shape, with diagrams. Plus how to actually talk to a barber instead of saying "thoda chota kar do" and getting your class-6 haircut again.',
        'The two beard lines that decide whether you look sharp or unkempt.',
        'The ₹3,000 capsule wardrobe, with a colour strip that works on Indian skin tones.',
        'Posture fixes, grooming checklists, fragrance on a budget, and how to not look bad in photos.',
        'A 30-day plan with a spend column, so you know what each week costs.',
      ],
    },
    {
      id: '03',
      title: 'MIND',
      pageCount: 11,
      highlights: [
        "Why you quit everything: you're not lazy, you're out-competed.",
        'The Detox Ladder — 3 phases with exact phone rules, from a 72-hour reset to permanent maintenance.',
        'Morning protocol, focus blocks, and the shutdown ritual.',
        "The never-miss-twice rule and a written relapse protocol, so a bad day doesn't end the month.",
        'The 90-day master calendar that runs all three modules at once.',
      ],
    },
  ],
  longDescription: [
    {
      heading: "You've Tried This Before",
      paragraphs: [
        'You\'ve "started the gym" four times. Longest streak: 11 days. You\'ve eaten more for a week, seen nothing on the scale, and decided it\'s genetics. You\'ve watched 300 hours of glow-up content and applied roughly none of it. You\'ve had a ₹2,000 whey tub in your cart before fixing a single meal.',
        "That's not laziness. You've just never had the actual numbers, the actual products, or a system built for the country you live in.",
      ],
    },
    {
      heading: 'What This Is',
      paragraphs: [
        'Glow-Up OS is three modules and a tracker pack — 39 designed pages, no fluff, no filler, every number in rupees.',
      ],
    },
    {
      heading: 'Bonus — The Tracker Pack (5 printable sheets)',
      paragraphs: [
        'Daily scorecard, workout log built around the progression rule, weekly review with the calorie correction built in, detox ladder tracker, and a 90-day wall calendar.',
      ],
    },
    {
      heading: 'Why This One',
      paragraphs: [
        'Rupees, not dollars. Every food, product and wardrobe piece is priced in ₹ and available in India.',
        "Dal, not chicken breast. Meals your mother already knows how to make, with full vegetarian variants throughout.",
        'Zero supplement selling. There is no affiliate link in this book. The whey section actively tells you to wait.',
        'Numbers, not vibes. Protein per rupee. Calories per meal. Reps per set. Days per phase.',
        "One payment. Not a subscription, and there's no ₹15,000 coaching upsell waiting at the end.",
      ],
    },
    {
      heading: 'What You Get',
      paragraphs: [
        'Four PDFs delivered instantly: three modules plus the tracker pack. Designed to read on your phone and print on A4. Lifetime access, including future updates.',
      ],
    },
    {
      heading: 'Honest Timeline',
      paragraphs: [
        "You'll notice changes around week 5-6. Friends notice around week 8-10. A realistic 90-day result is 4-6 kg gained with visibly better grooming and posture. Anyone promising you a transformation in 3 weeks is selling you something worse than this.",
      ],
    },
    {
      heading: 'Note',
      paragraphs: [
        'General fitness, nutrition and grooming information for healthy adults. Not medical advice. See the full disclaimer below.',
      ],
    },
  ],
  bulletPoints: [
    '39 designed pages across 3 modules + 5 printable trackers',
    'Protein sources ranked by ₹ per 20g — soya ₹4 vs whey ₹50',
    '12 costed Indian meal builds, most under ₹40',
    'Gym plan + full no-equipment home plan, with progression rules',
    'Skincare for ₹700–1,500 from any Indian pharmacy',
    'Haircuts by face shape, with diagrams',
    '₹3,000 capsule wardrobe + colour strip for Indian skin tones',
    '3-phase phone detox protocol with exact rules',
    '90-day master calendar running all three modules',
    'Instant download · One payment · Lifetime access + free updates',
  ],
  faqs: [
    {
      question: 'What exactly do I receive?',
      answer:
        'Four PDF files in one ZIP, delivered instantly: three modules plus the Tracker Pack, and a START-HERE file telling you what to do on day 1.',
    },
    {
      question: "I'm vegetarian. Is this useful?",
      answer:
        'Fully. Every meal build has a veg version, and the protein index is built around soya, dal, paneer, chana and milk. Vegetarian bulking is a solved problem and the book solves it.',
    },
    {
      question: "I don't have a gym membership.",
      answer:
        'Module 01 includes a complete home plan using a loaded backpack with the same progression logic. You can run all 90 days without a gym.',
    },
    {
      question: 'Is this just repackaged free YouTube content?',
      answer:
        "The principles are public — energy balance and progressive overload aren't secrets. You're paying for the assembly: the ₹-per-protein table nobody has built for India, 12 costed meal builds, exact product categories with price ranges, and the three parts sequenced so you never add more than one hard thing at a time.",
    },
    {
      question: 'How fast will I see results?',
      answer:
        "You'll notice week 5-6, friends week 8-10. A realistic 90-day result is 4-6 kg gained with visibly better grooming and posture.",
    },
    {
      question: "I'm 16. Can I use it?",
      answer:
        'The training and grooming sections are fine at your age, but run it past a parent and ideally a doctor first, and skip supplements entirely. Food and sleep only.',
    },
    {
      question: 'Refunds?',
      answer:
        "Digital files can't be returned once downloaded, so this is a final sale — please read the contents list above before buying. If a file doesn't arrive or won't open, message me and I'll fix it immediately.",
    },
  ],
  disclaimer:
    'Glow-Up OS provides general fitness, nutrition and grooming information for healthy adults. It is not medical advice and does not replace consultation with a doctor, dermatologist or registered dietitian. Do not use it to diagnose or treat any condition. If you are under 18, or have any medical condition, consult a qualified professional before changing your diet or exercise routine. Product categories and prices are examples current at the time of writing, not endorsements, and are not paid placements. Results depend on consistency, sleep, genetics and starting point; no specific outcome is guaranteed.',
  helplines: [],
  tags: [
    'glow up',
    'glow up guide india',
    'indian diet plan',
    'muscle gain india',
    'skinny to fit',
    'weight gain diet indian',
    'high protein indian food',
    'budget bulking',
    'grooming guide men',
    'skincare for indian men',
    'mens style india',
    'monk mode',
    'dopamine detox',
    'discipline system',
    'self improvement india',
    '90 day challenge',
    'fitness ebook india',
  ],
  gallery: [
    { filename: '1-cover-thumbnail.png', role: 'cover', alt: 'Main thumbnail. Hook + price + specs.' },
    { filename: '2-whats-inside.png', role: 'whats-inside', alt: 'Kills "what do I actually get?"' },
    { filename: '3-proof-real-page.png', role: 'proof', alt: "Real page content — proves it isn't fluff." },
  ],
  deliveryFiles: [
    'Module-01-BODY.pdf',
    'Module-02-LOOKS.pdf',
    'Module-03-MIND.pdf',
    'Tracker-Pack.pdf',
    'START-HERE.txt',
  ],
  pairSlug: 'social-os',
};
