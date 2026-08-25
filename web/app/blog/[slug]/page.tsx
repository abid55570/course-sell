import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { listPosts, getPost, formatPostDate } from '@/lib/blog';
import { listProducts } from '@/lib/catalog';
import ProductCard from '@/components/product/ProductCard';
import Footer from '@/components/landing/Footer';
import ReadingPath, { type PathSection } from '@/components/blog/ReadingPath';
import { getFooterData } from '@/lib/catalog/footer-data';

export function generateStaticParams() {
  return listPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: 'Not found | Dropdesk' };

  return {
    title: `${post.title} | Dropdesk`,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: 'article',
      publishedTime: post.published,
      images: post.image ? [{ url: post.image.url, alt: post.image.alt }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const footer = await getFooterData();
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  // Stable ids so the path can observe them and so #anchors are shareable.
  const slugify = (value: string) =>
    value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
  const sections: PathSection[] = post.body
    .filter((s) => Boolean(s.heading))
    .map((s) => ({ id: slugify(s.heading as string), heading: s.heading as string }));

  // One catalog read, indexed by slug, rather than an awaited lookup per
  // related product.
  const bySlug = new Map((await listProducts()).map((p) => [p.slug, p]));
  const related = (post.relatedProducts ?? [])
    .map((s) => bySlug.get(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <>
      <main className="bg-canvas px-5 pb-16 pt-10 sm:px-10 lg:px-12">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <article className="min-w-0 max-w-2xl">
          <Link
            href="/blog"
            className="inline-flex min-h-[44px] items-center font-mono text-[11px] uppercase tracking-[0.15em] text-ink-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            ← All posts
          </Link>

          <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-soft">
            <time dateTime={post.published}>{formatPostDate(post.published)}</time>
            <span aria-hidden="true">·</span>
            <span>{post.readMinutes} min read</span>
          </p>

          <h1 className="mt-3 font-display text-4xl font-bold uppercase leading-[0.95] text-ink sm:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg text-ink-soft">{post.summary}</p>

          {post.image ? (
            <figure className="mt-8">
              <div className="relative aspect-[16/9] w-full overflow-hidden border border-ink/15">
                <Image
                  src={post.image.url}
                  alt={post.image.alt}
                  fill
                  sizes="(min-width: 1024px) 42rem, 100vw"
                  priority
                  className="object-cover"
                />
              </div>
              {/* Unsplash's licence requires crediting both the photographer
                  and Unsplash, each linked. This is not decorative. */}
              <figcaption className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                Photo by{' '}
                <a
                  href={post.image.credit.photographerUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="underline decoration-1 underline-offset-2 hover:text-ink"
                >
                  {post.image.credit.photographer}
                </a>{' '}
                on{' '}
                <a
                  href={post.image.credit.photoUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="underline decoration-1 underline-offset-2 hover:text-ink"
                >
                  Unsplash
                </a>
              </figcaption>
            </figure>
          ) : null}

          <div className="mt-10 space-y-8 border-t border-ink/15 pt-10">
            {post.body.map((section, i) => (
              <section
                key={section.heading ?? `s${i}`}
                id={section.heading ? slugify(section.heading) : undefined}
                className="scroll-mt-24"
              >
                {section.heading ? (
                  <h2 className="font-display text-2xl font-bold uppercase leading-tight text-ink">
                    {section.heading}
                  </h2>
                ) : null}
                <div className={section.heading ? 'mt-3 space-y-4' : 'space-y-4'}>
                  {section.paragraphs.map((p, j) => (
                    <p key={j} className="text-ink">
                      {p}
                    </p>
                  ))}
                </div>
                {section.bullets && section.bullets.length > 0 ? (
                  <ul className="mt-4 space-y-2 border-l-2 border-ink/15 pl-5">
                    {section.bullets.map((b, j) => (
                      <li key={j} className="text-ink">
                        {b}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          {related.length > 0 ? (
            <section className="mt-12 border-t border-ink/15 pt-8">
              <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
                Mentioned in this post
              </h2>
              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {related.map((product) => (
                  <ProductCard key={product.slug} product={product} />
                ))}
              </div>
            </section>
          ) : null}
        </article>

        <aside className="min-w-0">
          <ReadingPath sections={sections} />
        </aside>
        </div>
      </main>
      <Footer {...footer} />
    </>
  );
}
