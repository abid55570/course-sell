import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PrivacyPage from '@/app/privacy/page';
import TermsPage from '@/app/terms/page';
import RefundsPage from '@/app/refunds/page';
import ContactPage from '@/app/contact/page';
import { SUPPORT_EMAIL } from '@/lib/catalog';

describe('legal pages', () => {
  it('renders the privacy policy, referencing the support email and never claiming an attached file', async () => {
    const { container } = render(await PrivacyPage());
    expect(screen.getByRole('heading', { name: 'Privacy Policy' })).toBeDefined();
    expect(screen.getAllByText(SUPPORT_EMAIL, { exact: false }).length).toBeGreaterThan(0);
    expect(container.innerHTML).not.toMatch(/attach(ed|es|ment)/i);
  });

  it('renders the terms of service, describing the download-link delivery mechanic', async () => {
    render(await TermsPage());
    expect(screen.getByRole('heading', { name: 'Terms of Service' })).toBeDefined();
    expect(screen.getAllByText(/download link/i).length).toBeGreaterThan(0);
  });

  it('renders the refund policy, stating digital goods are non-refundable once delivered', async () => {
    render(await RefundsPage());
    expect(screen.getByRole('heading', { name: 'Refund Policy' })).toBeDefined();
    expect(screen.getAllByText(/non-refundable|final sale/i).length).toBeGreaterThan(0);
  });

  it('renders the contact page with a working mailto link', async () => {
    render(await ContactPage());
    expect(screen.getByRole('heading', { name: 'Contact' })).toBeDefined();
    // Both the page body and the shared footer carry a mailto link to the
    // same support address; every one of them must point at it correctly.
    const mailLinks = screen.getAllByText(SUPPORT_EMAIL, { selector: 'a' });
    expect(mailLinks.length).toBeGreaterThan(0);
    for (const link of mailLinks) {
      expect(link.getAttribute('href')).toBe(`mailto:${SUPPORT_EMAIL}`);
    }
  });

  it('never claims a PDF file is attached to the delivery email, on any legal page', async () => {
    for (const Page of [PrivacyPage, TermsPage, RefundsPage, ContactPage]) {
      const { container } = render(<Page />);
      // The terms page correctly says "we do not attach the PDF files" — a
      // denial, not a claim. Flag only a positive attachment claim.
      expect(container.innerHTML).not.toMatch(/(?<!not |n't )attach(ed|es|ing)? (the |a )?(pdf|file)/i);
    }
  });
});
