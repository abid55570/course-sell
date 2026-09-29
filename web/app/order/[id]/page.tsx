import { getFooterData } from '@/lib/catalog/footer-data';
import { listProducts } from '@/lib/catalog';
import OrderView from '@/components/order/OrderView';

/**
 * A server shell around the client order view.
 *
 * The view itself polls for order status and must run on the client, but the
 * footer and post-purchase picks it renders need catalog data, which only the
 * server can read. So this page resolves that data and hands it down, keeping
 * the catalog out of the client bundle entirely.
 *
 * Post-purchase picks are the six cheapest published products (typically the
 * ₹29–99 reel bundles): the buyer just cleared a payment friction, so the
 * highest-conversion cross-sell is a set of same-price-band adds rather than a
 * flagship system at 10x the price.
 */
export default async function OrderStatusPage() {
  const [footer, allProducts] = await Promise.all([getFooterData(), listProducts()]);
  const picks = [...allProducts]
    .sort((a, b) => a.price - b.price)
    .slice(0, 6);
  return <OrderView footer={footer} picks={picks} />;
}
