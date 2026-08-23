'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { createOrder, verifyOrder, type CreateOrderResponse } from '@/lib/orders';
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

type Phase = 'form' | 'submitting' | 'dev-completing' | 'loading-razorpay' | 'awaiting-payment' | 'verifying' | 'error';

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
  slug,
  title,
  price,
}: {
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

  const canRetry = phase === 'error' && !chargeUncertain;
  const canSubmit = buyerName.trim().length > 0 && isEmailShaped(buyerEmail) && (phase === 'form' || canRetry);
  const busy = (phase !== 'form' && phase !== 'error') || chargeUncertain;

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
      setError(`Could not finish the order: ${result.error}. No real payment is involved in this test mode. Select Pay again to retry.`);
      return;
    }
    router.push(`/order/${target.order_id}`);
  }

  function openRazorpayCheckout(target: CreateOrderResponse) {
    if (!window.Razorpay) {
      setChargeUncertain(false);
      setPhase('error');
      setError('The payment window is not ready yet. Select Pay again to retry, or refresh the page.');
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
          setError('You closed the payment window before finishing. Nothing was charged. Select Pay again when you are ready.');
        },
      },
    });
    rz.on('payment.failed', (response) => {
      setChargeUncertain(false);
      setPhase('error');
      setError(
        `Payment failed: ${response.error?.description || 'the bank or card declined it.'} You were not charged for this attempt. Select Pay again to retry.`
      );
    });
    setPhase('awaiting-payment');
    rz.open();
  }

  /** Starts (or restarts) the payment step for an order that already exists. */
  async function startPayment(target: CreateOrderResponse) {
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
            setError('The payment window did not load. This is often an ad blocker or a network issue. Select Pay again to retry, or refresh the page.');
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
            Complete your payment in the window that opened. If you closed it by mistake, select Pay again below.
          </p>
        ) : null}
        {phase === 'verifying' ? (
          <p className="text-sm text-ink-soft" role="status">
            Payment received — confirming your order…
          </p>
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
        ) : (
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-lg bg-primary px-6 py-4 text-center text-sm font-semibold uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            {phase === 'error' ? `Pay ${formatRupees(price)} again` : `Pay ${formatRupees(price)}`}
          </button>
        )}
      </form>
    </div>
  );
}
