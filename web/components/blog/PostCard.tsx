import Image from 'next/image';
import Link from 'next/link';
import type { BlogPost } from '@/lib/blog';
import { formatPostDate } from '@/lib/blog';

/**
 * A post in a list, at one of two sizes.
 *
 * Most posts have no cover image and that is the expected case, not a gap. The
 * product catalog learned this when 75 of 84 items shipped without art: a card
 * that reads as "missing image" is a failure, one that reads as deliberately
 * typographic is not. So a post without an image gets a ruled register panel
 * carrying its own tags, in the same paperwork language as the rest of the site.
 */
export default function PostCard({
  post,
  featured = false,
}: {
  post: BlogPost;
  featured?: boolean;
}) {
  const meta = (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-soft">
      <time dateTime={post.published}>{formatPostDate(post.published)}</time>
      <span aria-hidden="true">·</span>
      <span>{post.readMinutes} min read</span>
    </span>
  );

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group flex min-h-[44px] flex-col gap-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
        featured ? 'sm:flex-row sm:items-start sm:gap-8' : ''
      }`}
    >
      <div className={featured ? 'w-full sm:w-1/2 sm:shrink-0' : 'w-full'}>
        <div className="relative aspect-[16/10] w-full overflow-hidden border border-ink/15">
          {post.image ? (
            <Image
              src={post.image.url}
              alt={post.image.alt}
              fill
              sizes={featured ? '(min-width: 640px) 50vw, 100vw' : '(min-width: 640px) 33vw, 100vw'}
              className="object-cover"
            />
          ) : (
            /* No cover art, which is the normal case. Rather than a grey box
               reading as a missing image, the panel becomes the article's own
               stub: the read time set at poster scale, the date, and the tags.
               It deliberately does NOT repeat the title, which sits beside it —
               the product cards shipped that duplication and it looked broken. */
            <div className="ground-chart flex h-full w-full flex-col justify-between bg-canvas-2 p-4">
              <span className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                <span>Dropdesk</span>
                <time dateTime={post.published}>{post.published}</time>
              </span>

              <span className="flex items-baseline gap-2 leading-none">
                <span
                  className={`font-display font-extrabold leading-[0.8] text-ink ${
                    featured ? 'text-7xl sm:text-8xl' : 'text-5xl'
                  }`}
                >
                  {post.readMinutes}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                  min
                  <br />
                  read
                </span>
              </span>

              <span className="flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="border border-ink/20 bg-canvas px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink"
                  >
                    {tag}
                  </span>
                ))}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className={featured ? 'sm:w-1/2' : ''}>
        {meta}
        <h2
          className={`mt-2 font-display font-bold uppercase leading-[0.95] text-ink group-hover:text-primary ${
            featured ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'
          }`}
        >
          {post.title}
        </h2>
        <p className={`mt-2 text-ink-soft ${featured ? 'text-base' : 'text-sm'}`}>{post.summary}</p>
        {featured ? (
          <span className="mt-5 inline-flex min-h-[44px] items-center border border-ink/20 px-5 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-ink group-hover:border-primary group-hover:text-primary">
            Read now →
          </span>
        ) : null}
      </div>
    </Link>
  );
}
