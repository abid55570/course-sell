import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

/**
 * Regression coverage for the order page's download link 404: it used to
 * build downloadLink from order.drive_link || order.pdf_file, but pdf_file
 * is the storage path routes/admin.js's persistPdf() wrote to disk
 * (/uploads/pdfs/<filename>, relative to the API's own directory) -- not a
 * URL the browser can fetch. The delivery email (api/utils/template.js)
 * instead links to `${SITE_URL}/api/orders/${order.order_id}/pdf`, the real
 * route that checks payment status and the send_pdf_in_email flag before
 * streaming the file. These tests assert the order page builds that same
 * URL, and that a product with no file at all gets an honest message
 * instead of no link and no explanation.
 */

let mockOrderResult: unknown;
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'ORD-TEST' }),
}));
vi.mock('@/lib/orders', () => ({
  getOrder: () => Promise.resolve(mockOrderResult),
}));

import OrderStatusPage from '@/app/order/[id]/page';
import { PUBLIC_API_BASE } from '@/lib/env';

function baseOrder(overrides: Record<string, unknown> = {}) {
  return {
    order_id: 'ORD-TEST',
    status: 'completed',
    amount: 999,
    buyer_name: 'Asha Verma',
    buyer_email: 'asha@example.com',
    product_type: 'course',
    created_at: new Date().toISOString(),
    course_title: 'Glow-Up OS',
    course_slug: 'glow-up-os',
    drive_link: null,
    pdf_file: null,
    ...overrides,
  };
}

describe('order page download link', () => {
  it('uses drive_link directly when the course has one', async () => {
    mockOrderResult = { ok: true, data: baseOrder({ drive_link: 'https://drive.google.com/folder/abc' }) };
    render(<OrderStatusPage />);
    const link = await screen.findByRole('link', { name: /download now/i });
    expect(link).toHaveAttribute('href', 'https://drive.google.com/folder/abc');
  });

  it('routes a PDF through the same /api/orders/:id/pdf endpoint the delivery email uses, not the raw storage path', async () => {
    mockOrderResult = { ok: true, data: baseOrder({ pdf_file: '/uploads/pdfs/1699999999-glow-up-os.pdf' }) };
    render(<OrderStatusPage />);
    const link = await screen.findByRole('link', { name: /download now/i });
    // This must equal the exact URL api/utils/template.js's buildResourcesBlock
    // constructs for the delivery email: `${SITE_URL}/api/orders/${order_id}/pdf`.
    expect(link).toHaveAttribute('href', `${PUBLIC_API_BASE}/api/orders/ORD-TEST/pdf`);
    // Never the raw on-disk path the admin upload wrote -- that 404s in a browser.
    expect(link.getAttribute('href')).not.toContain('/uploads/pdfs/');
  });

  it('prefers drive_link over a pdf_file when both are present', async () => {
    mockOrderResult = {
      ok: true,
      data: baseOrder({ drive_link: 'https://drive.google.com/folder/xyz', pdf_file: '/uploads/pdfs/x.pdf' }),
    };
    render(<OrderStatusPage />);
    const link = await screen.findByRole('link', { name: /download now/i });
    expect(link).toHaveAttribute('href', 'https://drive.google.com/folder/xyz');
  });

  it('a completed course order with no file at all gets an explanation, not a dead link', async () => {
    mockOrderResult = { ok: true, data: baseOrder({ drive_link: null, pdf_file: null }) };
    render(<OrderStatusPage />);
    await screen.findByText(/payment confirmed/i);
    expect(screen.queryByRole('link', { name: /download now/i })).not.toBeInTheDocument();
    expect(screen.getByText(/no download file is attached to this order yet/i)).toBeInTheDocument();
  });

  it('a completed non-course order (video/carousel/tool) shows no download link and no "no file" message -- those deliver differently', async () => {
    mockOrderResult = {
      ok: true,
      data: baseOrder({ product_type: 'carousel', course_title: undefined, drive_link: null, pdf_file: null }),
    };
    render(<OrderStatusPage />);
    await screen.findByText(/payment confirmed/i);
    expect(screen.queryByRole('link', { name: /download now/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/no download file is attached/i)).not.toBeInTheDocument();
  });

  it('a pending order shows no download link and no "no file" message', async () => {
    mockOrderResult = { ok: true, data: baseOrder({ status: 'pending' }) };
    render(<OrderStatusPage />);
    await screen.findByText(/payment not confirmed yet/i);
    expect(screen.queryByRole('link', { name: /download now/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/no download file is attached/i)).not.toBeInTheDocument();
  });
});
