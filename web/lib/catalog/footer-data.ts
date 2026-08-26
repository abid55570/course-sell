import { groupProductsByCategory, listProducts } from './index';
import type { Category } from './types';

export type FooterData = { productCount: number; categories: Category[] };

/**
 * The two catalog-derived values the footer shows.
 *
 * Every page with a footer needs exactly this pair, and the footer itself is
 * synchronous now (see components/landing/Footer.tsx for why), so each page
 * resolves them on the way in. One catalog read serves both.
 */
export async function getFooterData(): Promise<FooterData> {
  const products = await listProducts();
  return {
    productCount: products.length,
    categories: groupProductsByCategory(products),
  };
}
