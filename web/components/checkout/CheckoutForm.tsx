'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { createOrder, verifyOrder, submitPaymentReference, type CreateOrderResponse } from '@/lib/orders';
import { formatRupees } from '@/lib/format';

type RazorpaySuccessPayload = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayFailurePayload = {
  error?: { description?: string; reason?: string };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: 'payment.failed', handler: (response: RazorpayFailurePayload) => void) => void;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  handler: (response: RazorpaySuccessPayload) => void;
  modal?: { ondismiss?: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

type Phase =
  | 'form'
  | 'submitting'
  | 'dev-completing'
  | 'loading-razorpay'
  | 'awaiting-payment'
  | 'verifying'
  | 'whatsapp'
  | 'reporting'
  | 'error';

function isEmailShaped(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Turns a raw API error string into something a buyer can act on. */
function describeCreateError(message: string): string {
  if (/not found/i.test(message)) {
    return "This product hasn't been set up for sale yet. Contact support instead of paying. Nothing has been charged.";
  }
  return message;
}

export default function CheckoutForm({
  paymentMode,
  slug,
  title,
  price,
}: {
  paymentMode: 'razorpay' | 'whatsapp' | 'dev';
  slug: string;
  title: string;
  price: number;
}) {
  const router = useRouter();
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [phase, setPhase] = useState<Phase>('form');
  const [error, setError] = useState<string | null>(null);
  const [loadRazorpayScript, setLoadRazorpayScript] = useState(false);
  const [scriptAttempt, setScriptAttempt] = useState(0);
  // Order state lives here, not just in a ref, because a retry after payment
  // succeeds-on-Razorpay-but-fails-to-verify must render a link back to this
  // exact order instead of a working submit button.
  const [order, setOrder] = useState<CreateOrderResponse | null>(null);
  // True only once Razorpay itself has told us a payment went through and our
  // own verify call then failed. In that state the charge may already be
  // real, so the form must never let another click start a second payment —
  // that would risk charging the buyer twice for one product. It clears only
  // when a brand-new order is created from a clean form.
  const [chargeUncertain, setChargeUncertain] = useState(false);
  // The interim WhatsApp path: the buyer pays in chat, then types the payment
  // reference here. Nothing is delivered on that alone — see
  // api/services/manual-payment.js.
  const [reference, setReference] = useState('');
  const [referenceError, setReferenceError] = useState<string | null>(null);

  const canRetry = phase === 'error' && !chargeUncertain;
  const canSubmit = buyerName.trim().length > 0 && isEmailShaped(buyerEmail) && (phase === 'form' || canRetry);
  const busy = (phase !== 'form' && phase !== 'error') || chargeUncertain;

  function orderUrl(): string {
    if (!order) return '/';
    return `/order/${order.order_id}`;
  }

  async function completeWithoutLiveKeys(target: CreateOrderResponse) {
    setPhase('dev-completing');
    const result = await verifyOrder(target.order_id, {
      razorpay_order_id: target.razorpay.order_id,
      razorpay_payment_id: `dev_${Date.now()}`,
      razorpay_signature: '',
    });
    if (!result.ok) {
      // No real Razorpay keys are configured, so no real money moved here.
      // Retrying re-attempts verification on this same order.
      setChargeUncertain(false);
      setPhase('error');
      setError(`Could not finish the order: ${result.error}. No real payment is involved in this test mode. Select Continue to payment to retry.`);
      return;
    }
    router.push(`/order/${target.order_id}`);
  }

  async function reportReference() {
    if (!order) return;
    const trimmed = reference.trim();
    if (trimmed.length < 4) {
      setReferenceError('Enter the reference from your UPI app or bank — usually 12 digits.');
      return;
    }
    if (trimmed.length > 64) {
      setReferenceError('That looks too long — paste just the reference/UTR number, usually 12 digits.');
      return;
    }
    setReferenceError(null);
    setPhase('reporting');
    const result = await submitPaymentReference(order.order_id, trimmed);
    if (!result.ok) {
      setPhase('whatsapp');
      setReferenceError(result.error);
      return;
    }
    router.push(`/order/${order.order_id}`);
  }

  function openRazorpayCheckout(target: CreateOrderResponse) {
    if (!window.Razorpay) {
      setChargeUncertain(false);
      setPhase('error');
      setError('The payment window is not ready yet. Select Continue to payment again to retry, or refresh the page.');
      return;
    }
    const rz = new window.Razorpay({
      key: target.razorpay.key_id,
      amount: target.razorpay.amount_paise,
      currency: target.currency,
      order_id: target.razorpay.order_id,
      name: target.razorpay.name,
      description: target.product.title,
      prefill: target.razorpay.prefill,
      handler: async (response) => {
        setPhase('verifying');
        const result = await verifyOrder(target.order_id, response);
        if (!result.ok) {
          // Razorpay already confirmed this charge on its side. A verify
          // failure here is our side falling behind, not the payment
          // failing, so offering "pay again" could charge the buyer twice.
          // Send them to the order-status page instead, which polls and
          // also gets completed independently by the Razorpay webhook.
          setChargeUncertain(true);
          setPhase('error');
          setError(
            `Razorpay confirmed this payment, but we could not verify it on our side: ${result.error}. Do not pay again. Check your order status below with order ID ${target.order_id}, or email support with that ID if it still shows unpaid.`
          );
          return;
        }
        router.push(`/order/${target.order_id}`);
      },
      modal: {
        ondismiss: () => {
          setChargeUncertain(false);
          setPhase('error');
          setError('You closed the payment window before finishing. Nothing was charged. Select Continue to payment again when you are ready.');
        },
      },
    });
    rz.on('payment.failed', (response) => {
      setChargeUncertain(false);
      setPhase('error');
      setError(
        `Payment failed: ${response.error?.description || 'the bank or card declined it.'} You were not charged for this attempt. Select Continue to payment to retry.`
      );
    });
    setPhase('awaiting-payment');
    rz.open();
  }

  /** Starts (or restarts) the payment step for an order that already exists. */
  async function startPayment(target: CreateOrderResponse) {
    // The server decides which path is on offer, so this never has to know
    // whether Razorpay is live — it just follows what the order says.
    if (target.payment_mode === 'whatsapp' && target.whatsapp) {
      setPhase('whatsapp');
      return;
    }
    if (!target.razorpay.configured) {
      await completeWithoutLiveKeys(target);
      return;
    }
    if (window.Razorpay) {
      openRazorpayCheckout(target);
      return;
    }
    setPhase('loading-razorpay');
    setScriptAttempt((n) => n + 1);
    setLoadRazorpayScript(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);

    if (order) {
      // An order already exists for this attempt (it may or may not have
      // been paid). Reusing it, instead of creating another, is what keeps
      // a retry from ever producing two orders — or two charges — for one
      // purchase.
      await startPayment(order);
      return;
    }

    setPhase('submitting');
    const result = await createOrder({
      course_slug: slug,
      buyer_name: buyerName.trim(),
      buyer_email: buyerEmail.trim(),
    });

    if (!result.ok) {
      // Nothing was created on the server, so a retry from here is a clean,
      // ordinary resubmission.
      setChargeUncertain(false);
      setPhase('error');
      setError(describeCreateError(result.error));
      return;
    }

    setOrder(result.data);
    await startPayment(result.data);
  }

  return (
    <div>
      {loadRazorpayScript ? (
        <Script
          key={scriptAttempt}
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
          onLoad={() => {
            if (order) openRazorpayCheckout(order);
          }}
          onError={() => {
            setChargeUncertain(false);
            setPhase('error');
            setError('The payment window did not load. This is often an ad blocker or a network issue. Select Continue to payment again to retry, or refresh the page.');
          }}
        />
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="buyer_name" className="block text-sm font-semibold text-ink">
            Full name
          </label>
          <input
            id="buyer_name"
            name="buyer_name"
            type="text"
            autoComplete="name"
            required
            disabled={busy}
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-4 py-3 text-ink outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="buyer_email" className="block text-sm font-semibold text-ink">
            Email
          </label>
          <input
            id="buyer_email"
            name="buyer_email"
            type="email"
            autoComplete="email"
            required
            disabled={busy}
            value={buyerEmail}
            onChange={(e) => setBuyerEmail(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-4 py-3 text-ink outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
            placeholder="you@example.com"
          />
          <p className="mt-1.5 text-xs text-ink-soft">
            Your download link and receipt for {title} go here, so double-check it.
          </p>
        </div>

        {error ? (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {phase === 'submitting' ? (
          <p className="text-sm text-ink-soft" role="status">
            Creating your order…
          </p>
        ) : null}
        {phase === 'loading-razorpay' ? (
          <p className="text-sm text-ink-soft" role="status">
            Loading the payment window…
          </p>
        ) : null}
        {phase === 'awaiting-payment' ? (
          <p className="text-sm text-ink-soft" role="status">
            Complete your payment in the window that opened. If you closed it by mistake, select Continue to payment again below.
          </p>
        ) : null}
        {phase === 'verifying' ? (
          <p className="text-sm text-ink-soft" role="status">
            Payment received — confirming your order…
          </p>
        ) : null}
        {(phase === 'whatsapp' || phase === 'reporting') && order ? (
          <div className="space-y-4 border border-ink/15 bg-canvas-2 p-5">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft">
                Step 1 &mdash; Pay by UPI transfer
              </p>
              <p className="mt-2 text-sm text-ink">
                Card payments aren&rsquo;t switched on yet. Send the amount by UPI to the
                details on the next screen, then paste your payment reference below.
              </p>
              <p className="mt-2 text-xs text-ink-soft">
                Nothing to retype — your name and email are already saved on this order.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <a
                  href={order.whatsapp?.link ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center bg-[#25D366] px-5 py-3 font-semibold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Message us to pay &rarr;
                </a>
                <Link
                  href={orderUrl()}
                  className="inline-flex min-h-[44px] items-center font-mono text-xs font-semibold uppercase tracking-wide text-primary underline underline-offset-4"
                >
                  Save this order link
                </Link>
              </div>
            </div>

            <div className="border-t border-dashed border-ink/25 pt-4">
              <label
                htmlFor="payment-reference"
                className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft"
              >
                Step 2 &mdash; Paste your payment reference
              </label>
              <p className="mt-2 text-sm text-ink-soft">
                After paying, your UPI app shows a reference or UTR number. Paste it here so we can
                match it to your order.
              </p>
              <input
                id="payment-reference"
                name="payment-reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                onKeyDown={(e) => {
                  // Enter after typing the reference is the natural habit; without
                  // this the outer form's guarded submit swallows it and nothing happens.
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (phase !== 'reporting') reportReference();
                  }
                }}
                disabled={phase === 'reporting'}
                autoComplete="off"
                inputMode="numeric"
                maxLength={64}
                placeholder="e.g. 512345678901"
                aria-describedby={referenceError ? 'payment-reference-error' : undefined}
                aria-invalid={referenceError ? true : undefined}
                className="mt-3 min-h-[44px] w-full border border-ink/25 bg-canvas px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {referenceError ? (
                <p id="payment-reference-error" role="alert" className="mt-2 text-sm text-primary">
                  {referenceError}
                </p>
              ) : null}
              <button
                type="button"
                onClick={reportReference}
                disabled={phase === 'reporting'}
                className="mt-3 min-h-[44px] w-full bg-primary px-5 py-3 font-semibold text-white disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {phase === 'reporting' ? 'Sending…' : "I've paid — submit reference"}
              </button>
              <p className="mt-3 text-xs text-ink-soft">
                We check every payment by hand before sending your files, so your download arrives
                once we&rsquo;ve confirmed it — usually within a few hours.
              </p>
            </div>
          </div>
        ) : null}

        {phase === 'dev-completing' ? (
          <div role="status" className="rounded-lg border border-urgent/30 bg-urgent/10 px-4 py-3 text-sm text-ink">
            Live payments aren&rsquo;t configured on this server yet, so this order is completing in test mode
            with no real charge. Finishing up…
          </div>
        ) : null}

        {chargeUncertain && order ? (
          <Link
            href={`/order/${order.order_id}`}
            className="block w-full rounded-lg bg-primary px-6 py-4 text-center text-sm font-semibold uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90"
          >
            Check order status
          </Link>
        ) : phase === 'whatsapp' || phase === 'reporting' ? (
          // The WhatsApp block below has its own two-step call to action. A
          // dead, greyed-out Pay button underneath it reads as something the
          // buyer is meant to press and cannot.
          null
        ) : (
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-lg bg-primary px-6 py-4 text-center text-sm font-semibold uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            {paymentMode === 'whatsapp' && phase === 'error'
              ? `Continue to payment — ${formatRupees(price)}`
              : paymentMode === 'whatsapp'
                ? `Continue to payment — ${formatRupees(price)}`
                : phase === 'error'
                  ? `Pay ${formatRupees(price)} again`
                  : `Pay ${formatRupees(price)}`}
          </button>
        )}
      </form>
    </div>
  );
}
