import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
let result: unknown;
vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'ORD-TEST' }) }));
vi.mock('@/lib/orders', () => ({ getOrder: () => Promise.resolve(result) }));
import OrderView from '@/components/order/OrderView';
afterEach(cleanup);
const footer = { productCount: 113, categories: [] };
function order(overrides: Record<string, unknown> = {}) {
  return { order_id: 'ORD-TEST', status: 'completed', amount: 499, buyer_name: 'Buyer',
    buyer_email: 'buyer@example.com', product_type: 'catalog', course_title: 'Mobile Repair',
    created_at: '2026-09-10T00:00:00Z', ...overrides };
}
describe('email-only order delivery', () => {
  for (const product_type of ['catalog', 'course']) {
    it(product_type + ' shows sent only with delivered status and never exposes content links', async () => {
      result = { ok: true, data: order({ product_type, delivery_status: 'delivered',
        drive_link: 'https://drive.google.com/file/d/private/view', pdf_file: '/uploads/pdfs/private.pdf' }) };
      const { container } = render(<OrderView footer={footer} />);
      await screen.findByText(/access link has been emailed/i);
      expect(container.innerHTML).not.toContain('drive.google.com');
      expect(container.innerHTML).not.toContain('/uploads/pdfs');
      expect(screen.queryByRole('link', { name: /download/i })).not.toBeInTheDocument();
    });
  }
  for (const delivery_status of ['pending', 'sending']) {
    it(delivery_status + ' does not claim email was sent', async () => {
      result = { ok: true, data: order({ delivery_status }) };
      render(<OrderView footer={footer} />);
      await screen.findByText(/we are sending/i);
      expect(screen.queryByText(/has been emailed/i)).not.toBeInTheDocument();
    });
  }
  it('failed delivery explains delay and offers a status refresh', async () => {
    result = { ok: true, data: order({ delivery_status: 'failed' }) };
    render(<OrderView footer={footer} />);
    await screen.findByText(/has not been sent successfully/i);
    expect(screen.getByRole('button', { name: /check email status/i })).toBeInTheDocument();
  });
  it('historical untracked delivery does not claim success', async () => {
    result = { ok: true, data: order({ delivery_status: 'untracked' }) };
    render(<OrderView footer={footer} />);
    await screen.findByText(/cannot confirm email delivery/i);
    expect(screen.queryByText(/has been emailed/i)).not.toBeInTheDocument();
  });
  it('unpaid orders show payment status, not delivery confirmation', async () => {
    result = { ok: true, data: order({ status: 'pending' }) };
    render(<OrderView footer={footer} />);
    await screen.findByText(/payment not confirmed yet/i);
    expect(screen.queryByText(/has been emailed/i)).not.toBeInTheDocument();
  });
});
