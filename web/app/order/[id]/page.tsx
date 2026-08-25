import { getFooterData } from '@/lib/catalog/footer-data';
import OrderView from '@/components/order/OrderView';

/**
 * A server shell around the client order view.
 *
 * The view itself polls for order status and must run on the client, but the
 * footer it renders needs catalog data, which only the server can read. So this
 * page resolves that data and hands it down, keeping the catalog out of the
 * client bundle entirely.
 */
export default async function OrderStatusPage() {
  const footer = await getFooterData();
  return <OrderView footer={footer} />;
}
