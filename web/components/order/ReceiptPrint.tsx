'use client';

import { useEffect, useRef, useState } from 'react';
import { formatRupees } from '@/lib/format';

/**
 * The order receipt, printed.
 *
 * Adapted from the thermal-printer animation the owner supplied. What was kept
 * is the part that matters: paper rolling out of a slot on a 3D transform,
 * settling with an ease-out. What was dropped, and why:
 *
 * - The Web Audio printer sound. Browsers block audio without a user gesture,
 *   so it would not play on arrival anyway, and a store that makes noise at
 *   someone who has just paid is a store they remember for the wrong reason.
 * - The mode switcher, sample presets and customizer drawer. Demo controls.
 * - A 60-line clip-path polygon for the serrated edge. The site already draws
 *   tear edges with a radial-gradient mask; reusing it keeps one technique.
 *
 * The receipt shows the real order. Nothing here is decorative text.
 */
export default function ReceiptPrint({
  productTitle,
  amount,
  orderId,
  buyerEmail,
  paidAt,
}: {
  productTitle: string;
  amount: number;
  orderId: string;
  buyerEmail?: string;
  paidAt?: string;
}) {
  const [printed, setPrinted] = useState(false);
  const paperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reduced motion gets the receipt already printed. The receipt is the
    // confirmation, so it must never be withheld pending an animation.
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPrinted(true);
      return;
    }
    // One frame's delay so the browser paints the retracted state first,
    // otherwise the transition has nothing to animate from.
    const id = requestAnimationFrame(() => setPrinted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const date = paidAt ? new Date(paidAt) : new Date();
  const stamp = date
    .toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    })
    .toUpperCase();

  return (
    <div className="receipt-stage" aria-hidden="true">
      {/* The slot the paper emerges from. */}
      <div className="receipt-slot" />

      <div ref={paperRef} className={`receipt-paper${printed ? ' is-printed' : ''}`}>
        <div className="receipt-body">
          <p className="receipt-head">Dropdesk</p>
          <p className="receipt-sub">Digital products &middot; Instant download</p>

          <div className="receipt-rule" />

          <p className="receipt-line">
            <span>{productTitle}</span>
          </p>

          <div className="receipt-rule" />

          <p className="receipt-row">
            <span>Paid</span>
            <span className="receipt-amount">{formatRupees(amount)}</span>
          </p>
          <p className="receipt-row receipt-meta">
            <span>Order</span>
            <span>{orderId}</span>
          </p>
          {buyerEmail ? (
            <p className="receipt-row receipt-meta">
              <span>Sent to</span>
              <span className="receipt-trunc">{buyerEmail}</span>
            </p>
          ) : null}
          <p className="receipt-row receipt-meta">
            <span>Date</span>
            <span>{stamp}</span>
          </p>

          <div className="receipt-rule" />
          <p className="receipt-stamp">Payment received</p>
        </div>

        {/* Serrated edge, drawn with the same mask the rest of the site uses. */}
        <div className="receipt-tear" />
      </div>
    </div>
  );
}
