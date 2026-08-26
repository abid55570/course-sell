/**
 * The store's support address.
 *
 * It lives here rather than being imported from lib/catalog because
 * app/order/[id]/page.tsx is a client component: importing it from the catalog
 * would pull the async, API-backed catalog loader into a client bundle.
 */
export { SUPPORT_EMAIL } from './catalog/config';
