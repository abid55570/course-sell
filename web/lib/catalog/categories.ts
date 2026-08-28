import type { Category } from './types';

/**
 * The category taxonomy for the six launch products, derived from what each
 * product actually is and who it's for — not an imposed scheme.
 *
 * - Glow-Up OS, Aura OS and Social OS all work the same territory: body,
 *   looks, mind and — once those are handled — how you come across to other
 *   people. Glow-Up OS and Aura OS are explicitly "Body · Looks · Mind"
 *   systems for men and women respectively, and Social OS is the README's
 *   own next step after them ("he fixed the body and face, then someone
 *   talked to him and he froze"). That's one audience across three products:
 *   young Indians working on themselves.
 * - Money OS and Career OS both sit on the earn-a-living side: freelancing
 *   income and getting hired. The README pairs them directly ("a final-year
 *   student deciding between 'get placed' and 'start freelancing'").
 * - Study OS stands alone today — an academic-skills audience distinct from
 *   both of the above (its README pairing is with Career OS as "the student
 *   now graduating", i.e. it feeds into Money & Career rather than sitting
 *   inside it).
 *
 * Each category's accent is the accent already carried by the first product
 * catalogued into it (catalog order), so no new colour is invented — it's
 * read off real product data.
 */
export const SELF_IMPROVEMENT: Category = {
  slug: 'self-improvement',
  label: 'Self-Improvement',
  accent: { name: 'green', hex: '#2f9e44' }, // Glow-Up OS's accent
};

export const MONEY_AND_CAREER: Category = {
  slug: 'money-and-career',
  label: 'Money & Career',
  accent: { name: 'blue', hex: '#1c7ed6' }, // Money OS's accent
};

export const STUDY_SKILLS: Category = {
  slug: 'study-skills',
  label: 'Study Skills',
  accent: { name: 'teal', hex: '#0ca678' }, // Study OS's accent
};

/**
 * Three more categories, added for the CHARACTER-GUIDES,
 * TALKING-TO-YOUR-PARENTS and THE-TEN-SERIES imports (75 individual guides
 * @ ₹499 + their 3 full-set products). These are deliberately NOT folded
 * into the three categories above — see the catalog-import build report for
 * the full reasoning, summarised here:
 *
 * Each is its own product line with its own hook, its own compliance
 * profile and its own source folder, not a variant of an existing System:
 *   - Character Guides is unofficial commentary tied to fictional
 *     characters (a "no artwork/dialogue/story content reproduced"
 *     disclaimer no other category needs).
 *   - Talking to Your Parents is scripts for specific hard conversations,
 *     carrying four crisis helpline numbers no other category carries.
 *   - The Ten Series is "the honest version of a viral hook" essay format —
 *     close in spirit to Self-Improvement, but its subjects range from
 *     fitness to money to social skills, which is exactly why it doesn't
 *     fit inside a body/looks/mind system. Forcing it into
 *     Self-Improvement would also outnumber that category's original three
 *     products 23-to-3 and bury them.
 *
 * Each accent is picked for hue separation both from the six accents
 * already in use (green/gold/blue/violet/teal/orange, one per launch
 * product) and from the vermilion brand primary (--color-primary,
 * #C42B22) — by the same "several degrees of hue apart" bar this codebase
 * already applies to --destructive and --color-urgent in app/globals.css.
 */
export const CHARACTER_GUIDES: Category = {
  slug: 'character-guides',
  label: 'Character Guides',
  accent: { name: 'pink', hex: '#d6336c' },
};

export const TALKING_TO_YOUR_PARENTS: Category = {
  slug: 'talking-to-your-parents',
  label: 'Talking to Your Parents',
  accent: { name: 'lime', hex: '#74b816' },
};

export const THE_TEN_SERIES: Category = {
  slug: 'the-ten-series',
  label: 'The Ten Series',
  accent: { name: 'indigo', hex: '#4263eb' },
};

export const THE_SCAM_FILES: Category = {
  slug: 'the-scam-files',
  label: 'The Scam Files',
  accent: { name: 'cyan', hex: '#0c8599' },
};

export const AUTOMATION_AND_AI: Category = {
  slug: 'automation-and-ai',
  label: 'Automation & AI',
  accent: { name: 'orange', hex: '#e67700' },
};

export const VIDEO_COURSES: Category = {
  slug: 'video-courses',
  label: 'Video Courses',
  accent: { name: 'gold', hex: '#c49a00' },
};

export const DIGITAL_LIBRARY: Category = {
  slug: 'digital-library',
  label: 'Digital Library',
  accent: { name: 'violet', hex: '#6741d9' },
};
