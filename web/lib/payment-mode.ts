/**
 * Reads the API's payment mode flag.
 *
 * Cached on the edge with a short revalidation window (5 minutes). A
 * conservative 'whatsapp' fallback means the storefront never claims a payment
 * path that isn't running if the API is unreachable.
 */

import { PUBLIC_API_BASE } from './env';

export type PaymentMode = 'razorpay' | 'whatsapp' | 'dev';

async function fetchPaymentMode(): Promise<PaymentMode> {
  try {
    const res = await fetch(`${PUBLIC_API_BASE}/api/orders/payment-mode`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return 'whatsapp';
    const body = (await res.json()) as { payment_mode?: string };
    if (body.payment_mode === 'razorpay' || body.payment_mode === 'dev') return body.payment_mode;
    return 'whatsapp';
  } catch {
    return 'whatsapp';
  }
}

let cached: { mode: PaymentMode; ts: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

/**
 * Synchronous accessor — safe in server components because the first call
 * warms the cache from the page-level async read above.
 */
export function getPaymentMode(mode: PaymentMode): PaymentMode {
  return mode;
}

/**
 * Async accessor for the page-level `await`. Returns the current mode,
 * revalidating only when the cache has expired.
 */
export async function readPaymentMode(): Promise<PaymentMode> {
  if (cached && Date.now() - cached.ts < TTL_MS) return cached.mode;
  const mode = await fetchPaymentMode();
  cached = { mode, ts: Date.now() };
  return mode;
}
