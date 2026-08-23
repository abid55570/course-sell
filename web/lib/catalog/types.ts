/**
 * Types for Dropdesk's file-based product catalog.
 *
 * Source of truth for every value here is
 * `C:\Users\anas0\Downloads\Dashrize-Products\`, specifically each product's
 * `3 - LISTING TEXT\listing-copy-paste.md` (approved store copy — do not
 * paraphrase it when filling these types) and the root `READ-ME-FIRST.txt`
 * (catalog overview, pricing ladder, pairings, compliance rules).
 */

/**
 * Product and bundle slugs are open: any digital product the owner adds gets
 * its own slug, not just the six launch products. (Was a closed six-literal
 * union; opening it up is the whole point of the catalog restructure — see
 * the catalog build report.)
 */
export type ProductSlug = string;

export type BundleSlug = string;

/**
 * README colour keyword plus a usable hex so components don't have to map
 * names themselves. `name` is never read by any component or test — it's
 * documentation only (see the type's own history: the six launch products
 * each carry one of the first six names below, straight off
 * READ-ME-FIRST.txt's own "green / gold / blue / violet / teal / orange"
 * labels). Widened with three more names for the three new product-family
 * categories added alongside the character/parents/ten-series catalog
 * import, each picked for hue separation from the original six and from the
 * vermilion brand primary (#C42B22) — see lib/catalog/categories.ts.
 */
export type AccentColor = {
  name: 'green' | 'gold' | 'blue' | 'violet' | 'teal' | 'orange' | 'pink' | 'lime' | 'indigo';
  hex: string;
};

/** A category slug is open too — any grouping a new product needs, not just the three the launch six sort into. */
export type CategorySlug = string;

/**
 * A first-class product category: a slug, a display label, and its own
 * accent colour (independent of any single product's accent, since a
 * category can hold several products with different accents). New products
 * are free to declare a brand-new category inline — nothing needs
 * registering elsewhere for it to show up in listings, filtering or page
 * generation. See tests/catalog.test.ts's "catalog openness" suite.
 */
export type Category = {
  slug: CategorySlug;
  label: string;
  accent: AccentColor;
};

/** One numbered module inside a product (e.g. "Module 01 — BODY"). */
export type ProductModule = {
  id: string; // "01", "02", ...
  title: string; // "BODY"
  pageCount: number;
  /** Bullet points lifted from the long description for this module. */
  highlights: string[];
};

/** One section of the long description, so it renders as sections, not one blob. */
export type DescriptionSection = {
  heading: string;
  /** One or more paragraphs; render each as its own <p>. */
  paragraphs: string[];
};

export type FaqEntry = {
  question: string;
  answer: string;
};

export type GalleryImageRole = 'cover' | 'whats-inside' | 'proof';

export type GalleryImage = {
  /** Filename as copied into web/public/products/<slug>/ (or /bundles/<slug>/ for bundles). */
  filename: string;
  role: GalleryImageRole;
  /** Purpose/alt text, drawn from the listing file's gallery-image table. */
  alt: string;
};

/** A helpline the listing copy carries verbatim (Tele-MANAS, cybercrime helpline, ...). */
export type Helpline = {
  name: string;
  number: string;
  /** Sentence context as written in the listing text. */
  context: string;
};

export type Product = {
  slug: ProductSlug;
  title: string;
  /** Short store-truncation-safe variant, if the listing text offers one. */
  shortTitle?: string;
  /** "Short description / tagline" block. */
  tagline: string;
  price: number;
  /** "Anchor it as ... value" price, only where the listing text gives one. */
  anchorPrice?: number;
  anchorNote?: string;
  /** Total page count, only for products actually built out of numbered/paginated content. */
  pageCount?: number;
  /** Printable tracker count, only for products that ship a tracker pack. */
  trackerCount?: number;
  /** Who it's for, only where the listing text names one. */
  audience?: string;
  accent: AccentColor;
  /** The category this product belongs to. Any product may declare any category; nothing needs pre-registering. */
  category: Category;
  /** What kind of thing this is: "PDF", "Course", "Template pack", etc. Optional: not every future
   * product needs a labelled format, and the UI must not print "undefined" when it's absent. */
  format?: string;
  /** How many files the buyer receives, from `deliveryFiles.length`, where that count is meaningful. */
  fileCount?: number;
  /** Human-readable total download size ("48 MB"), only where it's actually known. Never estimated. */
  fileSizeLabel?: string;
  /** Numbered modules, only for products actually structured that way. Omit rather than force an
   * empty array's worth of UI onto a product that has no modules. */
  modules?: ProductModule[];
  longDescription: DescriptionSection[];
  bulletPoints: string[];
  faqs: FaqEntry[];
  /** Disclaimer text, carried verbatim from the listing file. Never paraphrase. Optional: not every
   * digital product needs a compliance disclaimer. */
  disclaimer?: string;
  /** Helplines the disclaimer references, if any. Optional for the same reason disclaimer is. */
  helplines?: Helpline[];
  tags: string[];
  gallery: GalleryImage[];
  /** PDF/asset filenames the buyer receives, from the listing file's "Delivery file" block. */
  deliveryFiles: string[];
  /** The partner product slug the README pairs this product with (primary pairing). */
  pairSlug?: ProductSlug;
  /**
   * For a product sold individually within a larger themed set (one
   * character guide within "The Character Codex", one guide within "Talking
   * to Your Parents" or "The Ten Series"), the slug of that set product —
   * so the storefront can show the real "buy this alone or get the whole
   * set" anchor the listing copy asks for, computed from real prices
   * instead of a fabricated discount. Distinct from `pairSlug`, which pairs
   * two different top-level products at the README's fixed ladder pricing;
   * a set anchor compares two arbitrary real prices instead.
   */
  setSlug?: ProductSlug;
  /** Curated homepage placement. Not every product needs to be featured. */
  featured?: boolean;
};

/** One component of a bundle. Some named bundles include products outside the six-item
 * Dropdesk catalog (not yet built, no approved listing copy) — those are recorded with
 * `slug: null` and `inCatalog: false` rather than invented as fake catalog entries. */
export type BundleComponent =
  | { slug: ProductSlug; label: string; inCatalog: true }
  | { slug: null; label: string; inCatalog: false; note: string };

export type Bundle = {
  slug: BundleSlug;
  title: string;
  price: number;
  /** "if bought separately" comparison price from the listing text, where given. */
  separatePrice?: number;
  tagline: string;
  longDescription: DescriptionSection[];
  disclaimer: string;
  helplines: Helpline[];
  components: BundleComponent[];
  coverImage: GalleryImage;
  /** True only when every component is one of the six shipped Dropdesk products. */
  availableToday: boolean;
  faqs: FaqEntry[];
};
