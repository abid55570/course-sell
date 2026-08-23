import type { Bundle } from './types';

/**
 * Source: Dashrize-Products/BUNDLES/<name>/3 - LISTING TEXT/listing-copy-paste.md
 * and Dashrize-Products/READ-ME-FIRST.txt (pricing ladder, pairings).
 *
 * Four of these six named bundles mix in products that are NOT among
 * Dropdesk's six shipped products (no PDFs, no approved listing copy, no
 * gallery images built for this catalog): Skin OS, Sleep OS, "30 Days of
 * Focus", Money Habits OS, English Confidence OS. Those components are
 * recorded with `slug: null, inCatalog: false` rather than invented as fake
 * catalog entries, and the bundle's `availableToday` is false. Only
 * "Everything Bundle" and "The Complete Man" are composed entirely of the
 * six shipped products and can be sold today. Flagged in the catalog build
 * report.
 */
export const bundles: Bundle[] = [
  {
    slug: 'everything-bundle',
    title: 'Everything Bundle — All Six Systems + Every Future Release',
    price: 2999,
    separatePrice: 5994,
    tagline:
      'Six complete systems. 177 designed pages, 30 printable trackers, and everything I release later at no extra cost. One payment, lifetime access.',
    longDescription: [
      {
        heading: 'Six Systems. One Payment. Including Everything I Build Next.',
        paragraphs: [
          'GLOW-UP OS (39 pages) — Body, Looks, Mind — for Indian men 18-28',
          'AURA OS (42 pages) — Body, Looks, Mind — for Indian women 18-28',
          'SOCIAL OS (20 pages) — Conversation, Presence, Circle',
          'MONEY OS (39 pages) — Skill, Client, Clipping, System',
          'STUDY OS (18 pages) — System, Focus, Exam Craft',
          'CAREER OS (19 pages) — Resume, Interviews, Interview & Offer',
          'Every one includes a printable tracker pack. Thirty sheets in total.',
        ],
      },
      {
        heading: 'What These Have in Common',
        paragraphs: [
          'Every number is in rupees. Every product costs nothing to start. Not one of them contains an earnings screenshot, a rank promise, a placement guarantee, or a before-and-after photo — because those are what the rest of this market sells and they are why nobody trusts it.',
          'Money OS argues against dropshipping, crypto trading, betting apps, MLM and "passive income". Study OS refuses to promise a rank. Career OS argues against placement-guarantee courses. Social OS argues against pickup artistry. Glow-Up and Aura route anything clinical to a doctor.',
          'That restraint is the product.',
        ],
      },
      {
        heading: 'Lifetime Updates, Honoured Strictly',
        paragraphs: [
          'When a new system ships, you get it. No extra payment, no upgrade fee, no "founding member" tier that quietly excludes you later.',
        ],
      },
      {
        heading: 'Do Not Read All Six This Weekend',
        paragraphs: [
          'The most common way to waste this is to read everything and start nothing. The START-HERE file inside picks one for you based on what you actually want to change in the next 90 days, and gives you the order in which they make each other easier.',
        ],
      },
    ],
    disclaimer:
      'General information for healthy adults on fitness, grooming, study skills, social skills, freelancing and careers. Not medical, psychological, financial, tax, legal or investment advice. No earnings, rank, score, job or salary outcome is promised or guaranteed; any figure shown is a typical range, not an expected result. Consult a doctor, dermatologist, chartered accountant or registered adviser as appropriate. Helplines referenced inside: Tele-MANAS 14416, cybercrime helpline 1930.',
    helplines: [
      {
        name: 'Tele-MANAS',
        number: '14416',
        context: 'Referenced inside the Study OS component of this bundle.',
      },
      {
        name: 'National Cyber Crime Reporting Portal',
        number: '1930',
        context: 'Referenced inside the Career OS component of this bundle.',
      },
    ],
    components: [
      { slug: 'glow-up-os', label: 'Glow-Up OS', inCatalog: true },
      { slug: 'aura-os', label: 'Aura OS', inCatalog: true },
      { slug: 'social-os', label: 'Social OS', inCatalog: true },
      { slug: 'money-os', label: 'Money OS', inCatalog: true },
      { slug: 'study-os', label: 'Study OS', inCatalog: true },
      { slug: 'career-os', label: 'Career OS', inCatalog: true },
    ],
    coverImage: { filename: '1-cover-thumbnail.png', role: 'cover', alt: 'Everything Bundle cover.' },
    availableToday: true,
    faqs: [],
  },
  {
    slug: 'the-complete-man',
    title: 'The Complete Man — Glow-Up OS + Social OS',
    price: 1499,
    separatePrice: 1998,
    tagline:
      'Fix the body and the face. Then fix the part where someone talks to you and your mind goes blank. Two complete systems, 59 designed pages, 10 printable trackers. One payment, lifetime access.',
    longDescription: [
      {
        heading: 'Most Men Fix the First Thing and Discover the Second',
        paragraphs: [
          'You start with the body. You eat properly, you train three times a week, you fix your skin and your sleep and your phone habit. Three months later you look different and people notice.',
          'Then someone talks to you and your mind goes completely blank.',
          'That is not a personality defect and it is not something you were born without. It is an unpractised skill, and it is the exact wall the second half of this bundle was written for.',
        ],
      },
      {
        heading: 'Glow-Up OS — 39 pages + 5 trackers',
        paragraphs: [
          'The complete glow-up system for Indian men. The Desi Protein Index ranking every source by what 20g actually costs. The ₹100 bulk menu. A gym plan and a full no-equipment home plan with real progression rules. Skincare for ₹700-1,500 from any Indian pharmacy. Haircuts by face shape. The ₹3,000 capsule wardrobe. The Detox Ladder and a 90-day master calendar.',
        ],
      },
      {
        heading: 'Social OS — 20 pages + 5 trackers',
        paragraphs: [
          'The three moves every conversation runs on. Openers for the canteen, the gym, the office and a wedding. Why conversations die after two exchanges and the three fixes. The five voice fixes. How to join a group without being the person who interrupted. Why friendship got hard after school and the three conditions that rebuild it. The invite — the thing almost nobody does. Dating honestly, with clear lines. The rejection protocol.',
        ],
      },
      {
        heading: 'No Pickup Artistry',
        paragraphs: [
          'Social OS argues against it directly. No routines, no negging, no techniques to make someone like you against their judgement. It carries explicit lines that never get crossed, including that no means no the first time. If a page in it reads like a trick, you have misread it.',
        ],
      },
      {
        heading: 'Run Them Together',
        paragraphs: [
          'Do not finish one and then start the other. Glow-Up OS takes 90 days to show; Social OS takes two weeks of reps. Start both and by the time you look different you can also hold a conversation.',
        ],
      },
    ],
    disclaimer:
      'General fitness, grooming and social-skills information for adults. Not medical or psychological advice. For acne, hair loss or any skin concern, see a dermatologist. If loneliness or social anxiety is affecting your sleep, work or daily life, speak to a doctor or qualified counsellor. Results depend on consistency and vary between people; no specific outcome is guaranteed.',
    helplines: [],
    components: [
      { slug: 'glow-up-os', label: 'Glow-Up OS', inCatalog: true },
      { slug: 'social-os', label: 'Social OS', inCatalog: true },
    ],
    coverImage: { filename: '1-cover-thumbnail.png', role: 'cover', alt: 'The Complete Man cover.' },
    availableToday: true,
    faqs: [
      {
        question: 'I already own Glow-Up OS. Can I buy just Social OS?',
        answer: 'Yes, it is listed separately at ₹999. Message me and I will sort out the difference.',
      },
      {
        question: 'Is Social OS pickup artistry?',
        answer: 'The opposite, explicitly. See Module 03 page 04.',
      },
      {
        question: 'Which do I start with?',
        answer: 'Both, together. The read-me inside explains the order.',
      },
    ],
  },
  {
    slug: 'the-complete-woman',
    title: 'The Complete Woman — Aura OS + Skin OS',
    price: 1499,
    separatePrice: 1998,
    tagline:
      'The full glow-up system, plus the deep skincare book a twelve-page chapter could never cover. Two complete products, 67 designed pages, 9 printable trackers. One payment, lifetime access.',
    longDescription: [
      {
        heading: 'Your Routine Is Probably Fine. The Order Is What Is Breaking Your Face.',
        paragraphs: [
          'Most people who care about their skin are not doing too little. They are doing three actives at once, started in the same week, on a barrier that was already damaged from washing four times a day — and then concluding their skin is "just difficult".',
          'It usually is not. It is a sequencing problem, and sequencing is teachable.',
        ],
      },
      {
        heading: 'Aura OS — 49 pages + 5 trackers',
        paragraphs: [
          'The complete system. Food math in rupees and a protein table built around an Indian kitchen. Training that works in a shared flat with no equipment. Grooming, hair and wardrobe on a real budget. The mind module: the dopamine problem, the comparison problem, and a 90-day plan that survives past week three.',
        ],
      },
      {
        heading: 'Skin OS — 18 pages + 4 trackers (not yet part of the Dropdesk catalog)',
        paragraphs: [
          'The depth. How the barrier actually works and why over-washing produced the oil you have been fighting. The three steps, adjusted for oily, dry, combination and sensitive skin in Indian humidity. Every active explained — niacinamide, vitamin C, salicylic and glycolic acid, retinoids, benzoyl peroxide — with what to start at, and the pairs that must never share a night. The patch-test protocol. The two-week barrier reset for skin you have already over-treated.',
          'Then the hard problems, honestly: tanning, post-inflammatory marks and melasma are three different things with three different outcomes, and buying the wrong product for years is what happens when nobody separates them. Body skin too — back acne, keratosis pilaris, ingrowns, dark underarms.',
        ],
      },
      {
        heading: 'What It Will Not Do',
        paragraphs: [
          'It will not sell you a brand. No product is named anywhere — only categories, so the book still works when the shelf changes. It will not promise to change your skin colour, and it tells you plainly that unregulated whitening creams and injections have been found to contain steroids and mercury.',
          'And it says where a PDF stops. Cystic acne, scarring and melasma need a dermatologist, and going early is the cheap version — two years of wrong serums costs more than one consultation, and the scarring you accumulate in those two years is the expensive part.',
        ],
      },
      {
        heading: 'Run Them Together',
        paragraphs: [
          'Start Aura OS today. Open Skin OS when Module 02 makes you want more detail — which for most people is week one.',
        ],
      },
    ],
    disclaimer:
      'General grooming, skincare and fitness information for adults. Not medical advice, not a diagnosis and not a treatment plan. No brand or specific product is recommended anywhere. See a qualified dermatologist for acne, pigmentation, melasma, scarring or any skin condition, and never use prescription-strength or unregulated products without medical supervision. Results depend on consistency and vary between people; no specific outcome is guaranteed.',
    helplines: [],
    components: [
      { slug: 'aura-os', label: 'Aura OS', inCatalog: true },
      {
        slug: null,
        label: 'Skin OS',
        inCatalog: false,
        note: 'Listed in the Dashrize-Products pipeline (Tier 2), not yet a finished Dropdesk product — no listing copy, PDFs or gallery images built for this catalog.',
      },
    ],
    coverImage: { filename: '1-cover-thumbnail.png', role: 'cover', alt: 'The Complete Woman cover.' },
    availableToday: false,
    faqs: [
      {
        question: 'I already own Aura OS. Can I buy just Skin OS?',
        answer: 'Yes, it is listed separately at ₹999. Message me and I will sort out the difference.',
      },
      {
        question: 'Is this for men too?',
        answer:
          'Skin OS is written for any skin and says so — same barrier, same actives, with a note on shaving. Aura OS is written for women; the men\'s equivalent is Glow-Up OS.',
      },
      {
        question: 'Does it name products I should buy?',
        answer:
          'No, deliberately. Categories only, so nothing here is an affiliate pitch and none of it expires when a brand reformulates.',
      },
      {
        question: 'I have melasma. Will this fix it?',
        answer:
          'No, and it says so directly. It explains what melasma is, why it recurs, and why it is a dermatologist\'s problem — and what you can do meanwhile that does not make it worse.',
      },
    ],
  },
  {
    slug: 'the-discipline-bundle',
    title: 'The Discipline Bundle — Sleep OS + 30 Days of Focus + Study OS',
    price: 1499,
    separatePrice: 2297,
    tagline:
      'Sleep, focus and study — in the order they actually depend on each other. Three systems, 48 designed pages, 9 printable trackers. One payment, lifetime access.',
    longDescription: [
      {
        heading: 'You Are Trying to Study More While Sleeping Five Hours. That Is the Actual Problem.',
        paragraphs: [
          'Almost everyone attacks this backwards. They decide the problem is discipline, resolve to study four more hours, last nine days, fail, and conclude something is wrong with them — the entire time running on five hours of sleep and a phone that goes down at 1am.',
          'Nothing downstream works while that is true. These three books are sold together because they are causally linked, and the order is the whole product.',
        ],
      },
      {
        heading: '1 — Sleep OS (19 pages + 4 trackers, not yet part of the Dropdesk catalog)',
        paragraphs: [
          'Start here, and give it two weeks alone. Why you are exhausted and still awake, and the difference between tired and sleepy. The four inputs: light, caffeine timing, the phone, and an unfinished day. Then the protocol — one fixed wake time seven days a week, because bedtime is the output and the wake time is the input. Ten minutes of morning light. The 2pm caffeine cut-off and how much chai is really in your day. The wind-down hour and the five-minute shutdown that stops the 1am spiral.',
          'Room setup written for actual Indian conditions: heat, street noise, a shared room, no blackout curtains. Every fix priced at zero to a few hundred rupees. Plus the hard cases — night shifts, exam season, naps done properly, and what to do at 3am when you are awake and angry about it.',
        ],
      },
      {
        heading: '2 — 30 Days of Focus (4 pages, not yet part of the Dropdesk catalog)',
        paragraphs: [
          'Once sleep is steady, attention becomes trainable. The 30-day chain for rebuilding it.',
        ],
      },
      {
        heading: '3 — Study OS (25 pages + 5 trackers)',
        paragraphs: [
          'Now the studying sticks. Recall over rereading. Spaced repetition without an app. The focus module and the exam-craft module — reading the paper first, budgeting by marks, when to abandon a question.',
        ],
      },
      {
        heading: 'The Order Is Not a Suggestion',
        paragraphs: [
          'Do not open all three on day one. Sleep OS for two weeks, alone, until the wake time holds. Then focus. Then studying. Reversing that is what you have already tried.',
        ],
      },
      {
        heading: 'No Medication, No Supplements',
        paragraphs: [
          'Sleep OS recommends none — not melatonin, not anything. It is habits and light and timing, and it tells you plainly which symptoms mean the problem is not a habits problem at all: heavy snoring, stopping breathing in your sleep, falling asleep in the day without meaning to, or feeling destroyed after a genuine eight hours. Those are a doctor\'s, not a book\'s.',
        ],
      },
    ],
    disclaimer:
      'General sleep-hygiene and study-technique information for healthy adults. Not medical advice and not a treatment for insomnia, sleep apnoea or any other condition. No medication or supplement is recommended anywhere. If you snore heavily, have been seen to stop breathing in your sleep, fall asleep during the day without meaning to, sleep a full night and still feel destroyed, or cannot sleep for weeks despite all of this, see a doctor — these are common and treatable, and none of them are fixed by better habits. Not affiliated with or endorsed by any board, university or examination body; no rank, score or result is claimed or implied.',
    helplines: [],
    components: [
      {
        slug: null,
        label: 'Sleep OS',
        inCatalog: false,
        note: 'Listed in the Dashrize-Products pipeline (Tier 2), not yet a finished Dropdesk product — no listing copy, PDFs or gallery images built for this catalog.',
      },
      {
        slug: null,
        label: '30 Days of Focus',
        inCatalog: false,
        note: 'A ₹299 tripwire product in the Dashrize-Products pipeline (Tier 1), not part of the six-product Dropdesk catalog.',
      },
      { slug: 'study-os', label: 'Study OS', inCatalog: true },
    ],
    coverImage: { filename: '1-cover-thumbnail.png', role: 'cover', alt: 'The Discipline Bundle cover.' },
    availableToday: false,
    faqs: [
      {
        question: 'I work night shifts. Is this useless to me?',
        answer:
          'No — Module 03 is written for exactly that, and it is honest that night-shift sleep is worse than day sleep and no protocol makes it equal. What it gives you is damage control that genuinely works: light on shift, sunglasses home, one anchored sleep block across rotations.',
      },
      {
        question: 'Does it tell me to take melatonin?',
        answer:
          'No. Nothing in this bundle recommends any medication or supplement, at any dose. That is a doctor\'s call.',
      },
      {
        question: 'I share a room / there is no AC / the street is loud.',
        answer:
          'That is who the room chapter is written for. Sleep mask, earplugs, a bedsheet clipped over the curtain rod, and a fan as steady noise — nothing here assumes a private cold bedroom.',
      },
      {
        question: 'I only want the sleep one.',
        answer: 'Sleep OS is listed separately at ₹999.',
      },
      {
        question: 'I already own Study OS.',
        answer: 'Message me and I will sort out the difference.',
      },
    ],
  },
  {
    slug: 'the-earner-bundle',
    title: 'The Earner Bundle — Money OS + Career OS + Money Habits OS',
    price: 1999,
    separatePrice: 2997,
    tagline:
      'Earn it, get hired for it, then do not lose it. Three complete systems, 91 designed pages, 14 printable trackers. No income claims anywhere. One payment, lifetime access.',
    longDescription: [
      {
        heading: 'Everyone Sells You How to Earn. Nobody Tells You What Happens to Your First Salary.',
        paragraphs: [
          'The money content aimed at people in their twenties covers exactly one third of the problem. It tells you how to earn, endlessly, in screenshots. It says nothing about getting hired, and nothing at all about the part that decides where you are at thirty — what happens in the four weeks after the money lands.',
        ],
      },
      {
        heading: 'Money OS — 46 pages + 5 trackers',
        paragraphs: [
          'A skill worth paying for, and how to find the first person who will. Where clients actually come from. Pricing without underquoting yourself into a corner. Scripts for the awkward conversations — the quote, the follow-up, the client who has not paid. Plus the Dashrize clipping section, and the systems that keep freelance work from eating your week.',
        ],
      },
      {
        heading: 'Career OS — 26 pages + 5 trackers',
        paragraphs: [
          'The resume a fresher can actually write, the applications that get answered, the interview questions that always appear, and the offer conversation nobody prepares you for.',
        ],
      },
      {
        heading: 'Money Habits OS — 19 pages + 4 trackers (not yet part of the Dropdesk catalog)',
        paragraphs: [
          'The missing third. Tracking one honest month, because almost everybody is wrong about their own spending by thousands. The five leaks engineered for a 24-year-old with a new salary: gadget EMIs, buy-now-pay-later, the credit card minimum due, delivery, forgotten subscriptions. Three accounts and one standing instruction dated the day after payday. The emergency fund and why it comes before any investing. Insurance in plain language — including what that endowment policy a relative sold you actually is. Debt, compounding in both directions, and tax vocabulary for salaried and freelance income.',
        ],
      },
      {
        heading: 'What Is Deliberately Missing',
        paragraphs: [
          'No fund, stock, scheme, app, bank or insurance product is named anywhere in these 91 pages. No returns figure. No tax rates or slabs either — those change with every Budget, and printing them would date the book and mislead you a year from now.',
          'That is not laziness. Anybody recommending a specific investment to you without knowing your income, your dependants and your obligations is selling you something, and most of the money content you see is exactly that. For what to invest in, see a SEBI-registered investment adviser. For your return, see a chartered accountant. Money Habits OS tells you what to ask them, which is the part nobody hands you.',
        ],
      },
      {
        heading: 'And No Earnings Claims',
        paragraphs: [
          'Not on the cover, not in the books, not in the marketing. No screenshots, no "I made X", no income promise of any kind — including from the clipping section. What you get is method. What you make with it is not something any book can honestly predict.',
        ],
      },
    ],
    disclaimer:
      'General financial-literacy, freelancing and career-skills information for a general audience in India. NOT investment, tax, legal, accounting or insurance advice, and not personalised to your circumstances. No product, fund, stock, scheme, insurer, app or institution is recommended anywhere. No income, earnings, client, placement, salary or investment return is claimed, promised or implied. Tax rules, rates and deadlines change annually — verify everything against the official income-tax portal or a chartered accountant. Consult a SEBI-registered investment adviser before investing.',
    helplines: [],
    components: [
      { slug: 'money-os', label: 'Money OS', inCatalog: true },
      { slug: 'career-os', label: 'Career OS', inCatalog: true },
      {
        slug: null,
        label: 'Money Habits OS',
        inCatalog: false,
        note: 'Listed in the Dashrize-Products pipeline (Tier 2), not yet a finished Dropdesk product — no listing copy, PDFs or gallery images built for this catalog.',
      },
    ],
    coverImage: { filename: '1-cover-thumbnail.png', role: 'cover', alt: 'The Earner Bundle cover.' },
    availableToday: false,
    faqs: [
      {
        question: 'Is this investment advice?',
        answer:
          'No, explicitly. It is habits and systems only — budgeting, an emergency fund, debt, and what documents to keep. It names no product and quotes no return. For investing, see a SEBI-registered adviser.',
      },
      {
        question: 'Will this tell me how much tax I owe?',
        answer:
          'No. Rates, slabs and deadlines change every Budget, so nothing here quotes them. What it does is explain the vocabulary — TDS, Form 16, 26AS, AIS, advance tax — so that when you sit with a CA you understand the conversation instead of nodding.',
      },
      {
        question: 'How much will I earn from this?',
        answer:
          'Unknown, and anyone who answers that number is lying to you. There are no earnings claims anywhere in this bundle, on purpose.',
      },
      {
        question: 'I am salaried, not freelance. Is Money OS useless to me?',
        answer:
          'Most people in their twenties are both within a year. Career OS and Money Habits OS apply directly; Money OS applies the moment you take on anything on the side.',
      },
      {
        question: 'I already own Money OS or Career OS.',
        answer: 'Each is listed separately at ₹999. Message me and I will sort out the difference.',
      },
    ],
  },
  {
    slug: 'the-student-bundle',
    title: 'The Student Bundle — Study OS + Career OS + English Confidence OS',
    price: 1999,
    separatePrice: 2997,
    tagline:
      'Everything from the exam hall to the offer letter, including the English that decides half of it. Three complete systems, 76 designed pages, 14 printable trackers. One payment, lifetime access.',
    longDescription: [
      {
        heading: 'Your Marks Get You the Interview. Something Else Loses It.',
        paragraphs: [
          'Final year is three problems wearing one uniform: study so it actually stays in, get through the application process, and speak well enough to survive the twenty minutes that decide it. Most students prepare hard for the first, panic about the second, and never address the third until the week of the interview — which is exactly when it is too late.',
        ],
      },
      {
        heading: 'Study OS — 25 pages + 5 trackers',
        paragraphs: [
          'How to study so it stays in. Recall over rereading, spaced repetition without an app, and why six hours of highlighting produces almost nothing. The focus module: the phone, the 2am scroll, and how attention is actually rebuilt. Exam craft — reading the paper first, budgeting time by marks, when to abandon a question.',
        ],
      },
      {
        heading: 'Career OS — 26 pages + 5 trackers',
        paragraphs: [
          'The resume that gets read: what a fresher actually puts on it, what to cut, and how to write a project so it means something to a stranger. Where applications really come from. The interview: the questions that always appear, how to answer without a script, and the offer conversation nobody prepares for.',
        ],
      },
      {
        heading: 'English Confidence OS — 25 pages + 4 trackers (not yet part of the Dropdesk catalog)',
        paragraphs: [
          'The blocker. Not grammar — you can read English fine. The freeze: what happens in your head between understanding the question and answering it, and why translating word for word is what breaks. A sentence bank of patterns to use out loud, a 20-rep practice ladder that starts with a shopkeeper, and the scripted sixty seconds that gets you through "tell me about yourself".',
        ],
      },
      {
        heading: 'Start the English One Today',
        paragraphs: [
          'This is the one instruction in the bundle that matters more than the rest. Study OS and Career OS work on a timescale of weeks. English Confidence OS needs months, because it needs reps — and the students who leave it until placement season are the ones it was written to prevent. Run it alongside the other two from day one.',
        ],
      },
      {
        heading: 'What This Is Not',
        paragraphs: [
          'Not a course, not a certification, and not a placement guarantee. No rank, score, offer or salary is promised anywhere in it — and nobody honest can promise those. What it gives you is method and practice structure. The reps are yours.',
          'Every variety of English, including Indian English, is a legitimate form of the language. This book is about being able to speak under pressure, not about sounding like someone else.',
        ],
      },
    ],
    disclaimer:
      'General study-technique, language-practice and career-skills information for a general audience. Not a course, a certification, coaching, or career or legal advice, and not affiliated with or endorsed by any university, board, examination body or employer. No rank, score, result, placement, offer, salary or level of fluency is claimed, promised or implied. Outcomes depend on your own work and on factors outside anyone\'s control.',
    helplines: [],
    components: [
      { slug: 'study-os', label: 'Study OS', inCatalog: true },
      { slug: 'career-os', label: 'Career OS', inCatalog: true },
      {
        slug: null,
        label: 'English Confidence OS',
        inCatalog: false,
        note: 'Listed in the Dashrize-Products pipeline (Tier 2), not yet a finished Dropdesk product — no listing copy, PDFs or gallery images built for this catalog.',
      },
    ],
    coverImage: { filename: '1-cover-thumbnail.png', role: 'cover', alt: 'The Student Bundle cover.' },
    availableToday: false,
    faqs: [
      {
        question: 'My English grammar is weak. Is this a grammar course?',
        answer:
          'No. It is about speaking under pressure — the freeze, not the rules. Most people who freeze already read and write English fine, which is exactly the frustrating part.',
      },
      {
        question: 'I am not in my final year yet.',
        answer:
          'Better. Start English Confidence OS now, because it is the piece that takes months. The other two will still be here.',
      },
      {
        question: 'Does this guarantee placement?',
        answer:
          'No, and anybody who tells you otherwise is selling something. It is method and practice structure. What you do with it is the actual variable.',
      },
      {
        question: 'I already own Study OS.',
        answer:
          'The other two are listed separately at ₹999 each. Message me and I will sort out the difference.',
      },
    ],
  },
];
