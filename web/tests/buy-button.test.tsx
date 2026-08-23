import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import BuyButton from '@/components/product/BuyButton';

describe('BuyButton', () => {
  it('links to /checkout with the product slug, not a mailto: draft', () => {
    render(<BuyButton slug="glow-up-os" title="Glow-Up OS" price={999} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/checkout?slug=glow-up-os');
    expect(link.getAttribute('href')).not.toMatch(/^mailto:/);
  });

  it('URL-encodes a bundle slug the same way', () => {
    render(<BuyButton slug="the-complete-man" title="The Complete Man" price={1499} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/checkout?slug=the-complete-man');
  });

  it('still shows the "Buy for ₹price" label the rest of the storefront expects', () => {
    render(<BuyButton slug="money-os" title="Money OS" price={999} />);
    expect(screen.getByText('Buy for ₹999')).toBeInTheDocument();
  });
});
