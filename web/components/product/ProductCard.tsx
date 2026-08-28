import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/catalog';
import { formatRupees } from '@/lib/format';
import CoverFallback from './CoverFallback';

export default function ProductCard({ product }: { product: Product }) {
  const cover = product.gallery.find((g) => g.role === 'cover') ?? product.gallery[0];
  const title = product.shortTitle ?? product.title;
  // 75 of 84 products have no cover art, so their tile IS the title set large.
  // Repeating it in the body below printed every such card's name twice.
  const titleShownInCover = !cover;
  const formatLine = [
    product.format,
    product.fileCount ? `${product.fileCount} ${product.fileCount === 1 ? 'file' : 'files'}` : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(' · ');

  return (
    <Link
      href={`/p/${product.slug}`}
      className="group flex min-h-[44px] flex-col overflow-hidden bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      <div className="relative aspect-[3/4] w-full bg-ink">
        {cover ? (
          <Image
            src={`/products/${product.slug}/${cover.filename}`}
            alt={cover.alt}
            fill
            sizes="(min-width: 1024px) 260px, (min-width: 640px) 33vw, 50vw"
            className="object-cover object-top"
          />
        ) : (
          <CoverFallback title={title} kicker={product.category.label} accentHex={product.accent.hex} />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 border-t-2 p-4" style={{ borderColor: product.accent.hex }}>
        {product.audience ? (
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-white/60">
            {product.audience}
          </span>
        ) : null}
        {titleShownInCover ? null : (
          <h3 className="font-display text-lg font-bold leading-tight text-white">{title}</h3>
        )}
        {formatLine ? <p className="font-mono text-xs text-white/60">{formatLine}</p> : null}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-display text-xl font-bold text-white">{formatRupees(product.price)}</span>
          <span className="font-mono text-xs font-semibold uppercase tracking-wide text-white/70 group-hover:text-white">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
