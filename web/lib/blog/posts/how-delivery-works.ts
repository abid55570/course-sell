import type { BlogPost } from '../types';

/**
 * Every claim in this post is checked against the code that actually runs:
 * api/routes/orders.js, api/services/fulfillment.js, api/utils/email.js and
 * api/utils/template.js. Nothing here is aspirational.
 */
export const howDeliveryWorks: BlogPost = {
  slug: 'how-delivery-works',
  title: 'What happens after you pay',
  summary:
    'The exact sequence between tapping Buy and having the file, including what to do when the email does not arrive.',
  published: '2026-08-23',
  readMinutes: 3,
  tags: ['Delivery', 'Payments'],
  image: {
    url: 'https://images.unsplash.com/photo-1634733988138-bf2c3a2a13fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
    alt: 'A card payment terminal printing a long paper receipt, on an orange background.',
    credit: {
      photographer: 'Towfiqu barbhuiya',
      photographerUrl: 'https://unsplash.com/@towfiqu999999?utm_source=dropdesk&utm_medium=referral',
      photoUrl: 'https://unsplash.com/photos/xkArbdUcUeE?utm_source=dropdesk&utm_medium=referral',
    },
  },
  body: [
    {
      paragraphs: [
        'Buying a digital file from a store you have not used before asks for a small act of faith. You pay, and then you wait to find out whether anything arrives. This is what the wait actually contains.',
      ],
    },
    {
      heading: 'You pay',
      paragraphs: [
        'Checkout asks for a name and an email address. That is the whole form. There is no account to create, no password to choose, and nothing to remember afterwards.',
        'Payment runs through Razorpay, so UPI, cards and netbanking all work. Dropdesk never sees your card or your UPI PIN.',
      ],
    },
    {
      heading: 'The email goes out',
      paragraphs: [
        'The moment Razorpay confirms the payment, an email goes to the address you typed at checkout. It carries a download link. It does not carry the file as an attachment, because attachments bounce off inbox size limits and land in spam more often than links do.',
        'The link is tied to your order. Keep the email and you keep the file.',
      ],
    },
    {
      heading: 'When it does not arrive',
      paragraphs: [
        'Check the spam folder first, and search your inbox for the product name rather than for Dropdesk. If it is genuinely missing, write to support with the email address you paid with. A resend costs nothing and needs no refund.',
        'A typo in the email address is the usual cause, and it is fixable. Say what you typed and what it should have been.',
      ],
    },
    {
      heading: 'Refunds',
      paragraphs: [
        'A digital file is delivered the instant you pay, so orders are final once the link is sent. The refunds page sets out the exceptions in full, and a broken link is never one of them, because that is a delivery problem and gets fixed rather than refunded.',
      ],
    },
  ],
};
