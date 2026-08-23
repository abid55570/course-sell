import type { Product } from '../types';
import { TALKING_TO_YOUR_PARENTS } from '../categories';

/**
 * Source: Dashrize-Products/TALKING-TO-YOUR-PARENTS/3 - LISTING TEXT/listing-copy-paste.md
 *
 * Twelve individual guides (₹499 each) plus the 12-guide set (₹1,999). Every
 * guide walks one hard conversation Indian families have, ending in an
 * honest-limits page and, where relevant, the crisis helplines.
 *
 * None of these guides ship a cover image — only the set does. Their
 * `gallery` is deliberately `[]`; see components/product/CoverFallback.tsx
 * for how the storefront renders a product with no cover.
 *
 * Per-guide copy: title is exactly the filename with dashes turned to
 * spaces. Unlike the other two families, this listing file gives no
 * short-description *template* for individuals — only a "Ready-made hook"
 * per guide. `tagline` is therefore that hook plus the one page/sheet fact
 * the file states for the whole family ("Every guide is 20 designed pages
 * with 3 printable sheets"), not a longer invented description.
 *
 * The FAQ and disclaimer are the family's approved text (given under "The
 * set listing" but written about the guide format and the family's safety
 * position generally, not the set specifically), reused verbatim across
 * every listing in the family, same as the other two families.
 *
 * `longDescription` and `bulletPoints` are left empty for the individual
 * guides for the same reason as the other two families: no per-guide
 * long-form copy exists to draw from. The set's long description is
 * transcribed verbatim from the listing file's fenced block.
 */

const PARENTS_FAQS = [
    { question: 'Is this only for Indian families?', answer: 'It is written for them specifically — the pressures, the relatives, the phrases, the helplines. Much of it travels, but that is who it is for.' },
    { question: 'How long is each guide?', answer: '20 designed pages, including 3 printable sheets. 240 pages across the set.' },
    { question: 'Will this make my parents agree?', answer: 'No, and every guide says so on its last page. What it does is answer the fear underneath the argument, give you the sentences, and stop you making the five mistakes that turn one difficult month into a permanent problem.' },
    { question: 'Can I buy just one?', answer: 'Yes, each is listed separately at ₹499.' },
    { question: 'Which one should I start with?', answer: 'If something specific is happening, that one. If things are just generally tense, start with "Being Treated as an Adult" and "Saying No" — most daily friction lives there.' },
    { question: 'Is the mental health one safe to give to someone struggling?', answer: 'It opens with the crisis helplines before any strategy, and it says plainly that if you are an adult with your own money you do not need permission to get help. It is not a substitute for a qualified professional and it says that too.' },
  ];

const PARENTS_DISCLAIMER = 'General information for adults. Nothing here is legal, financial, medical, psychological or career advice, and no outcome of any kind is claimed or implied — including that any conversation will succeed. Every family is different. Where a situation involves any risk to your safety, that outranks any strategy in these guides: in India, emergency 112, women\'s helpline 181, Childline 1098, and Tele-MANAS 14416 (free and confidential, any hour). Worked examples are composites written to illustrate a method, not real people.';

const PARENTS_HELPLINES = [
    { name: 'Emergency', number: '112', context: 'Where a situation involves any risk to your safety, that outranks any strategy in these guides.' },
    { name: 'Women\'s helpline', number: '181', context: 'Where a situation involves any risk to your safety, that outranks any strategy in these guides.' },
    { name: 'Childline', number: '1098', context: 'Where a situation involves any risk to your safety, that outranks any strategy in these guides.' },
    { name: 'Tele-MANAS', number: '14416', context: 'Free and confidential, any hour, if you need someone to talk to.' },
  ];

export const beingTreatedAsAnAdultInYourOwnHome: Product = {
  slug: 'being-treated-as-an-adult-in-your-own-home',
  title: 'Being Treated as an Adult in Your Own Home',
  tagline: 'Don\'t ask for respect. Ask for one rule, and take over one bill. 20 designed pages, including 3 printable sheets.',
  price: 499,
  pageCount: 20,
  trackerCount: 3,
  accent: TALKING_TO_YOUR_PARENTS.accent,
  category: TALKING_TO_YOUR_PARENTS,
  format: 'PDF',
  fileCount: 1,
  featured: true,
  longDescription: [],
  bulletPoints: [],
  faqs: PARENTS_FAQS,
  disclaimer: PARENTS_DISCLAIMER,
  helplines: PARENTS_HELPLINES,
  tags: ['talking to your parents', 'family conversations', 'indian family'],
  gallery: [],
  deliveryFiles: ['Being-Treated-as-an-Adult-in-Your-Own-Home.pdf'],
  setSlug: 'talking-to-your-parents-full-set',
};

export const gettingYourParentsToSeeADoctor: Product = {
  slug: 'getting-your-parents-to-see-a-doctor',
  title: 'Getting Your Parents to See a Doctor',
  tagline: 'Don\'t ask. Book it, take the day off, and tell them you have. 20 designed pages, including 3 printable sheets.',
  price: 499,
  pageCount: 20,
  trackerCount: 3,
  accent: TALKING_TO_YOUR_PARENTS.accent,
  category: TALKING_TO_YOUR_PARENTS,
  format: 'PDF',
  fileCount: 1,
  longDescription: [],
  bulletPoints: [],
  faqs: PARENTS_FAQS,
  disclaimer: PARENTS_DISCLAIMER,
  helplines: PARENTS_HELPLINES,
  tags: ['talking to your parents', 'family conversations', 'indian family'],
  gallery: [],
  deliveryFiles: ['Getting-Your-Parents-to-See-a-Doctor.pdf'],
  setSlug: 'talking-to-your-parents-full-set',
};

export const sayingNoToYourFamilyWithoutLosingThem: Product = {
  slug: 'saying-no-to-your-family-without-losing-them',
  title: 'Saying No to Your Family Without Losing Them',
  tagline: 'Never give a reason. A reason is a problem for them to solve. 20 designed pages, including 3 printable sheets.',
  price: 499,
  pageCount: 20,
  trackerCount: 3,
  accent: TALKING_TO_YOUR_PARENTS.accent,
  category: TALKING_TO_YOUR_PARENTS,
  format: 'PDF',
  fileCount: 1,
  longDescription: [],
  bulletPoints: [],
  faqs: PARENTS_FAQS,
  disclaimer: PARENTS_DISCLAIMER,
  helplines: PARENTS_HELPLINES,
  tags: ['talking to your parents', 'family conversations', 'indian family'],
  gallery: [],
  deliveryFiles: ['Saying-No-to-Your-Family-Without-Losing-Them.pdf'],
  setSlug: 'talking-to-your-parents-full-set',
};

export const talkingToYourParentsAboutMoney: Product = {
  slug: 'talking-to-your-parents-about-money',
  title: 'Talking to Your Parents About Money',
  tagline: 'Set the number before anyone asks, and automate it. 20 designed pages, including 3 printable sheets.',
  price: 499,
  pageCount: 20,
  trackerCount: 3,
  accent: TALKING_TO_YOUR_PARENTS.accent,
  category: TALKING_TO_YOUR_PARENTS,
  format: 'PDF',
  fileCount: 1,
  longDescription: [],
  bulletPoints: [],
  faqs: PARENTS_FAQS,
  disclaimer: PARENTS_DISCLAIMER,
  helplines: PARENTS_HELPLINES,
  tags: ['talking to your parents', 'family conversations', 'indian family'],
  gallery: [],
  deliveryFiles: ['Talking-to-Your-Parents-About-Money.pdf'],
  setSlug: 'talking-to-your-parents-full-set',
};

export const tellingYourParentsAboutBadResults: Product = {
  slug: 'telling-your-parents-about-bad-results',
  title: 'Telling Your Parents About Bad Results',
  tagline: 'Tell them yourself, within a day — and bring the routes sheet on day two. 20 designed pages, including 3 printable sheets.',
  price: 499,
  pageCount: 20,
  trackerCount: 3,
  accent: TALKING_TO_YOUR_PARENTS.accent,
  category: TALKING_TO_YOUR_PARENTS,
  format: 'PDF',
  fileCount: 1,
  longDescription: [],
  bulletPoints: [],
  faqs: PARENTS_FAQS,
  disclaimer: PARENTS_DISCLAIMER,
  helplines: PARENTS_HELPLINES,
  tags: ['talking to your parents', 'family conversations', 'indian family'],
  gallery: [],
  deliveryFiles: ['Telling-Your-Parents-About-Bad-Results.pdf'],
  setSlug: 'talking-to-your-parents-full-set',
};

export const tellingYourParentsSomethingWentWrong: Product = {
  slug: 'telling-your-parents-something-went-wrong',
  title: 'Telling Your Parents Something Went Wrong',
  tagline: 'The delay costs more than the news. Forty-eight hours. 20 designed pages, including 3 printable sheets.',
  price: 499,
  pageCount: 20,
  trackerCount: 3,
  accent: TALKING_TO_YOUR_PARENTS.accent,
  category: TALKING_TO_YOUR_PARENTS,
  format: 'PDF',
  fileCount: 1,
  longDescription: [],
  bulletPoints: [],
  faqs: PARENTS_FAQS,
  disclaimer: PARENTS_DISCLAIMER,
  helplines: PARENTS_HELPLINES,
  tags: ['talking to your parents', 'family conversations', 'indian family'],
  gallery: [],
  deliveryFiles: ['Telling-Your-Parents-Something-Went-Wrong.pdf'],
  setSlug: 'talking-to-your-parents-full-set',
};

export const tellingYourParentsYouAreMovingAway: Product = {
  slug: 'telling-your-parents-you-are-moving-away',
  title: 'Telling Your Parents You Are Moving Away',
  tagline: 'Three named people who have actually agreed to come. Not a promise. 20 designed pages, including 3 printable sheets.',
  price: 499,
  pageCount: 20,
  trackerCount: 3,
  accent: TALKING_TO_YOUR_PARENTS.accent,
  category: TALKING_TO_YOUR_PARENTS,
  format: 'PDF',
  fileCount: 1,
  longDescription: [],
  bulletPoints: [],
  faqs: PARENTS_FAQS,
  disclaimer: PARENTS_DISCLAIMER,
  helplines: PARENTS_HELPLINES,
  tags: ['talking to your parents', 'family conversations', 'indian family'],
  gallery: [],
  deliveryFiles: ['Telling-Your-Parents-You-Are-Moving-Away.pdf'],
  setSlug: 'talking-to-your-parents-full-set',
};

export const tellingYourParentsYouAreNotReadyToGetMarried: Product = {
  slug: 'telling-your-parents-you-are-not-ready-to-get-married',
  title: 'Telling Your Parents You Are Not Ready to Get Married',
  tagline: '"I\'m not ready" is unwinnable. A month and a condition is not. 20 designed pages, including 3 printable sheets.',
  price: 499,
  pageCount: 20,
  trackerCount: 3,
  accent: TALKING_TO_YOUR_PARENTS.accent,
  category: TALKING_TO_YOUR_PARENTS,
  format: 'PDF',
  fileCount: 1,
  longDescription: [],
  bulletPoints: [],
  faqs: PARENTS_FAQS,
  disclaimer: PARENTS_DISCLAIMER,
  helplines: PARENTS_HELPLINES,
  tags: ['talking to your parents', 'family conversations', 'indian family'],
  gallery: [],
  deliveryFiles: ['Telling-Your-Parents-You-Are-Not-Ready-to-Get-Married.pdf'],
  setSlug: 'talking-to-your-parents-full-set',
};

export const tellingYourParentsYouWantToChangeYourCareer: Product = {
  slug: 'telling-your-parents-you-want-to-change-your-career',
  title: 'Telling Your Parents You Want to Change Your Career',
  tagline: 'They didn\'t ask about the field. They asked whether you\'ll be safe. 20 designed pages, including 3 printable sheets.',
  price: 499,
  pageCount: 20,
  trackerCount: 3,
  accent: TALKING_TO_YOUR_PARENTS.accent,
  category: TALKING_TO_YOUR_PARENTS,
  format: 'PDF',
  fileCount: 1,
  longDescription: [],
  bulletPoints: [],
  faqs: PARENTS_FAQS,
  disclaimer: PARENTS_DISCLAIMER,
  helplines: PARENTS_HELPLINES,
  tags: ['talking to your parents', 'family conversations', 'indian family'],
  gallery: [],
  deliveryFiles: ['Telling-Your-Parents-You-Want-to-Change-Your-Career.pdf'],
  setSlug: 'talking-to-your-parents-full-set',
};

export const tellingYourParentsYouWantToMoveOut: Product = {
  slug: 'telling-your-parents-you-want-to-move-out',
  title: 'Telling Your Parents You Want to Move Out',
  tagline: 'Say "nothing is wrong" before you say anything else. 20 designed pages, including 3 printable sheets.',
  price: 499,
  pageCount: 20,
  trackerCount: 3,
  accent: TALKING_TO_YOUR_PARENTS.accent,
  category: TALKING_TO_YOUR_PARENTS,
  format: 'PDF',
  fileCount: 1,
  longDescription: [],
  bulletPoints: [],
  faqs: PARENTS_FAQS,
  disclaimer: PARENTS_DISCLAIMER,
  helplines: PARENTS_HELPLINES,
  tags: ['talking to your parents', 'family conversations', 'indian family'],
  gallery: [],
  deliveryFiles: ['Telling-Your-Parents-You-Want-to-Move-Out.pdf'],
  setSlug: 'talking-to-your-parents-full-set',
};

export const tellingYourParentsYouWantToSeeATherapist: Product = {
  slug: 'telling-your-parents-you-want-to-see-a-therapist',
  title: 'Telling Your Parents You Want to See a Therapist',
  tagline: 'Don\'t say depressed. Say you haven\'t slept in two months. 20 designed pages, including 3 printable sheets.',
  price: 499,
  pageCount: 20,
  trackerCount: 3,
  accent: TALKING_TO_YOUR_PARENTS.accent,
  category: TALKING_TO_YOUR_PARENTS,
  format: 'PDF',
  fileCount: 1,
  longDescription: [],
  bulletPoints: [],
  faqs: PARENTS_FAQS,
  disclaimer: PARENTS_DISCLAIMER,
  helplines: PARENTS_HELPLINES,
  tags: ['talking to your parents', 'family conversations', 'indian family'],
  gallery: [],
  deliveryFiles: ['Telling-Your-Parents-You-Want-to-See-a-Therapist.pdf'],
  setSlug: 'talking-to-your-parents-full-set',
};

export const whenYourParentsDoNotApproveOfWhoYouAreWith: Product = {
  slug: 'when-your-parents-do-not-approve-of-who-you-are-with',
  title: 'When Your Parents Do Not Approve of Who You Are With',
  tagline: 'Assess the risk before you disclose. Then stop arguing for six months. 20 designed pages, including 3 printable sheets.',
  price: 499,
  pageCount: 20,
  trackerCount: 3,
  accent: TALKING_TO_YOUR_PARENTS.accent,
  category: TALKING_TO_YOUR_PARENTS,
  format: 'PDF',
  fileCount: 1,
  longDescription: [],
  bulletPoints: [],
  faqs: PARENTS_FAQS,
  disclaimer: PARENTS_DISCLAIMER,
  helplines: PARENTS_HELPLINES,
  tags: ['talking to your parents', 'family conversations', 'indian family'],
  gallery: [],
  deliveryFiles: ['When-Your-Parents-Do-Not-Approve-of-Who-You-Are-With.pdf'],
  setSlug: 'talking-to-your-parents-full-set',
};

export const talkingToYourParentsGuides: Product[] = [
  beingTreatedAsAnAdultInYourOwnHome,
  gettingYourParentsToSeeADoctor,
  sayingNoToYourFamilyWithoutLosingThem,
  talkingToYourParentsAboutMoney,
  tellingYourParentsAboutBadResults,
  tellingYourParentsSomethingWentWrong,
  tellingYourParentsYouAreMovingAway,
  tellingYourParentsYouAreNotReadyToGetMarried,
  tellingYourParentsYouWantToChangeYourCareer,
  tellingYourParentsYouWantToMoveOut,
  tellingYourParentsYouWantToSeeATherapist,
  whenYourParentsDoNotApproveOfWhoYouAreWith,
];

export const talkingToYourParentsFullSet: Product = {
  slug: 'talking-to-your-parents-full-set',
  title: 'Talking to Your Parents — 12 Guides, 240 Pages',
  tagline: 'Twelve conversations Indian families actually have. What they say, what they actually mean, the exact sentences to use, and the honest page about when it does not work. 240 pages, 12 guides, 36 printable sheets. One payment, lifetime access.',
  price: 1999,
  anchorPrice: 5988,
  pageCount: 240,
  trackerCount: 36,
  accent: TALKING_TO_YOUR_PARENTS.accent,
  category: TALKING_TO_YOUR_PARENTS,
  format: 'PDF',
  fileCount: 2,
  longDescription: [
    {
      heading: '"WHAT ABOUT YOUR FUTURE?" IS NOT A QUESTION ABOUT YOUR FUTURE',
      paragraphs: [
        'It means: will you be able to feed yourself when we are not here.',
        'That gap is why these conversations go badly. Your parents say one thing, they are afraid of another, and you spend a year answering the sentence instead of the fear. Nobody has ever been argued out of being afraid.',
        'So page 3 of every guide in this pack is a straight table: what they say in the left column, what is actually underneath it in the right. That page does most of the work. The rest gives you four moves, the exact sentences to say out loud, a timeline in months rather than one evening, and a page on what to do when it goes wrong.',
      ],
    },
    {
      heading: 'THE TWELVE CONVERSATIONS',
      paragraphs: [
        '01 Changing your career',
        '02 Wanting to see a therapist',
        '03 Not being ready to get married',
        '04 Money — contributions, requests, and the family\'s finances',
        '05 Moving out',
        '06 Results that were not what they wanted',
        '07 When they do not approve of who you are with',
        '08 Telling them something went wrong — job, exam, money, a plan',
        '09 Saying no to family obligations',
        '10 Getting your parents to see a doctor',
        '11 Being treated as an adult in your own home',
        '12 Moving away for work',
      ],
    },
    {
      heading: 'A FEW OF THE ACTUAL ANSWERS',
      paragraphs: [
        'Do not say "I need my own space." Say "the commute is three hours and it\'s finishing me." One is a verdict on the home they built. The other is a reason they can repeat at a wedding with their head up.',
        'Do not say "I think I\'m depressed." Say "I\'m not sleeping and I can\'t concentrate, and I want it checked properly." Indian households know how to respond to symptoms. They do not know how to respond to categories.',
        'Never give a reason when you refuse something. A reason is a problem for them to solve — "I have work" becomes "take leave, it\'s family." "That\'s not something I can do" has nothing to solve.',
        'Do not ask to be treated like an adult. Ask for one specific rule to change, and take over one household bill permanently. Parents update on evidence, not on birthdays.',
        'Do not tell them you lost your job once you\'ve fixed it. You do not control when they find out, and the anger about the five weeks of pretending always outlives the anger about the job.',
      ],
    },
    {
      heading: 'AND THE PART MOST BOOKS LEAVE OUT',
      paragraphs: [
        'Every guide has a page called THE HONEST LIMITS. Some parents never come round. Some families react to a relationship with real danger, and that guide starts with a risk assessment rather than a script. Where something is a safety matter rather than a communication one, these guides say so plainly and give the numbers — Tele-MANAS 14416, emergency 112, women\'s helpline 181, Childline 1098.',
        'That honesty is the format, not a disclaimer bolted on the end.',
      ],
    },
  ],
  bulletPoints: [
    '12 guides, 20 designed pages each, 240 pages total',
    '36 printable sheets across the set',
    'A "what they say vs what they mean" table on page 3 of every guide',
    'Exact sentences to say out loud, and a timeline in months, not one evening',
    'A page on what to do when it goes wrong, in every guide',
    'Crisis helplines given plainly wherever safety outranks strategy',
    'Instant download · One payment · Lifetime access',
  ],
  faqs: PARENTS_FAQS,
  disclaimer: PARENTS_DISCLAIMER,
  helplines: PARENTS_HELPLINES,
  tags: ['talking to your parents', 'family conversations', 'indian family'],
  gallery: [
    {
      filename: '1-cover-thumbnail.png',
      role: 'cover',
      alt: 'Talking to Your Parents cover: twelve conversations, honestly handled.',
    },
  ],
  deliveryFiles: ['Talking-To-Your-Parents.zip', 'START-HERE.txt'],
};

/** All twelve individual guides plus the full-set product, in filename order. */
export const allTalkingToYourParentsProducts: Product[] = [...talkingToYourParentsGuides, talkingToYourParentsFullSet];
