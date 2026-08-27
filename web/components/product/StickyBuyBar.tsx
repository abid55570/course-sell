'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { formatRupees } from '@/lib/format';

export default function StickyBuyBar({
  slug,
  title,
  price,
  paymentMode,
  className = '',
}: {
  slug: string;
  title: string;
  price: number;
  paymentMode: 'razorpay' | 'whatsapp' | 'dev';
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const hero = document.querySelector('section');
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0 },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  const label = paymentMode === 'whatsapp'
    ? `Buy — ${formatRupees(price)} · UPI`
    : `Buy for ${formatRupees(price)}`;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 border-t border-ink/15 bg-canvas/95 backdrop-blur sm:hidden ${className}`}
    >
      <div className="flex items-center justify-between gap-3 px-5 py-3">
        <span className="font-mono text-sm font-bold text-ink">{formatRupees(price)}</span>
        <Link
          href={`/checkout?slug=${encodeURIComponent(slug)}`}
          className="inline-block min-h-[44px] rounded-lg bg-primary px-6 py-2.5 text-center text-sm font-semibold uppercase tracking-wide text-white"
          aria-label={`${label}: ${title}`}
        >
          {label}
        </Link>
      </div>
    </div>
  );
}
