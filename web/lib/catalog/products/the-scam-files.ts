import type { Product } from '../types';
import { THE_SCAM_FILES } from '../categories';

/**
 * Source: Dashrize-Products/THE-SCAM-FILES/3 - LISTING TEXT/listing-copy-paste.md
 *
 * Eight individual guides (₹499 each) plus the eight-guide set (₹1,999).
 * Unlike the pipeline products, this family has approved listing copy, so the
 * set's long description, FAQs and disclaimer below are transcribed from that
 * file rather than written from a brief. Each individual guide's `tagline`
 * carries its hook from the listing file's own hook table, verbatim.
 *
 * Compliance, from the approved disclaimer: general information for adults in
 * India, not legal or financial advice, and NO recovery or outcome is claimed
 * — the listing file is explicit that "anyone who PROMISES recovery is
 * themselves the follow-up scam". Every number here (1930, cybercrime.gov.in,
 * Tele-MANAS 14416) appears in the approved text; none is invented.
 *
 * No individual guide ships a cover image — only the set does — so their
 * `gallery` is `[]` and the storefront falls back to a generated cover, the
 * same precedent as the other guide families.
 */

const SCAM_FILES_FAQS = [
  {
    question: 'Is this legal/financial advice?',
    answer:
      'No. It is general information about how frauds operate and how to report them — 1930, cybercrime.gov.in, your bank. For specific situations, the guides point to free legal aid through the district Legal Services Authorities.',
  },
  {
    question: 'Will this get my money back?',
    answer:
      'Nobody can promise that, and the guides say so honestly. Recovery depends overwhelmingly on speed — which is why every guide drills the first hour. Anyone who PROMISES recovery is themselves the follow-up scam, and the guides cover that too.',
  },
  {
    question: 'Is it current? Scams change constantly.',
    answer:
      'The costumes change; the skeletons don’t. Every guide teaches the underlying mechanism — "an OTP is spoken to no one", "money flows employer to employee", "never act through the message" — precisely so it keeps working on variants that haven’t been invented yet.',
  },
  {
    question: 'Can my parents read it?',
    answer:
      'It is written for exactly that. Plain language, large-print fridge pages, and a family drill in every guide. The highest-value thing you can do with this pack is one dinner conversation.',
  },
  {
    question: 'How long is each guide?',
    answer: '20 designed pages including 3 printable sheets. 160 pages across the set.',
  },
  {
    question: 'Can I buy just one?',
    answer:
      'Yes — ₹499 each. Start with the one aimed at your household: parents with savings → the Digital Arrest and UPI guides; job hunters → the Fake Job Offer; anyone on a matrimonial site → the Matrimonial Scam.',
  },
];

const SCAM_FILES_DISCLAIMER =
  'General information for adults in India. Not legal, financial or investment advice, and no recovery or outcome of any kind is claimed or implied. Scam patterns and official procedures change — verify current processes with official sources: 1930, cybercrime.gov.in, and your bank’s official channels. Cases described are composites of publicly reported patterns, not real people. If a fraud has left you or a family member struggling, Tele-MANAS is free and confidential on 14416, at any hour.';

const SCAM_FILES_HELPLINES = [
  {
    name: 'Cybercrime helpline',
    number: '1930',
    context:
      'If money has just left an account to a fraud, call 1930 and file at cybercrime.gov.in immediately. Minutes decide what can be held.',
  },
  {
    name: 'Tele-MANAS',
    number: '14416',
    context:
      'If a fraud has left you or a family member struggling, Tele-MANAS is free and confidential at any hour.',
  },
];

const SCAM_FILES_TAGS = [
  'online fraud india',
  'cyber crime india',
  'digital arrest scam',
  'upi fraud',
  'otp scam',
  'fake job offer',
  'task scam telegram',
  'loan app harassment',
  'investment fraud whatsapp',
  'matrimonial scam',
  'kyc scam sms',
  'protect parents from scams',
  '1930 cybercrime',
  'scam awareness',
];

/** Every individual guide shares this shape; only slug, title and hook differ. */
function scamGuide(slug: string, title: string, hook: string, deliveryFile: string): Product {
  return {
    slug,
    title,
    tagline: `${hook} 20 designed pages, 3 printable sheets, and a FRIDGE PAGE written to be readable mid-panic. Part of The Scam Files.`,
    price: 499,
    pageCount: 20,
    trackerCount: 3,
    audience: 'Indian families — and the relative who will actually get the call',
    accent: THE_SCAM_FILES.accent,
    category: THE_SCAM_FILES,
    format: 'PDF',
    fileCount: 1,
    longDescription: [],
    bulletPoints: [
      'The anatomy of the scam, stage by stage',
      'The exact script the criminals use, and what each line actually means',
      'A composite case, so the pattern feels familiar before it arrives',
      'The defence, and the one tell that ends it',
      'The first hour after money has gone: 1930, the portal, the bank, in order',
      'The family layer: the dinner conversation, the drill, and a printable fridge page',
    ],
    faqs: SCAM_FILES_FAQS,
    disclaimer: SCAM_FILES_DISCLAIMER,
    helplines: SCAM_FILES_HELPLINES,
    tags: SCAM_FILES_TAGS,
    gallery: [],
    deliveryFiles: [deliveryFile],
    setSlug: 'the-scam-files',
  };
}

export const scamDigitalArrest = scamGuide(
  'the-digital-arrest-scam',
  'The Digital Arrest Scam',
  'Nobody can arrest you on a video call. Teach your parents the one sentence that ends it.',
  'The-Digital-Arrest-Scam.pdf'
);

export const scamUpiOtpFraud = scamGuide(
  'upi-and-otp-fraud',
  'UPI and OTP Fraud',
  'The six digits that empty accounts — and the two rules that beat every variant at once.',
  'UPI-and-OTP-Fraud.pdf'
);

export const scamFakeJobOffer = scamGuide(
  'the-fake-job-offer',
  'The Fake Job Offer',
  'Real jobs never ask for money. Every version of the one that does.',
  'The-Fake-Job-Offer.pdf'
);

export const scamTaskScam = scamGuide(
  'the-task-scam',
  'The Task Scam',
  'The job that pays you first. The payments are real. They are bait.',
  'The-Task-Scam.pdf'
);

export const scamLoanAppTrap = scamGuide(
  'the-loan-app-trap',
  'The Loan App Trap',
  'Seven days, half kept, all your contacts. How to get out, and what collectors can actually do.',
  'The-Loan-App-Trap.pdf'
);

export const scamGuaranteedReturns = scamGuide(
  'the-guaranteed-returns-scam',
  'The Guaranteed Returns Scam',
  'Nobody doubles your money — and your colleague who got paid is the marketing, not the proof.',
  'The-Guaranteed-Returns-Scam.pdf'
);

export const scamMatrimonial = scamGuide(
  'the-matrimonial-and-romance-scam',
  'The Matrimonial and Romance Scam',
  'The NRI match who is never quite here, and the checks that feel unromantic and save lakhs.',
  'The-Matrimonial-and-Romance-Scam.pdf'
);

export const scamImpersonationMachine = scamGuide(
  'the-impersonation-machine',
  'The Impersonation Machine',
  'Your KYC does not expire today. One reflex beats every fake SMS ever sent.',
  'The-Impersonation-Machine.pdf'
);

/** The full set. Long description transcribed from the approved listing file. */
export const theScamFiles: Product = {
  slug: 'the-scam-files',
  title: 'The Scam Files — 8 Guides, 160 Pages',
  shortTitle: 'The Scam Files',
  tagline:
    'How the eight frauds taking crores from Indian families actually work — the anatomy, the exact scripts, the one tell of each, and the first hour after money is gone. 160 pages, 24 printable sheets, a fridge page in every guide. Protect your parents.',
  price: 1999,
  // ₹3,992 if bought separately (8 × ₹499), stated in the listing file.
  anchorPrice: 3992,
  anchorNote: 'if bought separately (8 × ₹499)',
  pageCount: 160,
  trackerCount: 24,
  audience: 'Indian families — parents with savings, job hunters, anyone on a matrimonial site',
  accent: THE_SCAM_FILES.accent,
  category: THE_SCAM_FILES,
  format: 'PDF',
  fileCount: 8,
  featured: true,
  longDescription: [
    {
      heading: 'Your Parents Will Get This Call',
      paragraphs: [
        'A parcel with drugs in their name. A video call from "the CBI". An order to stay on the line and tell no one — and then to transfer the savings to a "safe account" for verification.',
        'It is called the digital arrest scam, it does not exist in any law, and it has taken crores from retired teachers, bank officers and doctors. It does not work on stupid people. It works on frightened people — and it is engineered, professionally, to produce fright.',
      ],
    },
    {
      heading: 'Eight Machines, Opened Up',
      paragraphs: [
        '01 THE "DIGITAL ARREST" — the fake police call, minute by minute, and the one sentence that ends it: "I’ll come to the station."',
        '02 UPI AND OTP FRAUD — every trick that ends with you typing six digits, and the two rules that beat all of them at once.',
        '03 THE FAKE JOB OFFER — registration fees, laptop deposits, and the overseas offer that ends with a confiscated passport.',
        '04 THE TASK SCAM — the Telegram job that pays you first. The payments are real. They are bait.',
        '05 THE LOAN APP TRAP — seven days, half kept, and your contact list harvested as collateral for a shame campaign.',
        '06 THE GUARANTEED RETURNS SCAM — the WhatsApp trading group, the beautiful fake dashboard, and the friend who genuinely got paid.',
        '07 THE MATRIMONIAL SCAM — the NRI match who is never quite here, and the customs officer who calls about the gifts.',
        '08 THE IMPERSONATION MACHINE — KYC expiry, disconnection tonight, the ₹49 parcel fee, and the boss on a new WhatsApp number.',
      ],
    },
    {
      heading: 'Every Guide, The Same Method',
      paragraphs: [
        'The anatomy stage by stage. The exact script the criminals use — and what each line actually means. A composite case so the pattern feels familiar before it ever arrives. The defence. The first hour after money has gone (1930, the portal, the bank, in order). And the family layer: the dinner conversation, the drill, and a printable FRIDGE PAGE written to be readable by someone who is currently being told they are under arrest.',
      ],
    },
    {
      heading: 'What This Pack Is Really For',
      paragraphs: [
        'Not you. You will probably spot most of these. It is for the people you love who won’t — the parent alone on a weekday morning, the cousin job-hunting in month eight, the uncle with the FD and a WhatsApp trading group. Every guide ends with how to protect them, because every scam in this pack depends on isolation and shame, and a family that talks has neither.',
      ],
    },
    {
      heading: 'What This Pack Does Not Do',
      paragraphs: [
        'It does not promise recovery — nobody honest can. It is not legal or financial advice. It will not stop the calls coming. What it does is make sure that when they come, everyone in your house has already heard the script — and a scam whose script you know is a phone call you hang up on.',
      ],
    },
  ],
  bulletPoints: [
    'Eight guides, 160 designed pages, 24 printable sheets',
    'The anatomy, the script, and the one tell of each fraud',
    'A composite case per guide, drawn from publicly reported patterns',
    'The first hour after money is gone: 1930, cybercrime.gov.in, your bank',
    'A family drill and a large-print fridge page in every guide',
    'Written so your parents can actually read it',
  ],
  faqs: SCAM_FILES_FAQS,
  disclaimer: SCAM_FILES_DISCLAIMER,
  helplines: SCAM_FILES_HELPLINES,
  tags: SCAM_FILES_TAGS,
  gallery: [
    { filename: '1-cover-thumbnail.png', role: 'cover', alt: 'The Scam Files cover.' },
  ],
  deliveryFiles: ['The-Scam-Files.zip'],
};

/** All nine listings in the family, individuals first then the set. */
export const allScamFilesProducts: Product[] = [
  scamDigitalArrest,
  scamUpiOtpFraud,
  scamFakeJobOffer,
  scamTaskScam,
  scamLoanAppTrap,
  scamGuaranteedReturns,
  scamMatrimonial,
  scamImpersonationMachine,
  theScamFiles,
];
