/**
 * Types for Dropdesk's file-based blog.
 *
 * Same shape of decision as the product catalog: posts live in the repo as
 * typed data rather than in a database. There is no reachable Postgres, posts
 * change rarely, and every post statically generates — which is what an ads
 * and search launch actually needs.
 *
 * `slug` is a plain string, not a union, so adding a post is adding a file.
 * The catalog learned that lesson the hard way when a six-slug union made the
 * seventh product a type error.
 */

export type BlogSection = {
  heading?: string;
  /** Each string renders as its own paragraph. */
  paragraphs: string[];
  /** Optional bullet list rendered after the paragraphs. */
  bullets?: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  /** One sentence. Used on the index, in metadata, and as the OG description. */
  summary: string;
  /** ISO date, YYYY-MM-DD. Drives ordering and the visible date. */
  published: string;
  /** Rough read time in minutes, stated honestly rather than inflated. */
  readMinutes: number;
  /** Free-text topic labels. Rendered, and used for nothing else yet. */
  tags: string[];
  body: BlogSection[];
  /**
   * Optional cover image.
   *
   * Absent is a normal case and must render as a designed card, not a gap: the
   * product catalog learned this when 75 of 84 items shipped without art.
   *
   * Unsplash's licence requires the photographer and Unsplash both be credited
   * with links, and requires hotlinking their CDN rather than rehosting the
   * file, so the URL is theirs and the credit is not optional.
   *
   * `alt` is written by hand, never copied from the API. Unsplash's own
   * alt_description is frequently wrong: the price-tag photo used on the
   * pricing post is described upstream as "white apple earpods on pink
   * surface". Piping that through would hand screen readers a false
   * description of the image.
   */
  image?: {
    url: string;
    alt: string;
    credit: { photographer: string; photographerUrl: string; photoUrl: string };
  };
  /**
   * Product slugs this post genuinely relates to. Rendered as a "mentioned in
   * this post" strip. Only put a slug here when the post actually discusses
   * that product — this is not an ad slot.
   */
  relatedProducts?: string[];
};
