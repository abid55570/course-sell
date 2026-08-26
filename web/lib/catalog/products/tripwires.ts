import type { Product } from '../types';
import { SELF_IMPROVEMENT, MONEY_AND_CAREER } from '../categories';

/**
 * Source: Dashrize-Products/PRODUCT-PIPELINE/Tier 1 - Rs 299 (tripwires)/<name>/BRIEF.md
 *
 * The ₹299 tier. Each is a single PDF pulled out of a larger ₹999 system and
 * sold as an entry point, so they are deliberately thin next to the OS
 * products: one file, no module list, and a bullet list taken straight from
 * the brief's "what is inside" section.
 *
 * They keep their parent product's compliance framing, because the content is
 * the parent's content — the fitness ones are not medical advice, the money
 * ones name no product and promise no income, and the scam one promises no
 * recovery. Each disclaimer below says so in its own terms rather than sharing
 * one generic paragraph that would be wrong for most of them.
 *
 * None has a cover image yet (PRODUCT-PIPELINE/BUILD-STATUS.txt says the eight
 * tripwires still want one), so `gallery` is `[]` and the storefront generates
 * a fallback — the same precedent as the guide families.
 *
 * Every one carries `pairSlug` to the ₹999 product it is an entry into. That
 * is the whole commercial point of the tier: the brief for each says so
 * explicitly, and cross-sell reads this field.
 */

const TRIPWIRE_REFUND_FAQ = {
  question: 'Refunds?',
  answer:
    "Digital files can't be returned once downloaded, so this is a final sale. Please read the contents above before buying. If a file doesn't arrive or won't open, message me and I'll fix it immediately.",
};

export const theScamShield: Product = {
  slug: 'the-scam-shield',
  title: 'The Scam Shield — Every Scam Aimed At Job Hunters, In One Place',
  tagline:
    'You never pay money to receive work or a job. That one rule, plus every version of the scam that breaks it — task scams, fake internships, paid offer letters, placement guarantees — and the reporting route when it has already happened. 5 pages + printable checklist.',
  price: 299,
  pageCount: 5,
  trackerCount: 1,
  audience: 'Students, freshers, first-time freelancers, and their parents',
  accent: { name: 'cyan', hex: '#0c8599' },
  category: MONEY_AND_CAREER,
  format: 'PDF',
  fileCount: 1,
  longDescription: [
    {
      heading: 'One Rule Covers Almost All Of It',
      paragraphs: [
        'You never pay money to receive work or a job. No employer on earth charges you to be hired — not for registration, not for a laptop deposit, not for training, not for a background check.',
        'Every scam in this guide is a variation on breaking that rule, dressed up well enough that thousands of capable people pay anyway.',
      ],
    },
  ],
  bulletPoints: [
    'The one rule: you never pay money to receive work or a job',
    'Telegram task scams, fake internships, paid offer letters',
    'Placement-guarantee courses, and why a guarantee is the red flag',
    'Unpaid test tasks and training bonds',
    'Fake payment screenshots, WhatsApp HR, data-harvesting forms',
    'Verify any company in three minutes',
    'What to do if it already happened: cybercrime.gov.in, helpline 1930',
  ],
  faqs: [
    {
      question: 'What exactly do I receive?',
      answer: 'One PDF, delivered instantly, including the printable checklist to keep on your phone.',
    },
    {
      question: 'Can I share it with my parents or my college group?',
      answer:
        'Please do — that is what it is for. A scam everyone in the group has already read about is one nobody falls for.',
    },
    TRIPWIRE_REFUND_FAQ,
  ],
  disclaimer:
    'General information for adults in India. Not legal or financial advice, and no recovery of lost money is claimed or implied. Scam patterns and official procedures change — verify current processes with official sources: 1930, cybercrime.gov.in, and your bank. If money has already gone, report it immediately; speed is what decides whether anything can be held.',
  helplines: [
    {
      name: 'Cybercrime helpline',
      number: '1930',
      context:
        'If money has just left an account to a fraud, call 1930 and file at cybercrime.gov.in immediately.',
    },
  ],
  tags: ['job scam india', 'fake internship', 'task scam', 'placement guarantee scam', 'fresher scam', 'cybercrime 1930'],
  gallery: [],
  deliveryFiles: ['The-Scam-Shield.pdf'],
  pairSlug: 'career-os',
};

export const theDesiProteinBible: Product = {
  slug: 'the-desi-protein-bible',
  title: 'The Desi Protein Bible — What 20g Actually Costs In An Indian Kitchen',
  tagline:
    'Eleven protein sources ranked by what ₹ per 20g really costs, 40 costed meal builds, and four slot defaults that hit 100g of protein for about ₹128 a day. You do not need whey. You need to thicken the dal. 4 pages + protein log.',
  price: 299,
  pageCount: 4,
  trackerCount: 1,
  audience: 'Anyone eating badly on a budget, gym-goer or not',
  accent: { name: 'green', hex: '#2f9e44' },
  category: SELF_IMPROVEMENT,
  format: 'PDF',
  fileCount: 1,
  longDescription: [
    {
      heading: 'Whey Costs Ten Times What Soya Does',
      paragraphs: [
        'For the same twenty grams. That single comparison is most of what people need, and almost nobody selling supplements will show it to you.',
        'This is the whole table: every protein source actually available in an Indian kitchen, ranked by cost per 20g, with forty costed meal builds underneath it.',
      ],
    },
  ],
  bulletPoints: [
    'The Desi Protein Index: 11 sources ranked by ₹ per 20g',
    'Why whey costs 10x what soya does',
    '40 meal builds with kcal, protein and cost per serving',
    'Four slot defaults that hit 100g protein for about ₹128/day',
    'Vegetarian, non-veg and hostel variants',
    'The three-line grocery list',
  ],
  faqs: [
    { question: 'What exactly do I receive?', answer: 'One PDF, delivered instantly, including the weekly protein log with a cost column.' },
    {
      question: 'Do I need supplements?',
      answer:
        'No, and the guide argues against starting there. Whey is a convenience, not a requirement, and the index shows exactly what it costs you per gram compared with food.',
    },
    { question: 'Is it vegetarian?', answer: 'It covers vegetarian, non-vegetarian and hostel variants of every slot.' },
    TRIPWIRE_REFUND_FAQ,
  ],
  disclaimer:
    'General nutrition information, not medical or dietetic advice. Prices are approximate ranges and vary by city and season. Anyone with a medical condition, a kidney concern, a food allergy, or who is pregnant should speak to a doctor or a registered dietitian before changing how they eat.',
  tags: ['protein india', 'cheap protein sources', 'indian diet protein', 'budget nutrition', 'vegetarian protein', 'whey vs soya'],
  gallery: [],
  deliveryFiles: ['The-Desi-Protein-Bible.pdf'],
  pairSlug: 'glow-up-os',
};

export const theInterviewEight: Product = {
  slug: 'the-interview-eight',
  title: 'The Interview Eight — The Same Eight Questions, Every Time',
  tagline:
    'Nearly every interview asks the same eight questions. What each is really testing, "tell me about yourself" scripted to 60 seconds, the STAR shape with a worked example, and the four questions to ask them. 4 pages + prep sheet.',
  price: 299,
  pageCount: 4,
  trackerCount: 1,
  audience: 'Anyone with an interview this week',
  accent: { name: 'orange', hex: '#e8590c' },
  category: MONEY_AND_CAREER,
  format: 'PDF',
  fileCount: 1,
  longDescription: [
    {
      heading: 'Prepare Eight Things, Not Everything',
      paragraphs: [
        'Interviews feel unpredictable and mostly are not. The same eight questions carry nearly every one, and each is testing something more specific than it sounds like.',
        'Four prepared stories answer almost every behavioural question you will be asked. This is those four, plus the shape to tell them in.',
      ],
    },
  ],
  bulletPoints: [
    'The eight questions and what each is really testing',
    '"Tell me about yourself" in 60 seconds, scripted',
    'The STAR shape with a worked example',
    'Four stories that answer almost every behavioural question',
    'Four questions to ask them',
    'What to say when you do not know something',
    'Online and in-person logistics',
  ],
  faqs: [
    { question: 'What exactly do I receive?', answer: 'One PDF, delivered instantly, including the interview prep sheet — one per interview.' },
    {
      question: 'My interview is tomorrow. Is this useful in one evening?',
      answer: 'That is who it is written for. Four pages, and the scripted opening is the part to do first.',
    },
    TRIPWIRE_REFUND_FAQ,
  ],
  disclaimer:
    'General interview-preparation guidance. No job, interview outcome, offer or salary is promised or guaranteed — those depend on the role, the competition and factors nobody controls.',
  tags: ['interview questions india', 'star method', 'tell me about yourself', 'fresher interview', 'behavioural interview'],
  gallery: [],
  deliveryFiles: ['The-Interview-Eight.pdf'],
  pairSlug: 'career-os',
};

export const theFresherResumeFix: Product = {
  slug: 'the-fresher-resume-fix',
  title: 'The Fresher Resume Fix — Seven Seconds, One Page',
  tagline:
    'Delete these seven things today, restructure in this order, rewrite every bullet with this formula. For the person who applied to 200 jobs and heard nothing back. 4 pages + printable checklist.',
  price: 299,
  pageCount: 4,
  trackerCount: 1,
  audience: 'Final-year students and fresh graduates',
  accent: { name: 'violet', hex: '#7048e8' },
  category: MONEY_AND_CAREER,
  format: 'PDF',
  fileCount: 1,
  longDescription: [
    {
      heading: 'Seven Seconds Is The Whole Budget',
      paragraphs: [
        'Before a human reads it, an automated screen has to pass it. After that, someone scans it for about seven seconds. Most fresher resumes fail both, for reasons that take an afternoon to fix.',
        'Start by deleting: the photo, the date of birth, the declaration, and four other things that are costing you nothing but space.',
      ],
    },
  ],
  bulletPoints: [
    'The seven things to delete today',
    'Format rules that get past automated screening',
    'The one-page structure that survives a 7-second scan',
    'The bullet formula, with weak-vs-strong examples',
    'Where a fresher finds numbers — and why you never invent one',
    'LinkedIn in 30 minutes',
    'The printable resume checklist',
  ],
  faqs: [
    { question: 'What exactly do I receive?', answer: 'One PDF, delivered instantly, including the resume checklist as a standalone printable.' },
    {
      question: 'I have no experience. What goes in the bullets?',
      answer:
        'Coursework, projects, volunteering and part-time work all carry real bullets. The guide shows where a fresher legitimately finds numbers, and is explicit that you never invent one.',
    },
    TRIPWIRE_REFUND_FAQ,
  ],
  disclaimer:
    'General resume-writing guidance. No job, interview, callback or outcome is promised or guaranteed. Never state a qualification, employer, grade or figure you cannot evidence.',
  tags: ['fresher resume', 'resume format india', 'ats resume', 'cv for freshers', 'linkedin profile'],
  gallery: [],
  deliveryFiles: ['The-Fresher-Resume-Fix.pdf'],
  pairSlug: 'career-os',
};

export const theFirstClientScripts: Product = {
  slug: 'the-first-client-scripts',
  title: 'The First Client Scripts — Word For Word',
  tagline:
    '"Please give me a chance" loses. Sending a finished edit of their video wins. The exact DM, WhatsApp, walk-in and cold-email scripts for a first paying client, the day 3 / 8 / 20 follow-up nobody runs, and the five-line scope message that prevents disputes. 4 pages + pipeline sheet.',
  price: 299,
  pageCount: 4,
  trackerCount: 1,
  audience: 'Beginner freelancers and anyone who freezes at the DM box',
  accent: { name: 'gold', hex: '#c8a44a' },
  category: MONEY_AND_CAREER,
  format: 'PDF',
  fileCount: 1,
  longDescription: [
    {
      heading: 'People Do Not Freeze Because They Lack Skill',
      paragraphs: [
        'They freeze at the message. What to actually type, to someone who never asked to hear from you, without sounding desperate.',
        'These are the words. Local businesses, alumni, strangers who own the role you want — plus the follow-up sequence that almost nobody sends and that closes most of the work.',
      ],
    },
  ],
  bulletPoints: [
    'Why cold marketplaces are the hardest place to start',
    'Instagram DM, WhatsApp and walk-in scripts for local businesses',
    'The referral ask, for an alumnus and for a stranger',
    'The cold email to the person who owns the role',
    'The day 3 / day 8 / day 20 follow-up sequence',
    'The five-line scope message that prevents disputes',
    '50% advance, watermarked preview, then final files',
  ],
  faqs: [
    { question: 'What exactly do I receive?', answer: 'One PDF, delivered instantly, including the outreach pipeline sheet — 20 contacts per page.' },
    {
      question: 'Do I copy the scripts exactly?',
      answer:
        'Use them as the shape and swap in the specifics of the business you are writing to. A script sent unedited to fifty people reads exactly like one.',
    },
    TRIPWIRE_REFUND_FAQ,
  ],
  disclaimer:
    'General guidance on freelance outreach. No income, client, contract or outcome is promised or guaranteed, and no earnings figure is claimed. The scope and payment wording is a practical starting point, not legal advice — for a contract that matters, consult a qualified professional.',
  tags: ['first freelance client', 'cold dm script', 'freelancing india', 'client outreach', 'referral script'],
  gallery: [],
  deliveryFiles: ['The-First-Client-Scripts.pdf'],
  pairSlug: 'money-os',
};

export const theRs2000SkincareKit: Product = {
  slug: 'the-rs-2000-skincare-kit',
  title: 'The ₹2000 Skincare Kit — What To Actually Buy',
  tagline:
    'Exactly what to pick up at an Indian pharmacy for your skin type, with rupee ranges, and what to ignore entirely. Sunscreen is the only step that undoes everything else if you skip it. 4 pages + shopping list and 60-day tick sheet.',
  price: 299,
  pageCount: 4,
  trackerCount: 2,
  audience: 'Anyone who has never had a routine and is lost in front of a shelf',
  accent: { name: 'pink', hex: '#d6336c' },
  category: SELF_IMPROVEMENT,
  format: 'PDF',
  fileCount: 1,
  longDescription: [
    {
      heading: 'The Problem Is The Shelf, Not The Effort',
      paragraphs: [
        'Standing in front of two hundred products with no way to tell which three matter is where most people give up. This is a shopping list with price ranges and a skip-this section.',
        'Categories and rupee ranges, never brands — so it stays accurate when a product reformulates or disappears, and so nobody is being sold to twice.',
      ],
    },
  ],
  bulletPoints: [
    'Find your skin type in one hour with a wash test',
    'The only three steps that matter',
    'What to buy per skin type, with ₹ ranges',
    'The actives primer: niacinamide, vitamin C, salicylic acid, retinoid',
    'The five rules of actives, and the signs you overdid it',
    'What is a waste of money: fairness creams, daily scrubs, jade rollers',
    'When to stop reading and see a dermatologist',
  ],
  faqs: [
    { question: 'What exactly do I receive?', answer: 'One PDF, delivered instantly, including the printable shopping list and a 60-day routine tick sheet.' },
    {
      question: 'Does it name brands?',
      answer:
        'No. Categories and price ranges only, so it stays accurate when brands reformulate — and so you are not being advertised to inside something you paid for.',
    },
    TRIPWIRE_REFUND_FAQ,
  ],
  disclaimer:
    'General grooming and skincare information, not medical advice, and no result is promised. It names ingredient categories rather than brands. Cystic acne, scarring, melasma and any skin change that is spreading, bleeding or painful need a qualified dermatologist. Do not use unregulated skin-whitening injections or prescription steroid creams without a doctor supervising — both cause lasting damage and both are widely sold in India.',
  tags: ['skincare for beginners india', 'affordable skincare', 'pharmacy skincare', 'niacinamide', 'sunscreen india', 'skin type test'],
  gallery: [],
  deliveryFiles: ['The-Rs-2000-Skincare-Kit.pdf'],
  pairSlug: 'aura-os',
};

export const hostelKitchen: Product = {
  slug: 'hostel-kitchen',
  title: 'Hostel Kitchen — One Induction Plate, No Fridge, No Skill',
  tagline:
    'High-protein Indian cooking on one induction coil and a ₹3,000 monthly food budget. Fifteen meals under fifteen minutes, a costed weekly plan at around ₹700, and what to do during exam weeks when you cannot cook at all. 4 pages + grocery and cost sheet.',
  price: 299,
  pageCount: 4,
  trackerCount: 1,
  audience: 'Students living away from home, PG residents, first-job bachelors',
  accent: { name: 'lime', hex: '#5c940d' },
  category: SELF_IMPROVEMENT,
  format: 'PDF',
  fileCount: 1,
  longDescription: [
    {
      heading: 'Written For One Coil And No Fridge',
      paragraphs: [
        'Every hostel student in India eats badly and knows it. Almost nothing written about food assumes a single induction plate, no refrigeration, a shared room and a three-thousand-rupee month.',
        'This does. Nine items on the grocery list, fifteen meals, and the mess-food upgrades that work by adding rather than replacing.',
      ],
    },
  ],
  bulletPoints: [
    'The nine-item hostel grocery list',
    'Fifteen meals on one induction plate, under 15 minutes each',
    'A costed weekly plan at roughly ₹700',
    'No-cook high-protein options for exam weeks',
    'What to keep when you have no fridge',
    'Mess food upgraded: what to add rather than replace',
    'Eating enough protein without a kitchen at all',
  ],
  faqs: [
    { question: 'What exactly do I receive?', answer: 'One PDF, delivered instantly, including the weekly grocery and cost sheet.' },
    { question: 'I am not allowed to cook in my room.', answer: 'The no-cook section and the mess-food upgrades are written for exactly that, and neither needs an appliance.' },
    { question: 'Is it vegetarian?', answer: 'Both. Every meal build has a vegetarian and a non-vegetarian version.' },
    TRIPWIRE_REFUND_FAQ,
  ],
  disclaimer:
    'General nutrition and cooking information, not medical or dietetic advice. Prices are approximate ranges and vary by city and season. Anyone with a medical condition, a food allergy, or who is pregnant should speak to a doctor or a registered dietitian. Follow your hostel or PG rules on cooking appliances — some prohibit them, and this guide is not a reason to ignore that.',
  tags: ['hostel food india', 'induction cooking', 'student meals budget', 'high protein hostel', 'pg food', 'cheap indian meals'],
  gallery: [],
  deliveryFiles: ['Hostel-Kitchen.pdf'],
  pairSlug: 'glow-up-os',
};

/** All seven ₹299 tripwires, in the order BUILD-STATUS.txt lists them. */
export const allTripwireProducts: Product[] = [
  theScamShield,
  theDesiProteinBible,
  theInterviewEight,
  theFresherResumeFix,
  theRs2000SkincareKit,
  theFirstClientScripts,
  hostelKitchen,
];
