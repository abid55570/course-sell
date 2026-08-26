'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getOrder, type OrderStatusResponse } from '@/lib/orders';
import { formatRupees } from '@/lib/format';
import { SUPPORT_EMAIL } from '@/lib/support';
import { PUBLIC_API_BASE } from '@/lib/env';
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
  // course_title/drive_link/pdf_file only exist on the API response for
  // product_type 'course' (routes/orders.js GET /:orderId) -- video,
  // carousel and tool orders deliver differently (a render, a license key)
  // and never populate these fields, so this block stays scoped to courses.
  const isCourseOrder = order.product_type === 'course';
  // api/utils/template.js builds the same delivery email's PDF link as
  // `${SITE_URL}/api/orders/${order.order_id}/pdf` -- the real Express
  // route that checks payment + the send_pdf_in_email flag and streams the
  // file. order.pdf_file itself is just the storage path routes/admin.js
  // wrote to disk (`/uploads/pdfs/<filename>`, relative to the API's own
  // directory), not a URL the browser can fetch -- using it directly here
  // 404s. Route through the same endpoint the email uses instead, so the
  // two never disagree.
  const downloadLink = order.status === 'completed' && isCourseOrder
    ? order.drive_link || (order.pdf_file ? `${PUBLIC_API_BASE}/api/orders/${order.order_id}/pdf` : null)
    : null;
  const noFileAttachedYet = order.status === 'completed' && isCourseOrder && !downloadLink;

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

          {/* The page used to promise "we sent you a link" and then, directly
              beneath, admit no file was attached. A buyer who has just paid was
              told both at once. The message now matches what actually happened. */}
          {downloadLink ? (
            <>
              <p className="mt-3 text-ink-soft">
                We&rsquo;ve emailed <strong>{order.buyer_email}</strong> a download link as well. Check your spam
                folder if it has not arrived.
              </p>
              <a
                href={downloadLink}
                className="mt-6 inline-block bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Download now
              </a>
            </>
          ) : noFileAttachedYet ? (
            <>
              <p className="mt-3 text-ink-soft">
                Your payment went through and the order is recorded. The file is not ready to download
                yet, so it is not in your inbox either.
              </p>
              <p className="mt-4 border-l-2 border-primary bg-canvas-2 p-4 text-sm text-ink">
                Email <a className="font-semibold text-primary underline decoration-2 underline-offset-4" href={`mailto:${SUPPORT_EMAIL}?subject=Order%20${order.order_id}`}>{SUPPORT_EMAIL}</a>{' '}
                quoting order <strong>{order.order_id}</strong> and we will send it to you directly.
                You will not be charged again.
              </p>
            </>
          ) : (
            <p className="mt-3 text-ink-soft">
              We&rsquo;ve emailed <strong>{order.buyer_email}</strong> with everything you need. Check your spam
              folder if it has not arrived.
            </p>
          )}
        </>
      ) : order.status === 'pending' || order.status === 'submitted' ? (
        <>
          <span className="mb-3 inline-block rounded-full bg-urgent/15 px-3 py-1 text-xs font-semibold text-urgent">
            Payment not confirmed yet
          </span>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
          <p className="mt-3 text-ink-soft">
            If you just paid, this can take a few seconds to update. If it stays like this, email {SUPPORT_EMAIL}{' '}
            with order ID <strong>{order.order_id}</strong>. Do not pay a second time.
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground"
          >
            Check again
          </button>
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
