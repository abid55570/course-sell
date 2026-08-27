import type { BlogPost } from '../types';

export const theDownloadExperience: BlogPost = {
  slug: 'the-download-experience',
  title: 'What the download actually feels like',
  summary:
    'From checkout to file on your machine - the moments that matter and the ones that do not.',
  published: '2026-08-25',
  readMinutes: 4,
  tags: ['Delivery', 'Experience'],
  image: {
    url: 'https://images.unsplash.com/photo-1555066931-436e5c00000c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
    alt: 'A laptop screen showing a spreadsheet with a green download-complete bar, on a wooden desk.',
    credit: {
      photographer: 'Scott Graham',
      photographerUrl: 'https://unsplash.com/@scottgraham?utm_source=dropdesk&utm_medium=referral',
      photoUrl: 'https://unsplash.com/photos/5fNmWej4tAA?utm_source=dropdesk&utm_medium=referral',
    },
  },
  body: [
    {
      paragraphs: [
        'Every product page shows what you get before you pay. The file count, the format, the page count - they are all listed. The download itself is meant to be the least interesting part of the transaction.',
      ],
    },
    {
      heading: 'The link',
      paragraphs: [
        'After payment clears, an email arrives with a download link. It points to the file on a server rather than as an attachment in your inbox. Links avoid both size limits and spam folders.',
        'The link is tied to your order. You do not need an account to use it, but keeping the email means you can come back to it later without re-buying.',
      ],
    },
    {
      heading: 'What to do with the file',
      paragraphs: [
        'Digital products arrive as PDF files or zip archives. A PDF opens in any browser or PDF reader on any device. A zip archive needs extracting, after which you have the individual files inside.',
        'If a download link is broken or the file does not open correctly, that is a delivery problem. Email support with your order ID and it gets fixed rather than refunded.',
      ],
    },
    {
      heading: 'When it does not arrive',
      paragraphs: [
        'Check the spam folder first, then search your inbox for the product name. Email delivery failures are almost always a spam-filter problem, not a payment problem.',
        'If it is genuinely missing, write to support with the email address used at checkout. A resend costs nothing and needs no refund.',
      ],
    },
  ],
};
