import type { Product } from '../types';
import { MONEY_AND_CAREER } from '../categories';

/**
 * Source: Dashrize-Products/PRODUCT-PIPELINE/Tier 2 - Rs 999 (core
 * products)/Money Habits OS/BRIEF.md.
 *
 * Compliance: the BRIEF marks this one CRITICAL and asks for the most
 * conservative framing in the catalogue. So: general financial-literacy
 * information only. No specific investment, fund, stock, scheme or insurance
 * product is named or recommended anywhere. No returns figure appears. Every
 * decision routes to a SEBI-registered adviser or a CA. The five traps from
 * Money OS (crypto, F&O, tip groups, MLM, "guaranteed returns") are repeated
 * here as warnings, never as options.
 *
 * `gallery` is empty: no cover graphic exists yet (PRODUCT-PIPELINE/
 * BUILD-STATUS.txt). The storefront generates a fallback.
 */
export const moneyHabitsOs: Product = {
  slug: 'money-habits-os',
  title: 'Money Habits OS — Your First Salary Arrived And Vanished',
  shortTitle: 'Money Habits OS — The First-Salary System',
  tagline:
    'What to do with money once it arrives. Where it actually goes, the emergency fund that comes before everything, the debt traps aimed specifically at you, and the tax nobody mentioned at 22. 19 designed pages + tracker pack. Habits and systems only — never investment advice. One payment, lifetime access.',
  price: 999,
  pageCount: 19,
  trackerCount: 4,
  audience: 'Indians 21-28 in a first or second job, and freelancers with irregular income',
  accent: { name: 'lime', hex: '#5c940d' },
  category: MONEY_AND_CAREER,
  format: 'PDF',
  fileCount: 5,
  modules: [
    {
      id: '01',
      title: 'WHERE IT GOES',
      pageCount: 6,
      highlights: [
        'Track one month honestly — the exercise almost nobody has actually done.',
        'The leaks that are specific to here: phone EMIs, BNPL, food delivery, and credit-card minimum payments.',
        'Separate accounts, and paying yourself first.',
      ],
    },
    {
      id: '02',
      title: 'THE FOUNDATIONS',
      pageCount: 7,
      highlights: [
        'The emergency fund, and why it comes before every other money decision.',
        'Insurance in plain language: term versus endowment, and why the policy a relative sold you may not be the thing you think it is.',
        'Debt traps: personal loans, revolving credit-card balances, gold loans.',
        'What compounding actually means — explained without a product attached to the end of it.',
      ],
    },
    {
      id: '03',
      title: 'TAX AND RECORDS',
      pageCount: 6,
      highlights: [
        'Salaried versus freelance, which are genuinely different problems.',
        'Form 16, TDS and filing an ITR, described as steps rather than assumed knowledge.',
        'What records to keep, and for how long.',
        'When to see a CA, and the questions to ask when you do.',
        'What not to do: crypto, F&O trading, tip groups and MLM — the same five traps as Money OS, again.',
      ],
    },
  ],
  longDescription: [
    {
      heading: 'Money OS Covered Earning It',
      paragraphs: [
        'Nothing in this catalogue covered what happens next. Your salary arrives, and three weeks later you cannot account for most of it — not because you were reckless, but because nobody ever showed you the arithmetic.',
        'This is that arithmetic. One honest month of tracking, then the small number of decisions that matter, in the order they matter.',
      ],
    },
    {
      heading: 'Deliberately Not Investment Advice',
      paragraphs: [
        'There is no fund here, no stock, no scheme, no insurance product and no returns figure. Not because those questions do not matter, but because a PDF is the wrong place to answer them and anyone answering them for free is usually selling something.',
        'What a PDF can do is the part that comes first and gets skipped: knowing where your money goes, having a fund that stops one bad month becoming debt, understanding the policy you already signed, and filing correctly. Every decision past that routes to a SEBI-registered adviser or a CA, by name, in the text.',
      ],
    },
    {
      heading: 'Freelancers Get Their Own Half',
      paragraphs: [
        'Irregular income breaks most budgeting advice, and freelance tax catches people at 22 who had no idea it applied to them. Both are covered directly rather than as a footnote to the salaried case.',
      ],
    },
  ],
  bulletPoints: [
    'One honest month of tracking, and the leaks specific to India',
    'Phone EMIs, BNPL, food delivery, credit-card minimums',
    'The emergency fund, and why it precedes every other decision',
    'Term versus endowment insurance in plain language',
    'Debt traps: personal loans, revolving credit, gold loans',
    'Form 16, TDS, ITR — salaried and freelance',
    'What records to keep, and what to ask a CA',
    'Monthly money sheet, expense-leak audit, emergency-fund tracker, tax-document checklist',
  ],
  faqs: [
    {
      question: 'What exactly do I receive?',
      answer: 'Five PDFs in one ZIP, delivered instantly: three modules plus the Tracker Pack.',
    },
    {
      question: 'Does it tell me where to invest?',
      answer:
        'No, and it will not. It names no fund, stock, scheme or insurance product and quotes no returns figure. That is a decision for a SEBI-registered adviser who knows your situation, and the guide says so repeatedly rather than once in small print.',
    },
    {
      question: 'I already bought Money OS. Is this the same book?',
      answer:
        'No. Money OS is about earning — skills, clients, getting paid. This is about what happens to the money afterwards. They are sequential, not overlapping.',
    },
    {
      question: 'I freelance. My income is different every month.',
      answer:
        'Covered directly. Irregular income breaks standard budgeting advice, and freelance tax is the thing that catches people who never knew it applied to them.',
    },
    {
      question: 'Is the tax section current?',
      answer:
        'It explains the mechanics — what Form 16 is, how TDS works, what filing involves, what records matter. Rates and slabs change every year, so it points you at the current ones and at a CA rather than printing a number that expires.',
    },
    {
      question: 'Refunds?',
      answer:
        "Digital files can't be returned once downloaded, so this is a final sale. Please read the contents above before buying. If a file doesn't arrive or won't open, message me and I'll fix it immediately.",
    },
  ],
  disclaimer:
    'Money Habits OS provides general financial-literacy information for educational purposes only. It is not investment, tax, legal or insurance advice. It does not recommend any specific investment, mutual fund, stock, scheme, insurance product or financial institution, and it makes no claim or projection about returns of any kind. Nothing in it should be acted on as a substitute for advice from a SEBI-registered investment adviser or a qualified chartered accountant who knows your circumstances. Tax rules, rates and slabs change; verify anything time-sensitive against the current rules or with a CA before you rely on it. Never invest money you cannot afford to lose, and treat any offer of guaranteed or unusually high returns as a fraud.',
  tags: [
    'first salary india',
    'budgeting india',
    'emergency fund',
    'personal finance india',
    'financial literacy',
    'term insurance basics',
    'credit card debt trap',
    'bnpl',
    'freelance tax india',
    'itr filing',
    'form 16',
    'tds',
    'money habits',
    'expense tracking',
  ],
  gallery: [{ filename: '1-cover-thumbnail.png', role: 'cover', alt: 'Money Habits OS cover — what happens to your first salary.' }],
  deliveryFiles: [
    'Module-01-WHERE-IT-GOES.pdf',
    'Module-02-THE-FOUNDATIONS.pdf',
    'Module-03-TAX-AND-RECORDS.pdf',
    'Tracker-Pack.pdf',
    'Money-Habits-OS-Complete.zip',
  ],
  // BRIEF: "the natural sequel" to Money OS.
  pairSlug: 'money-os',
};
