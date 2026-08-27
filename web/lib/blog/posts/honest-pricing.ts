import type { BlogPost } from '../types';

export const honestPricing: BlogPost = {
  slug: 'honest-pricing',
  title: 'Why the price is what it is',
  summary:
    'How Dropdesk prices its products, why bundles exist, and what the figures on the page actually mean.',
  published: '2026-08-26',
  readMinutes: 4,
  tags: ['Pricing', 'Business'],
  image: {
    url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
    alt: 'A calculator and an open notebook showing price calculations, on a desk next to a pen.',
    credit: {
      photographer: 'NordWood Themes',
      photographerUrl: 'https://unsplash.com/@nordwood?utm_source=dropdesk&utm_medium=referral',
      photoUrl: 'https://unsplash.com/photos/53A3Nz7hMmM?utm_source=dropdesk&utm_medium=referral',
    },
  },
  body: [
    {
      paragraphs: [
        'A price on a product page is the result of a few straightforward decisions, not an algorithm. This is what those decisions are and what they produce.',
      ],
    },
    {
      heading: 'One payment',
      paragraphs: [
        'Every product is sold once and is yours to keep. There is no renewal, no expiry on the download, nothing that stops working when a card lapses. That shapes the price: it has to cover the work once, not amortise it across twelve months.',
        'The alternative is a subscription, which earns more from the same files. Dropdesk chooses not to because it does not match the thing being sold.',
      ],
    },
    {
      heading: 'Bundles',
      paragraphs: [
        'Some products are useful together. A pair is offered at a lower price than the two products added separately, and the page shows the real separate total so the saving is honest rather than claimed.',
        'A bundle is only shown when it genuinely costs less. If the two prices added together come out lower than the bundle price, no bundle is offered. The site checks that rather than trusting a label.',
      ],
    },
    {
      heading: 'How to read the figures',
      paragraphs: [
        'The price shown is the price you pay. There are no tiers, no introductory periods, and no hidden checkout charges. The payment page shows the amount before you confirm.',
        'If you are paying by UPI through WhatsApp, the amount is the same. The path is longer - confirm on WhatsApp, paste a payment reference - but the price does not change.',
      ],
    },
  ],
};
