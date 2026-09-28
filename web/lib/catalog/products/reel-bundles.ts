import type { Product } from '../types';
import { REEL_BUNDLES } from '../categories';

/**
 * Reel Bundles — raw vertical video clips (MP4) for Reels/Shorts/TikTok
 * editors, one themed folder per product, delivered as a Google Drive link
 * after purchase (drive_link / send_drive_in_email, set per-product in the
 * admin panel — see api/routes/admin-catalog.js; not part of this file).
 *
 * Source: the "Dropdesk Bundle" Drive folder the owner shared — 47 themed
 * folders of raw clips (owner: dizivaults@gmail.com), confirmed by listing
 * each folder directly rather than going through its shortcut. No approved
 * listing-copy-paste.md exists for these yet (unlike the rest of the
 * catalog — see types.ts's header), so the copy below is written fresh, not
 * pulled from a source file, and deliberately says only what the folder
 * contents actually showed: raw MP4 clips (filenames like
 * "Copy of Copy of Copy of IG-MZ (251).mp4"), not finished, captioned,
 * ready-to-post reels. No file count is claimed anywhere below, in keeping
 * with this catalog's "never estimated" rule for facts that aren't
 * actually verified (types.ts, fileSizeLabel).
 *
 * Priced ₹29–99 per the owner's brief ("priced around 29-99 according to
 * their demands and sellability") — a five-step ladder (29/49/69/89/99)
 * assigned per theme by estimated demand: mass-appeal evergreen niches
 * (motivation, gym, gaming, cricket, football, anime) sit at the top;
 * narrow aesthetic niches (abandoned/urbex, mad scientist, matrix) sit at
 * the floor. This is a judgement call, not a measured one — revisit any
 * single price freely from the admin panel.
 *
 * IMPORTANT — before publishing any of these: several themes package clips
 * built on copyrighted characters or footage the store does not own the
 * rights to (Roblox, anime, pro sports footage). As of 2026-09-26, the
 * products that named a specific copyrighted character or real person
 * directly in their title/tagline/tags/slug (Tom & Jerry, Mr Bean, Shinchan,
 * GTA V, MrBeast, Andrew Tate, Ronaldo, Messi & Ronaldo, Matrix) were
 * renamed to generic theme names — see the Drive folder renames of the same
 * date, which this file's slugs and reelBundleDriveFolderIds keys now
 * match. That fixes the naming/branding exposure, but NOT the underlying
 * footage risk: if the actual clips inside those folders are still, say,
 * real Tom & Jerry or GTA V footage, the takedown / payment-processor risk
 * from the footage itself is unchanged and unresolved by a rename. That
 * remains a real risk, not a coding concern this file can fix — it's
 * flagged here so it stays visible next to the data, and is the owner's
 * call per product.
 *
 * No cover art ships for these yet, so every product below has
 * `gallery: []` and renders the CoverFallback (a text/CSS cover built from
 * the title + category + accent) instead. They previously all declared
 * `1-cover-thumbnail.png`, but no such file was ever added under
 * public/products/<slug>/ for any of them, so all 47 pages were emitting an
 * <img> that 404'd. If real covers are made later, drop them at
 * public/products/<slug>/1-cover-thumbnail.png and restore the gallery entry
 * per product — the image path is derived from the slug (see
 * components/product/ProductCard.tsx).
 *
 * CAUTION — these go live the moment they are migrated. An earlier version
 * of this comment claimed every product here ships with
 * `is_published = false`; that was wrong. catalog_products.is_published is
 * `NOT NULL DEFAULT TRUE` (api/migrations/011_catalog_products.sql), and
 * api/scripts/migrate-catalog.js does not name the column in its INSERT, so
 * a newly-migrated product is PUBLISHED immediately. migrate-catalog.js
 * only declines to *overwrite* is_published on rows that already exist.
 * If a product is not ready to sell, unpublish it explicitly after
 * migrating — it will not hold itself back.
 *
 * Still the owner's call before selling any of these: (1) confirm each
 * Drive folder is actually shared "Anyone with the link" (a shortcut's own
 * sharing does not grant access — the target folder's does, and that is
 * not something readable or settable through the Drive tools this file was
 * built with), and (2) review price/copy per product.
 */

const REEL_BUNDLE_FORMAT_FAQ = {
  question: 'What format are the files?',
  answer:
    'Vertical MP4 clips, sized for Reels, Shorts and TikTok. They are raw footage, not finished posts — bring your own captions, music and edit.',
};

const REEL_BUNDLE_LICENSE_FAQ = {
  question: 'Can I use these in my own content?',
  answer:
    'Yes — cut, caption, remix and post them as your own edits. This is a resource for editors and page owners, not a finished, ready-to-publish content calendar.',
};

const REEL_BUNDLE_REFUND_FAQ = {
  question: 'Refunds?',
  answer:
    "Digital files can't be returned once the Drive link has been opened, so this is a final sale. If the link doesn't open, message support and it will be fixed immediately.",
};

export const motivationReelBundle: Product = {
  slug: 'motivation-reel-bundle',
  title: 'Motivation Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: motivational speeches, quote overlays and cinematic hustle clips. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 99,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  // The reel-bundles category's flagship on the homepage: broad-appeal
  // theme, no IP-derived footage baked into the concept (unlike the sports
  // or cartoon bundles), and one of the priciest at ₹99 so featuring it
  // signals the top of the range for this category.
  featured: true,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — motivational speeches, quote overlays and cinematic hustle clips. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: motivational speeches, quote overlays and cinematic hustle clips',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['motivation reels', 'hustle content', 'motivational clips'],
  gallery: [],
  deliveryFiles: ['Motivation-Reel-Bundle.zip'],
};

export const animeReelBundle: Product = {
  slug: 'anime-reel-bundle',
  title: 'Anime Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: anime fight scenes, edits and AMV-style clips across popular series. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 99,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — anime fight scenes, edits and AMV-style clips across popular series. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: anime fight scenes, edits and AMV-style clips across popular series',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['anime edit', 'amv clips', 'anime reels'],
  gallery: [],
  deliveryFiles: ['Anime-Reel-Bundle.zip'],
};

export const gymFitnessReelBundle: Product = {
  slug: 'gym-fitness-reel-bundle',
  title: 'Gym & Fitness Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: gym lifts, transformation shots and workout footage. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 99,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — gym lifts, transformation shots and workout footage. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: gym lifts, transformation shots and workout footage',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['gym reels', 'fitness content', 'workout clips'],
  gallery: [],
  deliveryFiles: ['Gym-and-Fitness-Reel-Bundle.zip'],
};

// NOTE: the "Gaming Reels Bundle" Drive folder is currently EMPTY (zero video
// files as of the 2026-09-26 rename pass), so this product was explicitly
// unpublished in the DB on that date. Re-running migrate-catalog.js will NOT
// re-publish it (that script leaves is_published alone on existing rows), but
// do not publish it by hand until the folder actually has content.
export const gamingReelsBundle: Product = {
  slug: 'gaming-reels-bundle',
  title: 'Gaming Reels Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: gameplay highlights and funny gaming moments across popular titles. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 99,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — gameplay highlights and funny gaming moments across popular titles. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: gameplay highlights and funny gaming moments across popular titles',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['gaming reels', 'gameplay clips'],
  gallery: [],
  deliveryFiles: ['Gaming-Reels-Bundle.zip'],
};

export const mrBeastReelBundle: Product = {
  slug: 'viral-challenge-reel-bundle',
  title: 'Viral Challenge Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: big-budget challenge, stunt and reaction clips. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 99,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — big-budget challenge, stunt and reaction clips. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: big-budget challenge, stunt and reaction clips',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['challenge clips', 'youtube reels'],
  gallery: [],
  deliveryFiles: ['Viral-Challenge-Reel-Bundle.zip'],
};

export const cricketReelsBundle: Product = {
  slug: 'cricket-reels-bundle',
  title: 'Cricket Reels Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: cricket sixes, wickets and match-highlight footage. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 99,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — cricket sixes, wickets and match-highlight footage. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: cricket sixes, wickets and match-highlight footage',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['cricket reels', 'ipl clips'],
  gallery: [],
  deliveryFiles: ['Cricket-Reels-Bundle.zip'],
};

export const footballReelBundle: Product = {
  slug: 'football-reel-bundle',
  title: 'Football Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: football goals, skills and match-highlight footage. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 99,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — football goals, skills and match-highlight footage. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: football goals, skills and match-highlight footage',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['football reels', 'soccer clips'],
  gallery: [],
  deliveryFiles: ['Football-Reel-Bundle.zip'],
};

export const andrewTateReelBundle: Product = {
  slug: 'hustle-mindset-reel-bundle',
  title: 'Hustle Mindset Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: hustle-speech and podcast clips for commentary and edit pages. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 99,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — hustle-speech and podcast clips for commentary and edit pages. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: hustle-speech and podcast clips for commentary and edit pages',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['hustle mindset clips', 'motivational reels'],
  gallery: [],
  deliveryFiles: ['Hustle-Mindset-Reel-Bundle.zip'],
};

export const islamicReelBundle: Product = {
  slug: 'islamic-reel-bundle',
  title: 'Islamic Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: Islamic reminders, nasheeds and Quran-recitation clips. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 89,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — Islamic reminders, nasheeds and Quran-recitation clips. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: Islamic reminders, nasheeds and Quran-recitation clips',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['islamic reels', 'nasheed clips', 'dawah content'],
  gallery: [],
  deliveryFiles: ['Islamic-Reel-Bundle.zip'],
};

export const gtaVReelBundle: Product = {
  slug: 'open-world-game-reel-bundle',
  title: 'Open World Game Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: 100+ open-world stunt, chaos and gameplay clips. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 89,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — 100+ open-world stunt, chaos and gameplay clips. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: 100+ open-world stunt, chaos and gameplay clips',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['open world game reels', 'gaming clips'],
  gallery: [],
  deliveryFiles: ['Open-World-Game-Reel-Bundle.zip'],
};

export const ronaldoReelBundle: Product = {
  slug: 'football-stars-reel-bundle',
  title: 'Football Stars Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: top footballer goals, skills and highlight clips. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 89,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — top footballer goals, skills and highlight clips. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: top footballer goals, skills and highlight clips',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['football star reels', 'football clips'],
  gallery: [],
  deliveryFiles: ['Football-Stars-Reel-Bundle.zip'],
};

export const messiRonaldoReelBundle: Product = {
  slug: 'football-legends-reel-bundle',
  title: 'Football Legends Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: legendary rivalry highlight and comparison clips. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 89,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — legendary rivalry highlight and comparison clips. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: legendary rivalry highlight and comparison clips',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['football legends reels', 'football clips'],
  gallery: [],
  deliveryFiles: ['Football-Legends-Reel-Bundle.zip'],
};

export const factsReelsBundle: Product = {
  slug: 'facts-reels-bundle',
  title: 'Facts Reels Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: bite-sized fact and trivia footage for faceless fact pages. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 89,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — bite-sized fact and trivia footage for faceless fact pages. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: bite-sized fact and trivia footage for faceless fact pages',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['facts reels', 'trivia content'],
  gallery: [],
  deliveryFiles: ['Facts-Reels-Bundle.zip'],
};

export const satisfyingReelsBundle: Product = {
  slug: 'satisfying-reels-bundle',
  title: 'Satisfying Reels Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: oddly-satisfying visual footage — cutting, pouring, pressing, organising. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 89,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — oddly-satisfying visual footage — cutting, pouring, pressing, organising. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: oddly-satisfying visual footage — cutting, pouring, pressing, organising',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['satisfying reels', 'oddly satisfying'],
  gallery: [],
  deliveryFiles: ['Satisfying-Reels-Bundle.zip'],
};

export const tomAndJerryReelBundle: Product = {
  slug: 'cat-and-mouse-cartoon-bundle',
  title: 'Cat & Mouse Cartoon Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: classic cat-and-mouse chase and slapstick clips. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 89,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — classic cat-and-mouse chase and slapstick clips. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: classic cat-and-mouse chase and slapstick clips',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['cat and mouse cartoon reels', 'cartoon clips'],
  gallery: [],
  deliveryFiles: ['Cat-and-Mouse-Cartoon-Bundle.zip'],
};

export const basketballReelBundle: Product = {
  slug: 'basketball-reel-bundle',
  title: 'Basketball Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: basketball dunks, handles and highlight footage. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 89,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — basketball dunks, handles and highlight footage. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: basketball dunks, handles and highlight footage',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['basketball reels', 'nba clips'],
  gallery: [],
  deliveryFiles: ['Basketball-Reel-Bundle.zip'],
};

export const robloxReelBundle: Product = {
  slug: 'roblox-reel-bundle',
  title: 'Roblox Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: Roblox gameplay and funny in-game moments. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 89,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — Roblox gameplay and funny in-game moments. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: Roblox gameplay and funny in-game moments',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['roblox reels', 'gaming clips'],
  gallery: [],
  deliveryFiles: ['Roblox-Reel-Bundle.zip'],
};

export const dailyHackReelBundle: Product = {
  slug: 'daily-hack-reel-bundle',
  title: 'Daily Hack Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: everyday life-hack and DIY-trick demonstration clips. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 89,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — everyday life-hack and DIY-trick demonstration clips. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: everyday life-hack and DIY-trick demonstration clips',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['life hack reels', 'diy clips'],
  gallery: [],
  deliveryFiles: ['Daily-Hack-Reel-Bundle.zip'],
};

export const stickmanReelsBundle: Product = {
  slug: 'stickman-reels-bundle',
  title: 'Stickman Reels Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: animated stickman fight and action clips. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 69,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — animated stickman fight and action clips. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: animated stickman fight and action clips',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['stickman animation', 'fight animation reels'],
  gallery: [],
  deliveryFiles: ['Stickman-Reels-Bundle.zip'],
};

export const mrBeanReelsBundle: Product = {
  slug: 'comedy-reel-bundle',
  title: 'Comedy Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: classic silent-comedy sketch clips. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 69,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — classic silent-comedy sketch clips. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: classic silent-comedy sketch clips',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['comedy sketch reels', 'comedy clips'],
  gallery: [],
  deliveryFiles: ['Comedy-Reel-Bundle.zip'],
};

export const shinchanReelBundle: Product = {
  slug: 'kids-cartoon-reel-bundle',
  title: 'Kids Cartoon Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: kids-cartoon comedy clips for the nostalgia audience. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 69,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — kids-cartoon comedy clips for the nostalgia audience. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: kids-cartoon comedy clips for the nostalgia audience',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['kids cartoon reels', 'cartoon nostalgia'],
  gallery: [],
  deliveryFiles: ['Kids-Cartoon-Reel-Bundle.zip'],
};

export const studyMethodReelBundle: Product = {
  slug: 'study-method-reel-bundle',
  title: 'Study Method Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: study-technique and productivity demonstration footage. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 69,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — study-technique and productivity demonstration footage. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: study-technique and productivity demonstration footage',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['study reels', 'student content'],
  gallery: [],
  deliveryFiles: ['Study-Method-Reel-Bundle.zip'],
};

export const fashionReelsBundle: Product = {
  slug: 'fashion-reels-bundle',
  title: 'Fashion Reels Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: outfit, styling and runway-style fashion footage. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 69,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — outfit, styling and runway-style fashion footage. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: outfit, styling and runway-style fashion footage',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['fashion reels', 'outfit clips'],
  gallery: [],
  deliveryFiles: ['Fashion-Reels-Bundle.zip'],
};

export const romanticReelBundle: Product = {
  slug: 'romantic-reel-bundle',
  title: 'Romantic Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: couple, romance and relationship-moment footage. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 69,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — couple, romance and relationship-moment footage. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: couple, romance and relationship-moment footage',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['romantic reels', 'couple content'],
  gallery: [],
  deliveryFiles: ['Romantic-Reel-Bundle.zip'],
};

export const aiReelBundle: Product = {
  slug: 'ai-reel-bundle',
  title: 'AI Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: AI-generated visuals and futuristic-tech footage. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 69,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — AI-generated visuals and futuristic-tech footage. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: AI-generated visuals and futuristic-tech footage',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['ai reels', 'ai content clips'],
  gallery: [],
  deliveryFiles: ['AI-Reel-Bundle.zip'],
};

export const stockMarketReelBundle: Product = {
  slug: 'stock-market-reel-bundle',
  title: 'Stock Market Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: trading-floor, chart and market-explainer footage. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 69,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — trading-floor, chart and market-explainer footage. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: trading-floor, chart and market-explainer footage',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['stock market reels', 'finance content'],
  gallery: [],
  deliveryFiles: ['Stock-Market-Reel-Bundle.zip'],
};

export const movieExplainingReelBundle: Product = {
  slug: 'movie-explaining-reel-bundle',
  title: 'Movie Explaining Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: movie-recap and scene-explainer footage. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 69,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — movie-recap and scene-explainer footage. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: movie-recap and scene-explainer footage',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['movie recap reels', 'film clips'],
  gallery: [],
  deliveryFiles: ['Movie-Explaining-Reel-Bundle.zip'],
};

export const koreanDramaReelBundle: Product = {
  slug: 'korean-drama-reel-bundle',
  title: 'Korean Drama Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: K-drama scene and moment clips for fan-edit pages. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 69,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — K-drama scene and moment clips for fan-edit pages. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: K-drama scene and moment clips for fan-edit pages',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['kdrama reels', 'korean drama clips'],
  gallery: [],
  deliveryFiles: ['Korean-Drama-Reel-Bundle.zip'],
};

export const americasGotTalentReelBundle: Product = {
  slug: 'americas-got-talent-reel-bundle',
  title: 'America\'s Got Talent Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: talent-show audition and performance clips. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 69,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — talent-show audition and performance clips. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: talent-show audition and performance clips',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['talent show reels', 'agt clips'],
  gallery: [],
  deliveryFiles: ['America-s-Got-Talent-Reel-Bundle.zip'],
};

export const videoEditingReelBundle: Product = {
  slug: 'video-editing-reel-bundle',
  title: 'Video Editing Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: transition, effect and editing-demo footage for tutorial pages. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 69,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — transition, effect and editing-demo footage for tutorial pages. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: transition, effect and editing-demo footage for tutorial pages',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['video editing reels', 'transition clips'],
  gallery: [],
  deliveryFiles: ['Video-Editing-Reel-Bundle.zip'],
};

export const typographyReelBundle: Product = {
  slug: 'typography-reel-bundle',
  title: 'Typography Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: kinetic-typography and animated-text footage. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 49,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — kinetic-typography and animated-text footage. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: kinetic-typography and animated-text footage',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['typography reels', 'text animation'],
  gallery: [],
  deliveryFiles: ['Typography-Reel-Bundle.zip'],
};

export const animatedVideoBundle: Product = {
  slug: 'animated-video-bundle',
  title: 'Animated Video Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: short animated video clips across styles. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 49,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — short animated video clips across styles. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: short animated video clips across styles',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['animated reels', 'animation clips'],
  gallery: [],
  deliveryFiles: ['Animated-Video-Bundle.zip'],
};

export const cameraTricksReelBundle: Product = {
  slug: 'camera-tricks-reel-bundle',
  title: 'Camera Tricks Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: camera-trick and transition-technique demo footage. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 49,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — camera-trick and transition-technique demo footage. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: camera-trick and transition-technique demo footage',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['camera trick reels', 'photography tricks'],
  gallery: [],
  deliveryFiles: ['Camera-Tricks-Reel-Bundle.zip'],
};

export const lofiMusicReelBundle: Product = {
  slug: 'lofi-music-reel-bundle',
  title: 'Lofi Music Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: chill lofi-aesthetic background footage. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 49,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — chill lofi-aesthetic background footage. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: chill lofi-aesthetic background footage',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['lofi reels', 'chill background clips'],
  gallery: [],
  deliveryFiles: ['Lofi-Music-Reel-Bundle.zip'],
};

export const usaReelBundle: Product = {
  slug: 'usa-reel-bundle',
  title: 'USA Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: American city, landmark and lifestyle footage. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 49,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — American city, landmark and lifestyle footage. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: American city, landmark and lifestyle footage',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['usa reels', 'america clips'],
  gallery: [],
  deliveryFiles: ['USA-Reel-Bundle.zip'],
};

export const usaFactReelBundle: Product = {
  slug: 'usa-fact-reel-bundle',
  title: 'USA Fact Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: fact-and-trivia footage about the United States. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 49,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — fact-and-trivia footage about the United States. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: fact-and-trivia footage about the United States',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['usa facts reels', 'trivia clips'],
  gallery: [],
  deliveryFiles: ['USA-Fact-Reel-Bundle.zip'],
};

export const childhoodNostalgiaReelBundle: Product = {
  slug: 'childhood-nostalgia-reel-bundle',
  title: 'Childhood Nostalgia Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: 2000s-2010s childhood-nostalgia footage. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 49,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — 2000s-2010s childhood-nostalgia footage. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: 2000s-2010s childhood-nostalgia footage',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['nostalgia reels', 'throwback clips'],
  gallery: [],
  deliveryFiles: ['Childhood-Nostalgia-Reel-Bundle.zip'],
};

export const luxuryCarBikeReelBundle: Product = {
  slug: 'luxury-car-bike-reel-bundle',
  title: 'Luxury Car & Bike Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: luxury car and superbike showcase footage. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 49,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — luxury car and superbike showcase footage. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: luxury car and superbike showcase footage',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['car reels', 'luxury car clips'],
  gallery: [],
  deliveryFiles: ['Luxury-Car-and-Bike-Reel-Bundle.zip'],
};

export const shayariReelBundle: Product = {
  slug: 'shayari-reel-bundle',
  title: 'Shayari Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: Hindi/Urdu shayari footage with mood-board visuals. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 49,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — Hindi/Urdu shayari footage with mood-board visuals. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: Hindi/Urdu shayari footage with mood-board visuals',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['shayari reels', 'hindi poetry clips'],
  gallery: [],
  deliveryFiles: ['Shayari-Reel-Bundle.zip'],
};

export const timelapseReelBundle: Product = {
  slug: 'timelapse-reel-bundle',
  title: 'Timelapse Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: timelapse footage of cities, nature and skies. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 49,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — timelapse footage of cities, nature and skies. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: timelapse footage of cities, nature and skies',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['timelapse reels', 'b-roll clips'],
  gallery: [],
  deliveryFiles: ['Timelapse-Reel-Bundle.zip'],
};

export const glowingMotionGraphicBundle: Product = {
  slug: 'glowing-motion-graphic-bundle',
  title: 'Glowing Motion Graphic Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: glowing, neon-style motion-graphic background footage. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 49,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — glowing, neon-style motion-graphic background footage. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: glowing, neon-style motion-graphic background footage',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['motion graphics', 'neon background clips'],
  gallery: [],
  deliveryFiles: ['Glowing-Motion-Graphic-Bundle.zip'],
};

export const omegleReelBundle: Product = {
  slug: 'omegle-reel-bundle',
  title: 'Omegle Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: Omegle-style reaction and interaction clips. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 29,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — Omegle-style reaction and interaction clips. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: Omegle-style reaction and interaction clips',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['omegle reels', 'reaction clips'],
  gallery: [],
  deliveryFiles: ['Omegle-Reel-Bundle.zip'],
};

export const matrixReelBundle: Product = {
  slug: 'sci-fi-action-reel-bundle',
  title: 'Sci-Fi Action Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: digital-rain and sci-fi action aesthetic footage. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 29,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — digital-rain and sci-fi action aesthetic footage. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: digital-rain and sci-fi action aesthetic footage',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['sci-fi action reels', 'sci-fi background clips'],
  gallery: [],
  deliveryFiles: ['Sci-Fi-Action-Reel-Bundle.zip'],
};

export const skeletonReelBundle: Product = {
  slug: 'skeleton-reel-bundle',
  title: 'Skeleton Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: skeleton and spooky-aesthetic animation footage. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 29,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — skeleton and spooky-aesthetic animation footage. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: skeleton and spooky-aesthetic animation footage',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['skeleton reels', 'horror aesthetic clips'],
  gallery: [],
  deliveryFiles: ['Skeleton-Reel-Bundle.zip'],
};

export const madScientistReelBundle: Product = {
  slug: 'mad-scientist-reel-bundle',
  title: 'Mad Scientist Reel Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: mad-scientist and lab-experiment aesthetic footage. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 29,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — mad-scientist and lab-experiment aesthetic footage. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: mad-scientist and lab-experiment aesthetic footage',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['mad scientist reels', 'sci-fi clips'],
  gallery: [],
  deliveryFiles: ['Mad-Scientist-Reel-Bundle.zip'],
};

export const abandonedStyleReelsBundle: Product = {
  slug: 'abandoned-style-reels-bundle',
  title: 'Abandoned Style Reels Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: abandoned-place and urbex-style atmospheric footage. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 29,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — abandoned-place and urbex-style atmospheric footage. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: abandoned-place and urbex-style atmospheric footage',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['abandoned reels', 'urbex clips'],
  gallery: [],
  deliveryFiles: ['Abandoned-Style-Reels-Bundle.zip'],
};

export const reelStopGameBundle: Product = {
  slug: 'reel-stop-game-bundle',
  title: 'Reel Stop Game Bundle',
  tagline:
    'A curated Google Drive folder of raw, vertical clips: stop-and-guess style interactive game-format clips. Download and cut them into your own Reels, Shorts and TikToks.',
  price: 29,
  accent: REEL_BUNDLES.accent,
  category: REEL_BUNDLES,
  format: 'Reel Pack',
  longDescription: [
    {
      heading: 'What\'s Inside',
      paragraphs: [
        'Raw vertical video clips — stop-and-guess style interactive game-format clips. Delivered as a Google Drive folder link after purchase, so you can browse, pick and download only what you need straight into your editor.',
      ],
    },
  ],
  bulletPoints: [
    'Raw clips: stop-and-guess style interactive game-format clips',
    'Vertical MP4, ready to drop into CapCut, Premiere or any editor',
    'Use freely in your own edits — repost, remix, monetise',
  ],
  faqs: [REEL_BUNDLE_FORMAT_FAQ, REEL_BUNDLE_LICENSE_FAQ, REEL_BUNDLE_REFUND_FAQ],
  tags: ['reel game bundle', 'interactive reels'],
  gallery: [],
  deliveryFiles: ['Reel-Stop-Game-Bundle.zip'],
};

export const allReelBundleProducts: Product[] = [
  motivationReelBundle,
  animeReelBundle,
  gymFitnessReelBundle,
  gamingReelsBundle,
  mrBeastReelBundle,
  cricketReelsBundle,
  footballReelBundle,
  andrewTateReelBundle,
  islamicReelBundle,
  gtaVReelBundle,
  ronaldoReelBundle,
  messiRonaldoReelBundle,
  factsReelsBundle,
  satisfyingReelsBundle,
  tomAndJerryReelBundle,
  basketballReelBundle,
  robloxReelBundle,
  dailyHackReelBundle,
  stickmanReelsBundle,
  mrBeanReelsBundle,
  shinchanReelBundle,
  studyMethodReelBundle,
  fashionReelsBundle,
  romanticReelBundle,
  aiReelBundle,
  stockMarketReelBundle,
  movieExplainingReelBundle,
  koreanDramaReelBundle,
  americasGotTalentReelBundle,
  videoEditingReelBundle,
  typographyReelBundle,
  animatedVideoBundle,
  cameraTricksReelBundle,
  lofiMusicReelBundle,
  usaReelBundle,
  usaFactReelBundle,
  childhoodNostalgiaReelBundle,
  luxuryCarBikeReelBundle,
  shayariReelBundle,
  timelapseReelBundle,
  glowingMotionGraphicBundle,
  omegleReelBundle,
  matrixReelBundle,
  skeletonReelBundle,
  madScientistReelBundle,
  abandonedStyleReelsBundle,
  reelStopGameBundle,
];

/**
 * slug -> the real Drive FOLDER id (not the shortcut in "Dropdesk Bundle").
 * Read by scripts/set-reel-bundle-drive-links.js to set catalog_products.drive_link
 * + send_drive_in_email = true after migrate-catalog.js creates the rows —
 * that column is admin-set DB state, not part of the Product type (see
 * api/migrations/012_catalog_delivery.sql), so it can't live above.
 */
export const reelBundleDriveFolderIds: Record<string, string> = {
  'motivation-reel-bundle': '1Wuqf0TKgHTw2LjtE8O_eV-p-v7kU39pn',
  'anime-reel-bundle': '1V1HjZrcjdHMrQekct03GxUKVzUvnGbZ4',
  'gym-fitness-reel-bundle': '11qmIYLUJZrs2_CvpRV1P24AyMjZQ-dp0',
  'gaming-reels-bundle': '1pMR64bfRB1UvHMys1YFeCKSeaPCxFjOt',
  'viral-challenge-reel-bundle': '1wGjurWTbIdDR5hbJHwqzRlufcGxaXfWW',
  'cricket-reels-bundle': '1tGIYfpYnMetYznzZa0tMWlW_NB-NUh8y',
  'football-reel-bundle': '1mJIsLgawnY9gdd846-mjGJAH7lcY3yoU',
  'hustle-mindset-reel-bundle': '1SsyDEUkOEY3uCmuLAkBwCju_I3eMqcPR',
  'islamic-reel-bundle': '1hKZ6IZvdSSxHX1PNRqvAiH54SHFNaVNj',
  'open-world-game-reel-bundle': '1Z4onTwk354VY8ZO-Z6HbRYbcSP5jvYBG',
  'football-stars-reel-bundle': '1fCwimg9fseyStPiOrBqtjaEps6yRl9Fb',
  'football-legends-reel-bundle': '1V6P-BB8YTXqDzHdmsQYne2UGEZt519-F',
  'facts-reels-bundle': '1aTr7KJamJ-g56Ko8TC3udKt4Hr4ZV5A1',
  'satisfying-reels-bundle': '17rEZjHDLBcqthFOeE-Pt-JcBFzRzDZZi',
  'cat-and-mouse-cartoon-bundle': '1kX2atIBQpUw0Amik4O0RgTaDwo6sALRd',
  'basketball-reel-bundle': '1g5rdhEuXi0_QWSQi4CZQ_ddlDuYF3wRV',
  'roblox-reel-bundle': '1b5V1vUnxrj0NBEt88hPwj8zBv0y_peTN',
  'daily-hack-reel-bundle': '162D15CcqD8W1kHHxVSK2oPdazMmFqEDx',
  'stickman-reels-bundle': '13UA_Th3QUFuAWae9Q85e2QHMvBfMAB7o',
  'comedy-reel-bundle': '1T_t5-hQ_WpTQBKMZi0q-JGXqZUUXr-hA',
  'kids-cartoon-reel-bundle': '16VTib7cQn1WDEeEEcA-3jlQ6lLvBdsVI',
  'study-method-reel-bundle': '1HEDhOURsv48bvlSH7LDntxxRyY0IFA6k',
  'fashion-reels-bundle': '1VyBUqb1GcwCPGnGuy4NOGOaPmD-NV8x4',
  'romantic-reel-bundle': '1h3-ftkFKvNnPtnQhx6mRvRCJkWQa5u9q',
  'ai-reel-bundle': '1Ey1LmefhzOW7FG1HDUvKQBOksfKlU9vX',
  'stock-market-reel-bundle': '1GcnfyHNNQQetxe02oRKrykpqMdVw08Zd',
  'movie-explaining-reel-bundle': '1LVQthLK7izFYdkDG1ARG13RcvjgkbLBX',
  'korean-drama-reel-bundle': '19HoaENIT5M-7CqleGHeqYFImcVoFJQvO',
  'americas-got-talent-reel-bundle': '1JKKSA3ES1CCooNfOH1QBS9amRFD7BFWm',
  'video-editing-reel-bundle': '1ncXAiuJmq0IYN8AU6UREayjTZY04bzCu',
  'typography-reel-bundle': '1tSI8Vb0T7W1OGQzJBBoFbEC3M8uV_7Ml',
  'animated-video-bundle': '1s2sxWkW66w3X_7nZ6kG1fG949vO2AVkY',
  'camera-tricks-reel-bundle': '1XO9wAma6m1gkaN6cFxtUGGvTPQSvtqQ4',
  'lofi-music-reel-bundle': '1GI3VtCXkKhpMkV8j24bbDTLULx01UxeL',
  'usa-reel-bundle': '1gkWOBtIUf9IxdCdtVlm3hdagXC29yfPB',
  'usa-fact-reel-bundle': '1iXqx0nomGzMG6pfju5GbDjQ2NaACOqK3',
  'childhood-nostalgia-reel-bundle': '1a3Pyaj2jZWZX-OD8nSys1tlNbwoz_3O6',
  'luxury-car-bike-reel-bundle': '1pWkUQ43P1Kjm4iYlH-ETv0ANnlw-EzQD',
  'shayari-reel-bundle': '1APJrLb6vxA3bXtvtGlagjr54YQYn7gcN',
  'timelapse-reel-bundle': '1xSzkwpRnFyMDHWuEhHLWLTXiWGxNT1-h',
  'glowing-motion-graphic-bundle': '1q_TWvq4wii3Hb_HBSk-E7dcyHDgt4Ljl',
  'omegle-reel-bundle': '1rBB5YOA1yrwEf0qbgqdKHY4tbCqw8X4D',
  'sci-fi-action-reel-bundle': '1o1SgudnJDRmmC2ziC3V4W5HfZaPoMwPq',
  'skeleton-reel-bundle': '1l7y8ZIWDHvjsZGmmpBImo3J2nRYj_2fa',
  'mad-scientist-reel-bundle': '1K1LXDwcRSdNCIoXMTeP7nJfFSdrjzD9s',
  'abandoned-style-reels-bundle': '1Gt-p2J88h2PeeaQ8k4AYfEM9JisWHuc9',
  'reel-stop-game-bundle': '1OI1BwSh8zWQXfN1cXeZvxi3UPg4lALG2',
};

/**
 * Attach the Drive folder id to every reel-bundle product so its page can
 * render the live "What's inside" preview (see components/product/
 * DrivePreview.tsx). We do this here, once, instead of hand-adding the field
 * to every product literal above: the map right above is already the single
 * source of truth for slug -> folder id, and copying it into 47 product
 * literals is exactly the kind of drift Product.driveFolderId is trying to
 * avoid. Mutating in place is safe because these product objects are
 * consumed only after this module has finished loading.
 */
for (const product of allReelBundleProducts) {
  const folderId = reelBundleDriveFolderIds[product.slug];
  if (folderId) {
    product.driveFolderId = folderId;
  }
}
