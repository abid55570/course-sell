import type { Metadata } from 'next';
import Link from 'next/link';
import { filterPosts, listTags, listPosts } from '@/lib/blog';
import PostCard from '@/components/blog/PostCard';
import Footer from '@/components/landing/Footer';
import { getFooterData } from '@/lib/catalog/footer-data';

export const metadata: Metadata = {
  title: 'Blog | Dropdesk',
  description: 'How the store works, what it sells, and how it is priced.',
};

export default async function BlogIndex({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string }>;
}) {
  const footer = await getFooterData();
  const { tag = '', q = '' } = await searchParams;
  const query = q.trim();
  const activeTag = tag.trim();

  const posts = filterPosts({ tag: activeTag || undefined, q: query || undefined });
  const tags = listTags();
  const total = listPosts().length;
  const filtering = Boolean(activeTag || query);

  const [featured, ...rest] = posts;

  /** Keeps the other param when one of them changes. */
  function href(next: { tag?: string; q?: string }) {
    const params = new URLSearchParams();
    const t = next.tag ?? activeTag;
    const s = next.q ?? query;
    if (t) params.set('tag', t);
    if (s) params.set('q', s);
    const qs = params.toString();
    return qs ? `/blog?${qs}` : '/blog';
  }

  return (
    <>
      <main className="bg-canvas px-5 pb-16 pt-10 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h1 className="font-display text-4xl font-bold uppercase leading-none text-ink sm:text-6xl">
            Blog
          </h1>
          <p className="mt-4 max-w-xl text-ink-soft">
            How the store works, what it sells, and how it is priced.
          </p>

          {/* Tag tabs and search. Both are plain links and a plain form, so the
              page needs no client JavaScript to filter. */}
          <div className="mt-8 flex flex-col gap-4 border-b border-ink/15 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <nav aria-label="Filter by topic" className="-mx-1 overflow-x-auto">
              <ul className="flex gap-1 px-1">
                <li className="shrink-0">
                  <Link
                    href={href({ tag: '' })}
                    aria-current={activeTag ? undefined : 'page'}
                    className={`inline-flex min-h-[44px] items-center border-b-2 px-3 font-mono text-xs font-semibold uppercase tracking-[0.12em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                      activeTag ? 'border-transparent text-ink-soft' : 'border-primary text-ink'
                    }`}
                  >
                    All <span className="ml-1.5 text-ink-soft">{total}</span>
                  </Link>
                </li>
                {tags.map(({ tag: name, count }) => {
                  const active = activeTag.toLowerCase() === name.toLowerCase();
                  return (
                    <li key={name} className="shrink-0">
                      <Link
                        href={href({ tag: active ? '' : name })}
                        aria-current={active ? 'page' : undefined}
                        className={`inline-flex min-h-[44px] items-center border-b-2 px-3 font-mono text-xs font-semibold uppercase tracking-[0.12em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                          active ? 'border-primary text-ink' : 'border-transparent text-ink-soft'
                        }`}
                      >
                        {name} <span className="ml-1.5 text-ink-soft">{count}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <form action="/blog" role="search" className="w-full sm:w-64">
              <label htmlFor="blog-search" className="sr-only">
                Search the blog
              </label>
              {activeTag ? <input type="hidden" name="tag" value={activeTag} /> : null}
              <div className="flex items-stretch border border-ink/20 focus-within:border-primary">
                <input
                  id="blog-search"
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Search the blog"
                  autoComplete="off"
                  className="h-11 min-w-0 flex-1 bg-transparent px-3 font-mono text-xs uppercase tracking-[0.1em] text-ink placeholder:text-ink-soft focus:outline-none"
                />
                <button
                  type="submit"
                  className="h-11 shrink-0 bg-ink px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Find
                </button>
              </div>
            </form>
          </div>

          {filtering ? (
            <p className="mt-5 font-mono text-xs uppercase tracking-[0.15em] text-ink-soft">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'}
              {activeTag ? ` tagged ${activeTag}` : ''}
              {query ? ` matching “${query}”` : ''}
              {' · '}
              <Link href="/blog" className="underline decoration-2 underline-offset-4 hover:text-ink">
                Clear
              </Link>
            </p>
          ) : null}

          {posts.length === 0 ? (
            <p className="mt-12 text-ink-soft">
              No posts match that. Try a shorter word, or clear the filter.
            </p>
          ) : (
            <>
              <div className="mt-10">
                <PostCard post={featured} featured />
              </div>

              {rest.length > 0 ? (
                <div className="mt-12 grid gap-10 border-t border-ink/15 pt-10 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post) => (
                    <PostCard key={post.slug} post={post} />
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      </main>
      <Footer {...footer} />
    </>
  );
}
