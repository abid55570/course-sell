import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import SiteHeader from '@/components/chrome/SiteHeader';
import MobileDrawer, { type DrawerCategory } from '@/components/chrome/MobileDrawer';
import { listCategories as loadCategories, listProducts as loadProducts } from '@/lib/catalog';
/**
 * The catalog accessors are async now that the catalog lives in the database.
 * This suite iterates the catalog at module scope, so it resolves it once here
 * with a top-level await and keeps its assertions synchronous. The read path
 * itself is covered by tests/catalog-loader.test.ts.
 */
const [ALL_PRODUCTS, ALL_CATEGORIES] = await Promise.all([loadProducts(), loadCategories()]);
const listProducts = () => ALL_PRODUCTS;
const listCategories = () => ALL_CATEGORIES;

const CATEGORIES: DrawerCategory[] = [
  { slug: 'character-guides', label: 'Character Guides', hex: '#d6336c', count: 41 },
  { slug: 'the-ten-series', label: 'The Ten Series', hex: '#4263eb', count: 24 },
];

describe('SiteHeader', () => {
  it('renders a wordmark linking home', async () => {
    render(await SiteHeader());
    const link = screen.getByRole('link', { name: /dropdesk/i });
    expect(link.getAttribute('href')).toBe('/');
  });

  it('links to the full browse page and to bundles', async () => {
    render(await SiteHeader());
    expect(screen.getByRole('link', { name: /all products/i }).getAttribute('href')).toBe('/products');
    expect(screen.getByRole('link', { name: /^bundles$/i }).getAttribute('href')).toBe('/products#bundles');
  });

  it('passes every category to the drawer with its real product count', async () => {
    render(await SiteHeader());
    const trigger = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(trigger);

    const products = listProducts();
    for (const category of listCategories()) {
      const count = products.filter((p) => p.category.slug === category.slug).length;
      const link = screen.getByRole('link', { name: new RegExp(category.label, 'i') });
      expect(within(link).getByText(String(count).padStart(2, '0'))).toBeDefined();
    }
  });
});

describe('MobileDrawer', () => {
  it('is absent from the accessibility tree until opened', () => {
    render(<MobileDrawer categories={CATEGORIES} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens with aria-expanded flipped and a modal dialog', () => {
    render(<MobileDrawer categories={CATEGORIES} />);
    const trigger = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName();
  });

  it('closes on Escape', () => {
    render(<MobileDrawer categories={CATEGORIES} />);
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    expect(screen.getByRole('dialog')).toBeDefined();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('locks the page behind it while open and restores scrolling on close', () => {
    render(<MobileDrawer categories={CATEGORIES} />);
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('gives every tappable row a 44px minimum target', () => {
    const { container } = render(<MobileDrawer categories={CATEGORIES} />);
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));

    const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
    const targets = dialog.querySelectorAll<HTMLElement>('a, button');
    for (const el of targets) {
      const cls = el.className;
      const ok = /min-h-\[44px\]|h-11|h-\[44px\]/.test(cls);
      expect(ok, `tap target too small: "${cls}"`).toBe(true);
    }
  });

  // A runtime catalog import here would be invisible in tests but would ship 84
  // products of data into the client bundle, spending the whole first-load
  // budget. Assert on the source rather than the render.
  it('never imports the catalog into the client bundle', () => {
    const src = readFileSync(
      path.resolve(__dirname, '../components/chrome/MobileDrawer.tsx'),
      'utf8'
    );
    expect(src).toContain("'use client'");
    expect(src, 'MobileDrawer must receive categories as props, not import them').not.toMatch(
      /from ['"]@\/lib\/catalog/
    );
  });
});
