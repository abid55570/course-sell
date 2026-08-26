import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

/**
 * Regression coverage for the "checkout dead-ends after any failure" bug: a
 * failed attempt used to leave `phase` stuck at 'error' forever, with
 * `canSubmit` requiring `phase === 'form'` and nothing ever setting it back.
 * The button relabelled itself "Try again" while staying disabled.
 *
 * These tests exercise CheckoutForm's phase machine directly (mocking
 * lib/orders and window.Razorpay, since there is no live API or Razorpay key
 * in this environment) and assert two things for every failure path:
 *   1. The buyer always has a real, enabled way to continue.
 *   2. A retry never creates a second order once Razorpay has already told
 *      us a charge went through -- only a genuine "nothing happened yet"
 *      failure is allowed to call createOrder again.
 */

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

const createOrderMock = vi.fn();
const verifyOrderMock = vi.fn();
const submitReferenceMock = vi.fn();
vi.mock('@/lib/orders', () => ({
  createOrder: (...args: unknown[]) => createOrderMock(...args),
  verifyOrder: (...args: unknown[]) => verifyOrderMock(...args),
  submitPaymentReference: (...args: unknown[]) => submitReferenceMock(...args),
}));

import CheckoutForm from '@/components/checkout/CheckoutForm';

function fillForm() {
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Asha Verma' } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'asha@example.com' } });
}

function devOrder(overrides: Record<string, unknown> = {}) {
  return {
    order_id: 'ORD-DEV01',
    amount: 999,
    currency: 'INR',
    product: { type: 'course', title: 'Glow-Up OS' },
    razorpay: {
      configured: false,
      key_id: 'dev_bypass',
      order_id: 'order_dev_ORD-DEV01',
      amount_paise: 99900,
      prefill: { name: 'Asha Verma', email: 'asha@example.com', contact: '' },
      name: 'Dropdesk',
    },
    ...overrides,
  };
}

function liveOrder(overrides: Record<string, unknown> = {}) {
  return {
    order_id: 'ORD-LIVE01',
    amount: 999,
    currency: 'INR',
    product: { type: 'course', title: 'Glow-Up OS' },
    razorpay: {
      configured: true,
      key_id: 'rzp_test_key',
      order_id: 'order_live_1',
      amount_paise: 99900,
      prefill: { name: 'Asha Verma', email: 'asha@example.com', contact: '' },
      name: 'Dropdesk',
    },
    ...overrides,
  };
}

type RazorpayCall = {
  options: {
    modal?: { ondismiss?: () => void };
    handler: (r: unknown) => void | Promise<void>;
  };
  open: () => void;
  on: (event: string, cb: (r: unknown) => void) => void;
  triggerFailed: (payload: unknown) => void;
};

function installRazorpayMock() {
  const instances: RazorpayCall[] = [];
  // A real `function`, not an arrow function: vi.fn()'s mock implementation
  // is invoked with `new` by CheckoutForm, and arrow functions have no
  // [[Construct]] slot, so an arrow implementation throws "is not a
  // constructor" the moment the component calls `new window.Razorpay(...)`.
  const RazorpayCtor = vi.fn().mockImplementation(function (this: unknown, options: RazorpayCall['options']) {
    const failedHandlers: Array<(r: unknown) => void> = [];
    const instance: RazorpayCall = {
      options,
      open: vi.fn(),
      on: vi.fn((event: string, cb: (r: unknown) => void) => {
        if (event === 'payment.failed') failedHandlers.push(cb);
      }),
      triggerFailed: (payload: unknown) => failedHandlers.forEach((cb) => cb(payload)),
    };
    instances.push(instance);
    return instance;
  });
  (window as unknown as { Razorpay: unknown }).Razorpay = RazorpayCtor;
  return { RazorpayCtor, instances };
}

describe('CheckoutForm retry state machine', () => {
  beforeEach(() => {
    createOrderMock.mockReset();
    verifyOrderMock.mockReset();
    pushMock.mockReset();
    delete (window as unknown as { Razorpay?: unknown }).Razorpay;
  });

  it('starts with the submit button disabled until name and email are both valid', () => {
    render(<CheckoutForm slug="glow-up-os" title="Glow-Up OS" price={999} />);
    expect(screen.getByRole('button', { name: /pay/i })).toBeDisabled();
  });

  it('order creation itself fails: nothing was created, so retry is a clean resubmit', async () => {
    createOrderMock.mockResolvedValueOnce({ ok: false, error: 'product not found' });
    render(<CheckoutForm slug="glow-up-os" title="Glow-Up OS" price={999} />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /^pay/i }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/set up for sale/i);
    const retryButton = screen.getByRole('button', { name: /pay .*again/i });
    expect(retryButton).toBeEnabled();

    createOrderMock.mockResolvedValueOnce({ ok: true, data: devOrder() });
    verifyOrderMock.mockResolvedValueOnce({ ok: true, status: 'completed', product_type: 'course' });
    fireEvent.click(retryButton);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/order/ORD-DEV01'));
    expect(createOrderMock).toHaveBeenCalledTimes(2);
  });

  it('dev-bypass verify fails: retry reuses the same order and never calls createOrder again', async () => {
    createOrderMock.mockResolvedValueOnce({ ok: true, data: devOrder() });
    verifyOrderMock.mockResolvedValueOnce({ ok: false, error: 'network blip' });
    render(<CheckoutForm slug="glow-up-os" title="Glow-Up OS" price={999} />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /^pay/i }));

    await screen.findByRole('alert');
    expect(createOrderMock).toHaveBeenCalledTimes(1);

    verifyOrderMock.mockResolvedValueOnce({ ok: true, status: 'completed', product_type: 'course' });
    fireEvent.click(screen.getByRole('button', { name: /pay .*again/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/order/ORD-DEV01'));
    expect(createOrderMock).toHaveBeenCalledTimes(1);
    expect(verifyOrderMock).toHaveBeenCalledTimes(2);
  });

  it('buyer closes the Razorpay modal: retry reopens payment for the same order, no new order', async () => {
    const { RazorpayCtor, instances } = installRazorpayMock();
    createOrderMock.mockResolvedValueOnce({ ok: true, data: liveOrder() });
    render(<CheckoutForm slug="glow-up-os" title="Glow-Up OS" price={999} />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /^pay/i }));

    await waitFor(() => expect(RazorpayCtor).toHaveBeenCalledTimes(1));
    instances[0].options.modal?.ondismiss?.();

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/nothing was charged/i);
    const retryButton = screen.getByRole('button', { name: /pay .*again/i });
    expect(retryButton).toBeEnabled();

    fireEvent.click(retryButton);
    expect(createOrderMock).toHaveBeenCalledTimes(1);
    expect(RazorpayCtor).toHaveBeenCalledTimes(2);
  });

  it('card is declined: retry reopens payment for the same order, no new order', async () => {
    const { RazorpayCtor, instances } = installRazorpayMock();
    createOrderMock.mockResolvedValueOnce({ ok: true, data: liveOrder() });
    render(<CheckoutForm slug="glow-up-os" title="Glow-Up OS" price={999} />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /^pay/i }));

    await waitFor(() => expect(RazorpayCtor).toHaveBeenCalledTimes(1));
    instances[0].triggerFailed({ error: { description: 'card declined' } });

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/card declined/i);
    expect(alert.textContent).toMatch(/not charged/i);
    expect(screen.getByRole('button', { name: /pay .*again/i })).toBeEnabled();
    expect(createOrderMock).toHaveBeenCalledTimes(1);
  });

  it('Razorpay confirms payment but our verify call fails: no pay-again is offered, only a status link, and no second order can be created', async () => {
    const { RazorpayCtor, instances } = installRazorpayMock();
    createOrderMock.mockResolvedValueOnce({ ok: true, data: liveOrder() });
    verifyOrderMock.mockResolvedValueOnce({ ok: false, error: 'server hiccup' });
    render(<CheckoutForm slug="glow-up-os" title="Glow-Up OS" price={999} />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /^pay/i }));

    await waitFor(() => expect(RazorpayCtor).toHaveBeenCalledTimes(1));
    await instances[0].options.handler({
      razorpay_order_id: 'order_live_1',
      razorpay_payment_id: 'pay_123',
      razorpay_signature: 'sig',
    });

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/do not pay again/i);
    expect(alert.textContent).toContain('ORD-LIVE01');

    // The dangerous state: no submit button of any kind exists to trigger
    // another payment attempt -- only a navigational link to the order page.
    expect(screen.queryByRole('button', { name: /pay/i })).not.toBeInTheDocument();
    const link = screen.getByRole('link', { name: /check order status/i });
    expect(link).toHaveAttribute('href', '/order/ORD-LIVE01');
    expect(createOrderMock).toHaveBeenCalledTimes(1);
    expect(RazorpayCtor).toHaveBeenCalledTimes(1);
  });

  it('a real Razorpay payment that verifies cleanly redirects straight to the order page', async () => {
    const { RazorpayCtor, instances } = installRazorpayMock();
    createOrderMock.mockResolvedValueOnce({ ok: true, data: liveOrder() });
    verifyOrderMock.mockResolvedValueOnce({ ok: true, status: 'completed', product_type: 'course' });
    render(<CheckoutForm slug="glow-up-os" title="Glow-Up OS" price={999} />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /^pay/i }));

    await waitFor(() => expect(RazorpayCtor).toHaveBeenCalledTimes(1));
    await instances[0].options.handler({
      razorpay_order_id: 'order_live_1',
      razorpay_payment_id: 'pay_123',
      razorpay_signature: 'sig',
    });

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/order/ORD-LIVE01'));
  });
});

describe('the interim WhatsApp payment path', () => {
  const WHATSAPP_ORDER = {
    order_id: 'ORD-WA0001',
    amount: 299,
    currency: 'INR',
    product: { type: 'catalog', title: '30 Days of Focus' },
    payment_mode: 'whatsapp' as const,
    whatsapp: {
      number: '919559872757',
      link: 'https://wa.me/919559872757?text=Order%20ORD-WA0001',
      message: 'Order ORD-WA0001',
    },
    razorpay: {
      configured: false,
      key_id: 'dev_bypass',
      order_id: 'order_dev_ORD-WA0001',
      amount_paise: 29900,
      prefill: { name: '', email: '', contact: '' },
      name: 'Dropdesk',
    },
  };

  async function reachWhatsappStep() {
    createOrderMock.mockResolvedValue({ ok: true, data: WHATSAPP_ORDER });
    render(<CheckoutForm slug="30-days-of-focus" title="30 Days of Focus" price={299} />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /pay/i }));
    await screen.findByLabelText(/payment reference/i);
  }

  it('offers the WhatsApp link rather than auto-completing the order', async () => {
    await reachWhatsappStep();
    expect(screen.getByRole('link', { name: /message us to pay/i }))
      .toHaveAttribute('href', WHATSAPP_ORDER.whatsapp.link);
    // The old behaviour auto-completed the order with no payment taken. The
    // whole point of this path is that it must not.
    expect(verifyOrderMock).not.toHaveBeenCalled();
  });

  it('hides the Pay button once the WhatsApp step is showing', async () => {
    await reachWhatsappStep();
    // A dead, greyed-out Pay button under the WhatsApp block reads as
    // something the buyer is meant to press and cannot.
    expect(screen.queryByRole('button', { name: /^pay ₹/i })).not.toBeInTheDocument();
  });

  it('refuses a too-short reference without calling the API', async () => {
    await reachWhatsappStep();
    fireEvent.change(screen.getByLabelText(/payment reference/i), { target: { value: 'ab' } });
    fireEvent.click(screen.getByRole('button', { name: /submit reference/i }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(submitReferenceMock).not.toHaveBeenCalled();
  });

  it('submits a real reference against the right order', async () => {
    submitReferenceMock.mockResolvedValue({ ok: true, data: { ok: true, status: 'submitted' } });
    await reachWhatsappStep();
    fireEvent.change(screen.getByLabelText(/payment reference/i), { target: { value: '512345678901' } });
    fireEvent.click(screen.getByRole('button', { name: /submit reference/i }));
    await waitFor(() => {
      expect(submitReferenceMock).toHaveBeenCalledWith('ORD-WA0001', '512345678901');
    });
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/order/ORD-WA0001'));
  });

  it('surfaces a server rejection instead of pretending it worked', async () => {
    submitReferenceMock.mockResolvedValue({ ok: false, error: 'This order was cancelled. Start a new one.' });
    await reachWhatsappStep();
    fireEvent.change(screen.getByLabelText(/payment reference/i), { target: { value: '512345678901' } });
    fireEvent.click(screen.getByRole('button', { name: /submit reference/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/cancelled/i);
    expect(pushMock).not.toHaveBeenCalled();
  });
});
