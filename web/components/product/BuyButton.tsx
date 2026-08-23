import Link from 'next/link';
import { formatRupees } from '@/lib/format';

/**
 * Sends the buyer to /checkout, which resolves `slug` against the courses
 * row api/scripts/seed-catalog.js seeds for this product/bundle (falling
 * back to a clear "not set up for sale yet" message if it hasn't been
 * seeded, rather than a dead checkout).
 */
export default function BuyButton({
  slug,
  title,
  price,
  className = '',
}: {
  slug: string;
  title: string;
  price: number;
  className?: string;
}) {
  return (
    <Link
      href={`/checkout?slug=${encodeURIComponent(slug)}`}
      className={`inline-block px-8 py-4 text-center text-sm font-semibold uppercase tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${className}`}
      aria-label={`Buy ${title} for ${formatRupees(price)}`}
    >
      Buy for {formatRupees(price)}
    </Link>
  );
}
