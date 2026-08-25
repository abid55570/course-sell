import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// CheckoutForm is a client component that calls next/navigation's
// useRouter() to redirect after a completed order. jsdom has no app router
// mounted, so it needs a stand-in here the same way it would get a real one
// from Next at runtime.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import CheckoutPage from '@/app/checkout/page';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import { listProducts as loadProducts, listBundles as loadBundles } from '@/lib/catalog';
/**
 * The catalog accessors are async now that the catalog lives in the database.
 * This suite iterates the catalog at module scope, so it resolves it once here
 * with a top-level await and keeps its assertions synchronous. The read path
 * itself is covered by tests/catalog-loader.test.ts.
 */
const [ALL_PRODUCTS, ALL_BUNDLES] = await Promise.all([loadProducts(), loadBundles()]);
const getProduct = (slug: string) => ALL_PRODUCTS.find((p) => p.slug === slug);
const getBundle = (slug: string) => ALL_BUNDLES.find((b) => b.slug === slug);
import { formatRupees } from '@/lib/format';

describe('CheckoutPage', () => {
  it('renders the product being bought, with its price from the file catalog', async () => {
    const product = getProduct('glow-up-os')!;
    const Page = await CheckoutPage({ searchParams: Promise.resolve({ slug: 'glow-up-os' }) });
    render(Page);
    expect(screen.getAllByText(product.title).length).toBeGreaterThan(0);
    expect(screen.getAllByText(formatRupees(product.price), { exact: false }).length).toBeGreaterThan(0);
    // The actual payment form is present for a sellable product.
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('renders a "not found" state for an unknown slug, with no checkout form', async () => {
    const Page = await CheckoutPage({ searchParams: Promise.resolve({ slug: 'not-a-real-product' }) });
    render(Page);
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
  });

  it('renders a "no product selected" state with no slug at all', async () => {
    const Page = await CheckoutPage({ searchParams: Promise.resolve({}) });
    render(Page);
    expect(screen.getByText(/no product selected/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
  });

  // Every bundle is sellable today, so this constructs the unavailable case
  // rather than borrowing one from the catalog. The guard is what is under
  // test, and it has to keep working the next time a bundle ships incomplete.
  it('an unavailable bundle can never reach checkout: no form is rendered, ever', async () => {
    const available = ALL_BUNDLES.find((b) => b.slug === 'the-complete-woman')!;
    expect(available.availableToday).toBe(true);
    vi.doMock('@/lib/catalog/loader', () => ({
      loadCatalog: async () => ({
        products: ALL_PRODUCTS,
        bundles: ALL_BUNDLES.map((b) =>
          b.slug === 'the-complete-woman' ? { ...b, availableToday: false } : b
        ),
      }),
    }));
    vi.resetModules();
    const { default: FreshCheckoutPage } = await import('@/app/checkout/page');
    const Page = await FreshCheckoutPage({ searchParams: Promise.resolve({ slug: 'the-complete-woman' }) });
    render(Page);
    expect(screen.getByText(/not available yet/i)).toBeInTheDocument();
    // No name/email inputs, no submit button, no CheckoutForm mounted at all.
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /pay/i })).not.toBeInTheDocument();
    vi.doUnmock('@/lib/catalog/loader');
    vi.resetModules();
  });

  it('an available bundle does reach a real checkout form', async () => {
    const bundle = getBundle('the-complete-man')!;
    expect(bundle.availableToday).toBe(true);
    const Page = await CheckoutPage({ searchParams: Promise.resolve({ slug: 'the-complete-man' }) });
    render(Page);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  });
});

describe('CheckoutForm', () => {
  it('disables submit until both name and email are present', () => {
    render(<CheckoutForm slug="glow-up-os" title="Glow-Up OS" price={999} />);

    const submit = screen.getByRole('button', { name: /pay/i });
    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    expect(submit).toBeDisabled();

    fireEvent.change(nameInput, { target: { value: 'Asha Verma' } });
    expect(submit).toBeDisabled();

    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    expect(submit).toBeDisabled();

    fireEvent.change(emailInput, { target: { value: 'asha@example.com' } });
    expect(submit).toBeEnabled();
  });

  it('stays disabled with only an email and no name', () => {
    render(<CheckoutForm slug="glow-up-os" title="Glow-Up OS" price={999} />);
    const submit = screen.getByRole('button', { name: /pay/i });

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'asha@example.com' } });
    expect(submit).toBeDisabled();
  });
});
