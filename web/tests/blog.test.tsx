import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';

import { listPosts, getPost, postsForProduct, formatPostDate, filterPosts, listTags } from '@/lib/blog';
import { getProduct } from '@/lib/catalog';
import PostCard from '@/components/blog/PostCard';

describe('blog data', () => {
  it('has at least one post and every post is reachable by its slug', () => {
    const posts = listPosts();
    expect(posts.length).toBeGreaterThan(0);
    for (const post of posts) {
      expect(getPost(post.slug), `${post.slug} is not reachable`).toBeTruthy();
    }
  });

  it('uses unique slugs', () => {
    const slugs = listPosts().map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('orders newest first', () => {
    const dates = listPosts().map((p) => p.published);
    expect(dates).toEqual([...dates].sort((a, b) => b.localeCompare(a)));
  });

  it('gives every post a title, a summary, an ISO date and a body', () => {
    for (const post of listPosts()) {
      expect(post.title.length, `${post.slug} has no title`).toBeGreaterThan(0);
      expect(post.summary.length, `${post.slug} has no summary`).toBeGreaterThan(0);
      expect(post.published, `${post.slug} has a malformed date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(post.body.length, `${post.slug} has an empty body`).toBeGreaterThan(0);
      for (const section of post.body) {
        expect(section.paragraphs.length, `${post.slug} has an empty section`).toBeGreaterThan(0);
      }
    }
  });

  // A related-products strip that points at a slug the catalog does not have
  // would render an empty block on a live page.
  it('only relates posts to products that actually exist', () => {
    for (const post of listPosts()) {
      for (const slug of post.relatedProducts ?? []) {
        expect(getProduct(slug), `${post.slug} references missing product ${slug}`).toBeTruthy();
      }
    }
  });

  it('finds posts by the product they reference', () => {
    for (const post of listPosts()) {
      for (const slug of post.relatedProducts ?? []) {
        expect(postsForProduct(slug).map((p) => p.slug)).toContain(post.slug);
      }
    }
  });

  it('formats dates as a spelled-out day, month and year', () => {
    expect(formatPostDate('2026-08-23')).toBe('23 August 2026');
    expect(formatPostDate('2026-01-01')).toBe('1 January 2026');
  });
});

describe('blog copy holds to the site-wide rules', () => {
  const allText = listPosts()
    .flatMap((p) => [p.title, p.summary, ...p.body.flatMap((s) => [s.heading ?? '', ...s.paragraphs, ...(s.bullets ?? [])])])
    .join('\n');

  it('claims no sales, ratings or popularity the store cannot back', () => {
    for (const pattern of [/\bbest ?sell/i, /\btrending\b/i, /\bmost popular\b/i, /\b\d+[,\d]* (customers|buyers|students|sales)\b/i, /\b\d(\.\d)? stars?\b/i]) {
      expect(allText, `blog copy contains a claim the store cannot back: ${pattern}`).not.toMatch(pattern);
    }
  });

  it('never promises the file as an email attachment', () => {
    // Delivery sends a download LINK. api/utils/template.js builds it; the
    // legal pages and the order page all say link, and the blog must agree.
    // Denying an attachment is correct and expected ("it does not carry the
    // file as an attachment"), so only an un-negated sentence is a failure.
    const sentences = allText.split(/(?<=[.!?])\s+/);
    const offenders = sentences.filter(
      (s) => /attach(ed|ment|es)/i.test(s) && !/\b(not|never|no|rather than|instead of)\b/i.test(s)
    );
    expect(offenders, `blog copy promises an attachment: ${offenders.join(' | ')}`).toEqual([]);
  });

  it('uses no em dashes', () => {
    expect(allText).not.toContain('—');
  });
});

describe('PostCard', () => {
  it('links to the post and shows its title', () => {
    const post = listPosts()[0];
    render(<PostCard post={post} />);
    const link = screen.getByRole('link', { name: new RegExp(post.title, 'i') });
    expect(link.getAttribute('href')).toBe(`/blog/${post.slug}`);
  });

  it('gives every card a 44px tap target', () => {
    const { container } = render(<PostCard post={listPosts()[0]} />);
    const link = container.querySelector('a');
    expect(link?.className).toMatch(/min-h-\[44px\]/);
  });

  // Most posts have no cover image. That must render as a designed panel, not
  // as an empty box or a broken-image slot.
  it('renders a typographic panel carrying the tags when a post has no image', () => {
    // Built rather than found: every shipped post currently has a cover, but
    // the fallback is what a future post without one depends on, so it must
    // stay covered whatever the catalog happens to hold today.
    const post = { ...listPosts()[0], image: undefined };

    const { container } = render(<PostCard post={post} />);
    expect(container.querySelector('img')).toBeNull();
    for (const tag of post.tags) {
      expect(screen.getAllByText(tag).length).toBeGreaterThan(0);
    }
  });
});

describe('blog filtering', () => {
  it('returns every post when nothing is applied', () => {
    expect(filterPosts()).toHaveLength(listPosts().length);
  });

  it('narrows by tag, case-insensitively', () => {
    const { tag } = listTags()[0];
    const hits = filterPosts({ tag: tag.toLowerCase() });
    expect(hits.length).toBeGreaterThan(0);
    for (const post of hits) {
      expect(post.tags.map((t) => t.toLowerCase())).toContain(tag.toLowerCase());
    }
  });

  it('narrows by a word prefix in the post body', () => {
    const hits = filterPosts({ q: 'razorpay' });
    expect(hits.length).toBeGreaterThan(0);
  });

  it('composes tag and query, narrowing rather than widening', () => {
    const { tag } = listTags()[0];
    const byTag = filterPosts({ tag });
    const both = filterPosts({ tag, q: 'the' });
    expect(both.length).toBeLessThanOrEqual(byTag.length);
  });

  it('returns nothing for a query that matches no post', () => {
    expect(filterPosts({ q: 'zzzznotathing' })).toEqual([]);
  });

  it('counts every tag against the posts that carry it', () => {
    for (const { tag, count } of listTags()) {
      expect(filterPosts({ tag })).toHaveLength(count);
    }
  });
});

/**
 * Unsplash's licence is a condition of use, not a nicety: every photo must
 * credit the photographer and Unsplash, both linked, and the links must carry
 * the referral parameters. A post that ships an image without them is a licence
 * breach, so this is a test rather than a comment.
 */
describe('blog images honour the Unsplash licence', () => {
  const withImages = listPosts().filter((p) => p.image);

  it('credits a named photographer and links both them and Unsplash', () => {
    for (const post of withImages) {
      const c = post.image!.credit;
      expect(c.photographer.length, `${post.slug} has no photographer`).toBeGreaterThan(0);
      expect(c.photographerUrl, `${post.slug} photographer link`).toMatch(/^https:\/\/unsplash\.com\/@/);
      expect(c.photoUrl, `${post.slug} photo link`).toMatch(/^https:\/\/unsplash\.com\/photos\//);
    }
  });

  it('carries the referral parameters Unsplash requires on both links', () => {
    for (const post of withImages) {
      for (const url of [post.image!.credit.photographerUrl, post.image!.credit.photoUrl]) {
        expect(url, `${post.slug}: ${url}`).toContain('utm_source=dropdesk');
        expect(url, `${post.slug}: ${url}`).toContain('utm_medium=referral');
      }
    }
  });

  it('hotlinks the Unsplash CDN rather than rehosting the file', () => {
    for (const post of withImages) {
      expect(post.image!.url, `${post.slug} must not rehost`).toMatch(
        /^https:\/\/images\.unsplash\.com\//
      );
    }
  });

  // Unsplash's own alt_description is unreliable: the price-tag photo is
  // described upstream as "white apple earpods on pink surface". Alt text is
  // written by hand, and a real sentence is the signal that it was.
  it('writes real alt text rather than piping through the API description', () => {
    for (const post of withImages) {
      const alt = post.image!.alt;
      expect(alt.length, `${post.slug} alt is too short to describe anything`).toBeGreaterThan(24);
      expect(alt, `${post.slug} alt should read as a sentence`).toMatch(/\.$/);
      expect(alt.toLowerCase(), `${post.slug} alt must not be a filename`).not.toMatch(/\.(jpg|png|webp)/);
    }
  });
});
