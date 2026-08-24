'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { formatRupees } from '@/lib/format';
import { useReducedMotion } from '@/lib/motion/reduced-motion';
import { buildReceiptPdf } from '@/lib/receipt-pdf';

/**
 * The order receipt, printed and tearable.
 *
 * Adapted from the thermal-printer animation the owner supplied. Kept: paper
 * rolling out of a slot on a 3D transform, and a cutter tear the buyer
 * triggers. Dropped, deliberately:
 *
 * - The Web Audio printer sound. Browsers block audio without a user gesture,
 *   so it would not play on arrival, and a store that makes noise at someone
 *   who just paid is remembered for the wrong reason. The tear is a real
 *   gesture, so a sound there would work; it is still omitted, because a
 *   confirmation page is not the place to be startled.
 * - Mode switcher, sample presets and customizer drawer. Demo controls.
 *
 * Everything on the receipt is the real order.
 */

type Phase = 'printing' | 'printed' | 'tearing' | 'torn';

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
  const [phase, setPhase] = useState<Phase>('printing');
  const reduced = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const tearButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Matches the 2500ms of .receipt-paper.is-feeding. The tear button stays
    // disabled and the status light stays busy for the whole feed, because
    // offering to tear paper that is still coming out is nonsense.
    //
    // Under reduced motion that animation is `none`, so the paper is already
    // fully out and there is nothing to wait for — the wait would only be 2.5
    // seconds of a disabled button.
    const id = window.setTimeout(
      () => setPhase((current) => (current === 'printing' ? 'printed' : current)),
      reduced ? 0 : 2500
    );
    return () => window.clearTimeout(id);
  }, [reduced]);

  const tear = useCallback(() => {
    if (phase !== 'printed') return;
    if (reduced) {
      setPhase('torn');
      return;
    }
    setPhase('tearing');
    // Matches .receipt-paper.is-tearing in globals.css.
    window.setTimeout(() => setPhase('torn'), 620);
  }, [phase, reduced]);

  const close = useCallback(() => {
    setPhase('printed');
    tearButtonRef.current?.focus();
  }, []);

  const date = paidAt ? new Date(paidAt) : new Date();
  const stamp = date
    .toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    })
    .toUpperCase();

  // A real file, not a print dialog. Built in the browser rather than fetched,
  // so it works from the confirmation page even while the API is unreachable —
  // which is exactly when a buyer most wants proof they paid.
  const download = useCallback(() => {
    const bytes = buildReceiptPdf({ productTitle, amount, orderId, buyerEmail, stamp });
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));

    const link = document.createElement('a');
    link.href = url;
    link.download = `Dropdesk-receipt-${orderId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    // Revoked on the next task, not immediately: revoking synchronously can
    // cancel the download in some browsers before it has read the blob.
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }, [productTitle, amount, orderId, buyerEmail, stamp]);

  // The torn receipt opens in a dialog, so it takes the keyboard with it.
  useEffect(() => {
    if (phase !== 'torn') return;

    const panel = dialogRef.current;
    panel?.querySelector<HTMLElement>('button, a[href]')?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const nodes = panel.querySelectorAll<HTMLElement>('button, a[href]');
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [phase, close]);

  const receipt = (
    <div className="receipt-body">
      <p className="receipt-head">Dropdesk</p>
      <p className="receipt-sub">Digital products &middot; Instant download</p>
      <div className="receipt-rule" />
      <p className="receipt-line">{productTitle}</p>
      <div className="receipt-rule" />
      <p className="receipt-row">
        <span>Paid</span>
        <span className="receipt-amount">{formatRupees(amount)}</span>
      </p>
      <p className="receipt-row receipt-meta"><span>Order</span><span>{orderId}</span></p>
      {buyerEmail ? (
        <p className="receipt-row receipt-meta">
          <span>Sent to</span><span className="receipt-trunc">{buyerEmail}</span>
        </p>
      ) : null}
      <p className="receipt-row receipt-meta"><span>Date</span><span>{stamp}</span></p>
      <div className="receipt-rule" />
      <p className="receipt-stamp">Payment received</p>
    </div>
  );

  return (
    <>
      <div className="receipt-stage">
        {/* The machine. Square and matte, in the store's ink, rather than the
            glossy metallic housing the source animation used: this has to sit
            on the same page as the register grounds and the ticket tears. */}
        <div className="receipt-printer" aria-hidden="true">
          <div className="receipt-printer-face">
            <span className="receipt-printer-mark">Dropdesk</span>
            <span
              className={`receipt-printer-led${phase === 'printing' ? ' is-busy' : ''}`}
            />
          </div>
          <div className="receipt-printer-slot">
            <span className="receipt-printer-lip" />
          </div>
          <span className="receipt-printer-foot receipt-printer-foot-l" />
          <span className="receipt-printer-foot receipt-printer-foot-r" />
        </div>

        <div
          className={`receipt-paper${phase === 'printing' ? ' is-feeding' : ''}${
            phase === 'tearing' ? ' is-tearing' : ''
          }${phase === 'torn' ? ' is-gone' : ''}`}
          aria-hidden="true"
        >
          {receipt}
          <div className="receipt-tear" />
        </div>

        {/* The blade flash the cutter leaves behind. */}
        {phase === 'tearing' ? <span className="receipt-blade" aria-hidden="true" /> : null}
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={download}
          className="inline-flex min-h-[44px] items-center bg-ink px-5 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Download receipt
        </button>
        <button
          ref={tearButtonRef}
          type="button"
          onClick={tear}
          disabled={phase !== 'printed'}
          className="inline-flex min-h-[44px] items-center border border-ink/25 px-5 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-ink disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {phase === 'printing' ? 'Printing…' : phase === 'torn' ? 'Torn off' : 'Tear it off'}
        </button>
      </div>

      {phase === 'torn' ? (
        <div className="receipt-modal">
          <button
            type="button"
            aria-label="Close receipt"
            tabIndex={-1}
            onClick={close}
            className="receipt-modal-backdrop"
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Receipt for order ${orderId}`}
            className="receipt-modal-panel"
          >
            <div className="receipt-torn">
              <div className="receipt-tear receipt-tear-top" aria-hidden="true" />
              {receipt}
              <div className="receipt-tear" aria-hidden="true" />
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={download}
                className="inline-flex min-h-[44px] items-center bg-primary px-5 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Download receipt
              </button>
              <button
                type="button"
                onClick={close}
                className="inline-flex min-h-[44px] items-center border border-white/30 px-5 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
