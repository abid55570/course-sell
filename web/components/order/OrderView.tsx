'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getOrder, type OrderStatusResponse } from '@/lib/orders';
import { formatRupees } from '@/lib/format';
import { SUPPORT_EMAIL } from '@/lib/support';
import ReceiptPrint from '@/components/order/ReceiptPrint';
import Footer from '@/components/landing/Footer';
import type { FooterData } from '@/lib/catalog/footer-data';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'loaded'; order: OrderStatusResponse };

function Shell({ children, footer }: { children: React.ReactNode; footer: FooterData }) {
  return (
    <main className="min-h-[70vh] bg-canvas">
      {/* Padding lives on this inner wrapper, not on <main>, so it never
          stacks with Footer's own horizontal padding below (Footer is an
          unpadded direct child of <main>, same as every other route). */}
      <div className="px-5 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-lg text-center">{children}</div>
      </div>
      <div className="mt-16">
        <Footer {...footer} />
      </div>
    </main>
  );
}

/**
 * The interactive half of /order/[id]: it polls the API for order status, so it
 * is a client component. The footer below it is not — it needs catalog data the
 * client has no way to read — so the server page above passes that in.
 */
export default function OrderView({ footer }: { footer: FooterData }) {
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  // Fetch-on-mount, React's own documented pattern for synchronizing with an
  // external system (https://react.dev/learn/synchronizing-with-effects):
  // the effect only starts the request and ignores a stale response after
  // unmount/orderId-change; it never sets state synchronously itself. The
  // initial useState above already starts in the 'loading' kind, and the
  // retry button resets to 'loading' from its own click handler, not here.
  useEffect(() => {
    let ignore = false;
    getOrder(orderId).then((result) => {
      if (ignore) return;
      if (!result.ok) {
        setState({ kind: 'error', message: result.error });
      } else {
        setState({ kind: 'loaded', order: result.data });
      }
    });
    return () => {
      ignore = true;
    };
  }, [orderId]);

  function retry() {
    setState({ kind: 'loading' });
    getOrder(orderId).then((result) => {
      if (!result.ok) {
        setState({ kind: 'error', message: result.error });
      } else {
        setState({ kind: 'loaded', order: result.data });
      }
    });
  }

  if (state.kind === 'loading') {
    return (
      <Shell footer={footer}>
        <p className="text-ink-soft" role="status">
          Checking your order…
        </p>
      </Shell>
    );
  }

  if (state.kind === 'error') {
    const isNotFound = state.message === 'not found';
    return (
      <Shell footer={footer}>
        <h1 className="font-display text-2xl font-bold text-ink">
          {isNotFound ? 'Order not found' : "Couldn't check this order"}
        </h1>
        <p className="mt-3 text-ink-soft">
          {isNotFound ? `No order matches ID ${orderId}. Double-check the link you followed.` : state.message}
        </p>
        {!isNotFound ? (
          <p className="mt-3 text-sm text-ink-soft">
            If you just paid, your payment may still have gone through even though this page can&rsquo;t confirm it
            right now. Don&rsquo;t pay again — email {SUPPORT_EMAIL} with order ID <strong>{orderId}</strong> and
            we&rsquo;ll sort it out.
          </p>
        ) : null}
        <button
          type="button"
          onClick={retry}
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground"
        >
          Try again
        </button>
      </Shell>
    );
  }

  const { order } = state;
  const title = order.course_title || 'Your order';
  const isEmailProduct = ['course', 'catalog'].includes(order.product_type);

  return (
    <Shell footer={footer}>
      {order.status === 'completed' ? (
        <>
          {/* The receipt is decorative and aria-hidden, so the confirmation
              itself must live outside it. Without this, a screen-reader user
              reaches this page after paying and is told nothing at all. */}
          <p className="sr-only" role="status">
            Your payment for {title} went through. Order {order.order_id}.
          </p>

          <ReceiptPrint
            productTitle={title}
            amount={Number(order.amount)}
            orderId={order.order_id}
            buyerEmail={order.buyer_email}
          />

          <span className="mt-8 inline-block bg-proof/15 px-3 py-1 text-xs font-semibold text-proof">
            Payment confirmed
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold text-ink sm:text-3xl">{title}</h1>

          <p className="mt-3 text-ink-soft" role="status">
            {isEmailProduct && order.delivery_status === 'delivered' ? (
              <>Your Google Drive access link has been emailed to <strong>{order.buyer_email}</strong>. Check your inbox and spam folder.</>
            ) : isEmailProduct && ['pending', 'sending'].includes(order.delivery_status || '') ? (
              <>Your payment is confirmed. We are sending your Google Drive access link to <strong>{order.buyer_email}</strong>.</>
            ) : isEmailProduct && order.delivery_status === 'failed' ? (
              <>Your payment is confirmed, but your access email has not been sent successfully yet. We will retry automatically where possible. Contact support if it remains delayed.</>
            ) : (
              <>Content is provided by email. We cannot confirm email delivery for this order here. Check your inbox or contact support with your order ID.</>
            )}
          </p>
          <p className="mt-4 text-sm text-ink-soft">
            Need help? Email <a href={`mailto:${SUPPORT_EMAIL}?subject=Order%20${order.order_id}`} className="underline">{SUPPORT_EMAIL}</a>. You will not be charged again.
          </p>
          {isEmailProduct && order.delivery_status !== 'delivered' ? (
            <button type="button" onClick={retry} className="mt-5 border border-ink/20 px-5 py-3 text-sm">Check email status</button>
          ) : null}
        </>
      ) : order.status === 'pending' || order.status === 'submitted' ? (
        <>
          <span className="mb-3 inline-block rounded-full bg-urgent/15 px-3 py-1 text-xs font-semibold text-urgent">
            Payment not confirmed yet
          </span>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
          <p className="mt-3 text-ink-soft">
            We&rsquo;re waiting for payment confirmation for order <strong>{order.order_id}</strong>.{' '}
            If you paid by UPI, return to the checkout page to paste your payment reference.
            If you paid by card or UPI through Razorpay, it usually confirms within a few minutes — select Check again to refresh.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={retry}
              className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground"
            >
              Check again
            </button>
            <Link
              href={`/order/${order.order_id}`}
              className="inline-flex min-h-[44px] items-center rounded-lg border border-ink/20 bg-canvas px-5 py-3 font-mono text-xs font-semibold uppercase tracking-wide text-ink"
            >
              Save order link
            </Link>
          </div>
        </>
      ) : (
        <>
          <span className="mb-3 inline-block rounded-full bg-destructive/15 px-3 py-1 text-xs font-semibold text-destructive">
            Order cancelled
          </span>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
          <p className="mt-3 text-ink-soft">
            This order was cancelled and nothing was delivered. Email {SUPPORT_EMAIL} if that&rsquo;s unexpected.
          </p>
        </>
      )}

      <p className="mt-8 text-xs text-ink-soft">
        Order ID <strong>{order.order_id}</strong> · {formatRupees(order.amount)}
      </p>
      <p className="mt-4">
        <Link href="/products" className="text-sm text-ink-soft underline underline-offset-2">
          Back to the store
        </Link>
      </p>
    </Shell>
  );
}
