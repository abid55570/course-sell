/**
 * The web app's only contact point with the API's order/payment pipeline
 * (api/routes/orders.js). Every call is guarded: a downed API, a bad
 * response body, or a thrown network error all resolve to a typed
 * `{ ok: false, error }` instead of an unhandled rejection reaching the
 * caller, so a page built on this client always has something honest to
 * show the buyer instead of a blank screen or a console-only crash.
 */
import { PUBLIC_API_BASE } from './env';

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type CreateOrderInput = {
  course_slug: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
};

/**
 * Which payment path the server is offering. 'razorpay' whenever real keys
 * exist; 'whatsapp' is the interim manual path while onboarding is blocked;
 * 'dev' is the local auto-complete.
 */
export type PaymentMode = 'razorpay' | 'whatsapp' | 'dev';

export type WhatsappCheckout = {
  number: string;
  link: string;
  message: string;
};

export type CreateOrderResponse = {
  order_id: string;
  amount: number;
  currency: string;
  product: { type: string; title: string };
  payment_mode?: PaymentMode;
  whatsapp?: WhatsappCheckout | null;
  razorpay: {
    configured: boolean;
    key_id: string;
    order_id: string;
    amount_paise: number;
    prefill: { name: string; email: string; contact: string };
    name: string;
  };
};

export type VerifyOrderInput = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature?: string;
};

export type VerifyOrderResponse = {
  ok: true;
  status: string;
  product_type: string;
  license_key?: string;
};

export type OrderStatusResponse = {
  order_id: string;
  status: 'pending' | 'submitted' | 'completed' | 'cancelled';
  amount: number;
  buyer_name: string;
  buyer_email: string;
  product_type: string;
  created_at: string;
  course_title?: string | null;
  course_slug?: string | null;
  drive_link?: string | null;
  pdf_file?: string | null;
};

const UNREACHABLE_MESSAGE =
  "Couldn't reach the order server. Check your connection and try again.";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(`${PUBLIC_API_BASE}${path}`, init);
  } catch {
    return { ok: false, error: UNREACHABLE_MESSAGE };
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // Non-JSON or empty body; fall through and use the status code.
  }

  if (!res.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body && typeof (body as { error: unknown }).error === 'string'
        ? (body as { error: string }).error
        : `The order server returned an error (${res.status}).`;
    return { ok: false, error: message };
  }

  return { ok: true, data: body as T };
}

export function createOrder(input: CreateOrderInput): Promise<ApiResult<CreateOrderResponse>> {
  return apiFetch<CreateOrderResponse>('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function verifyOrder(orderId: string, payload: VerifyOrderInput): Promise<ApiResult<VerifyOrderResponse>> {
  return apiFetch<VerifyOrderResponse>(`/api/orders/${encodeURIComponent(orderId)}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/**
 * The buyer reporting a payment reference on the WhatsApp path.
 *
 * This does not deliver anything — it moves the order to `submitted` for an
 * admin to verify against the actual conversation. See
 * api/services/manual-payment.js.
 */
export function submitPaymentReference(
  orderId: string,
  reference: string
): Promise<ApiResult<{ ok: true; status: string }>> {
  return apiFetch<{ ok: true; status: string }>(
    `/api/orders/${encodeURIComponent(orderId)}/reference`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference }),
    }
  );
}

export function getOrder(orderId: string): Promise<ApiResult<OrderStatusResponse>> {
  return apiFetch<OrderStatusResponse>(`/api/orders/${encodeURIComponent(orderId)}`);
}

export { getPaymentMode } from './payment-mode';
