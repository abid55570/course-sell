import type { BlogPost } from './types';
import { howDeliveryWorks } from './posts/how-delivery-works';
import { whyOnePayment } from './posts/why-one-payment';
import { theDownloadExperience } from './posts/the-download-experience';
import { honestPricing } from './posts/honest-pricing';

export type { BlogPost, BlogSection } from './types';

/**
 * Every post. Adding one means adding a file and a line here — no database, no
 * CMS, no build-time fetch. Each post statically generates.
 */
const posts: BlogPost[] = [howDeliveryWorks, whyOnePayment, theDownloadExperience, honestPricing];

const bySlug = new Map(posts.map((p) => [p.slug, p]));

/** Newest first. */
export function listPosts(): BlogPost[] {
  return posts.slice().sort((a, b) => b.published.localeCompare(a.published));
}

export function getPost(slug: string): BlogPost | undefined {
  return bySlug.get(slug);
}

/** Posts that reference a given product, for the product page to link back. */
export function postsForProduct(productSlug: string): BlogPost[] {
  return listPosts().filter((p) => p.relatedProducts?.includes(productSlug));
}

/** "23 August 2026" — spelled out, since numeric dates read differently by country. */
export function formatPostDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${d} ${months[m - 1]} ${y}`;
}

/** Every tag in use, in order of how many posts carry it, then alphabetically. */
export function listTags(): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu, ' ').split(/\s+/).filter(Boolean).join(' ');
}

/**
 * Posts narrowed by tag and by a text query, in that order.
 *
 * Matching runs on the server against the post's own title, summary, tags and
 * body, so no index ships to the browser. Same reasoning as product search:
 * the readers are on mobile data and the post count only grows.
 */
export function filterPosts({ tag, q }: { tag?: string; q?: string } = {}): BlogPost[] {
  let out = listPosts();

  if (tag) {
    const wanted = tag.toLowerCase();
    out = out.filter((p) => p.tags.some((t) => t.toLowerCase() === wanted));
  }

  const terms = normalise(q ?? '').split(' ').filter(Boolean);
  if (terms.length > 0) {
    out = out.filter((post) => {
      const hay = normalise(
        [
          post.title,
          post.summary,
          post.tags.join(' '),
          post.body.flatMap((s) => [s.heading ?? '', ...s.paragraphs, ...(s.bullets ?? [])]).join(' '),
        ].join(' ')
      );
      return terms.every((term) => hay.split(' ').some((word) => word.startsWith(term)));
    });
  }

  return out;
}
