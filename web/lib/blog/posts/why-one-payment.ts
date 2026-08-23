import type { BlogPost } from '../types';

/**
 * States the store's own pricing model. Every figure is read from the catalog
 * at render time rather than written into the prose, so this post cannot go
 * stale the way the terms page did when the catalog grew from 6 to 84 items.
 */
export const whyOnePayment: BlogPost = {
  slug: 'why-one-payment',
  title: 'Why everything here is one payment',
  summary:
    'No subscriptions, no accounts, no renewals. What that costs the store, and what it buys you.',
  published: '2026-08-23',
  readMinutes: 3,
  tags: ['Pricing'],
  image: {
    url: 'https://images.unsplash.com/photo-1581495701295-13b43b0f4ae8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
    alt: 'Four blank white paper price tags hanging on strings against a pink background.',
    credit: {
      photographer: 'Keila Hötzel',
      photographerUrl: 'https://unsplash.com/@keilahoetzel?utm_source=dropdesk&utm_medium=referral',
      photoUrl: 'https://unsplash.com/photos/bkwKvGBO_jE?utm_source=dropdesk&utm_medium=referral',
    },
  },
  body: [
    {
      paragraphs: [
        'Almost every digital product sold today wants to be a subscription. It is better business: predictable revenue, a number that compounds, a customer who forgets to cancel. Dropdesk sells one payment instead, and it is worth saying why rather than leaving it as a slogan.',
      ],
    },
    {
      heading: 'A subscription would earn more',
      paragraphs: [
        'That is the honest starting point. Charging monthly for the same files would make more money from the same catalog, and the people building subscription businesses are not wrong about the arithmetic.',
        'The problem is what it does to the thing being sold. A file you already downloaded does not need renewing. Charging for it monthly means either withholding something you paid for, or inventing new reasons to bill you.',
      ],
    },
    {
      heading: 'What one payment means here',
      paragraphs: [
        'You pay once and the file is yours. No renewal, no expiry on the download, nothing that stops working when a card lapses. There is no account, so there is nothing to log into and nothing to cancel.',
        'It also means the price has to be right the first time. There is no recurring revenue to smooth over a product nobody wants, which is a useful pressure to be under.',
      ],
    },
    {
      heading: 'Where bundles fit',
      paragraphs: [
        'Some products are sold together at a set price, because people who want one usually want the other. A bundle is only worth listing when it genuinely costs less than buying its parts, and the site checks that rather than trusting the label. If a pair does not beat its two prices added together, no bundle is offered at all.',
      ],
    },
  ],
};
