import type { Product } from '../types';
import { AUTOMATION_AND_AI, DIGITAL_LIBRARY } from '../categories';

/**
 * Utility and library products — automation templates, ebook bundles,
 * idea packs, and the everything-in-one Full Vault.
 *
 * Source: Dashrize-Products/<PRODUCT-FOLDER>/3 - LISTING TEXT/listing-copy-paste.md
 * Delivery: Google Drive link sent after purchase.
 */

export const n8nMegaPack: Product = {
  slug: 'n8n-mega-pack',
  title: '25,000+ N8N Automation Templates — Mega Pack',
  shortTitle: 'N8N Automation Mega Pack',
  tagline:
    '25,000+ ready-to-import N8N workflow templates covering AI, ChatGPT, social media, e-commerce, email/CRM, lead generation, and 500+ app integrations. Download once, automate everything.',
  price: 799,
  anchorPrice: 2999,
  accent: AUTOMATION_AND_AI.accent,
  category: AUTOMATION_AND_AI,
  format: 'Template Pack',
  fileCount: 25000,
  longDescription: [
    {
      heading: 'What Is N8N?',
      paragraphs: [
        'N8N is a free, open-source workflow automation tool that connects apps and services without custom code. It runs on your own server or desktop, costs nothing to self-host, and has over 500 native integrations — from ChatGPT to Shopify to HubSpot.',
        'These templates are pre-built N8N workflows you import in one click and run immediately. Instead of building each automation from scratch, you start with a working workflow and adjust the parts specific to your setup.',
      ],
    },
    {
      heading: 'What You Get',
      paragraphs: [
        '25,000+ workflow templates in one ZIP, organised by category: AI and ChatGPT integrations, social media (Instagram, TikTok, YouTube), e-commerce (Shopify, Stripe, PayPal), email and CRM (HubSpot, Mailchimp, Notion, Airtable), lead generation, data pipelines, and hundreds more.',
        'Each template is a ready-to-import JSON file. Drop it into any N8N instance and the workflow loads — nodes, connections, and structure intact. Update your credentials and activate.',
      ],
    },
    {
      heading: 'Who This Is For',
      paragraphs: [
        'Anyone running N8N or planning to: freelancers automating client deliverables, small business owners replacing repetitive manual tasks, agencies selling automation services, developers who want a head start on common integrations, and power users scaling their own systems.',
        'No coding required to use the templates. Familiarity with N8N\'s drag-and-drop interface is enough.',
      ],
    },
    {
      heading: 'What You Receive',
      paragraphs: [
        'One ZIP file containing all 25,000+ JSON templates, delivered as a Google Drive link after purchase. Download once, use on any N8N instance. One payment, lifetime access.',
      ],
    },
  ],
  bulletPoints: [
    '25,000+ ready-to-import N8N JSON workflow templates in one ZIP',
    'AI & ChatGPT integrations — automate prompts, summaries, classifications, and content pipelines',
    'Social media automation — Instagram, TikTok, YouTube, Twitter, LinkedIn',
    'Email & CRM workflows — HubSpot, Mailchimp, Notion, Airtable, Google Sheets',
    'E-commerce automation — Shopify, Stripe, PayPal, WooCommerce, order management',
    'Data & analytics pipelines — scraping, reporting, transformation, and scheduling',
    'Lead generation workflows — form capture, enrichment, routing, and follow-up sequences',
    '500+ app integrations including Slack, Telegram, Google Drive, Dropbox, and more',
    'No coding required — import the JSON, connect your credentials, activate',
    'One-time download, lifetime access, works on any N8N instance',
  ],
  faqs: [
    {
      question: 'What is N8N and do I need to install it?',
      answer:
        'N8N is a free, open-source automation tool available at n8n.io. You can install it on your own server, run it locally on your computer, or use N8N Cloud (paid). The templates work with any N8N instance. Self-hosted installation takes about ten minutes and the official N8N docs walk you through it step by step.',
    },
    {
      question: 'Who is this pack designed for?',
      answer:
        'Anyone using or planning to use N8N: freelancers, small business owners, marketing teams, developers, and agencies. The templates are practical workflows for real tasks — not demos or proof-of-concepts. You do not need to know how to code to use them.',
    },
    {
      question: 'How do I import a template into N8N?',
      answer:
        'In N8N, open the workflow editor, click the menu in the top right, and select "Import from file." Choose the JSON template you want. The workflow loads with all nodes and connections intact. Update any credentials (API keys, account connections) and activate the workflow.',
    },
    {
      question: 'Do I need coding skills?',
      answer:
        'No. The templates are fully built workflows. You import, add credentials, and run. Some templates include optional code nodes for advanced users who want to customise further, but the base workflows function without touching any code.',
    },
  ],
  tags: ['automation', 'n8n', 'ai', 'workflows', 'templates'],
  gallery: [
    { filename: '1-cover-thumbnail.png', role: 'cover', alt: 'N8N Automation Mega Pack cover.' },
  ],
  deliveryFiles: ['N8N-Automation-Templates.zip'],
};

export const digitalMarketingEbooksBundle: Product = {
  slug: 'digital-marketing-ebooks-bundle',
  title: 'Digital Marketing Ebooks Bundle — 24 Guides',
  shortTitle: 'Digital Marketing Ebooks',
  tagline:
    '24 complete ebooks and audiobooks covering traffic, email marketing, copywriting, freelancing, affiliate marketing, dropshipping, chatbots, and building your online brand. Instant access, lifetime download.',
  price: 399,
  anchorPrice: 1499,
  accent: DIGITAL_LIBRARY.accent,
  category: DIGITAL_LIBRARY,
  format: 'PDF Bundle',
  fileCount: 24,
  longDescription: [
    {
      heading: 'What You Get',
      paragraphs: [
        'Twenty-four ebooks and audiobooks covering the core disciplines of digital marketing and online business — from getting traffic and building a brand to copywriting, affiliate marketing, and selling digital products.',
        'Three titles come as both a PDF ebook and an MP3 audiobook (How To Start An Online Coaching Business, Dropshipping 101, and How To Make Money On Fiverr) so you can read or listen depending on how you prefer to work.',
      ],
    },
    {
      heading: 'Topics Covered',
      paragraphs: [
        'Traffic generation (Google SEO, hashtags, viral content), email marketing, copywriting, social media growth, chatbot marketing, affiliate marketing, dropshipping, freelancing on Fiverr, starting a coaching business, building an online brand, digital product creation, AdSense monetisation, influencer strategy, and high-ticket sales.',
      ],
    },
    {
      heading: 'Format and Access',
      paragraphs: [
        'PDFs open on any device — phone, tablet, or laptop. MP3 audio files play in any media player. All 24 titles are delivered as a single ZIP via Google Drive. One payment, lifetime access.',
      ],
    },
  ],
  bulletPoints: [
    'Double Your Traffic',
    'Create Your Own Unique Online Brand',
    'Content Hacks',
    'Getting Started with ChatBots',
    'High Ticket Sales',
    'Google AdSense Tips & Tricks',
    'How To Start An Online Coaching Business (Audio + eBook)',
    'Getting Traffic From Google',
    'Chatbot Marketing Mastery',
    'Dropshipping 101 (Audio + eBook)',
    'Digital Empire',
    'Getting Viral',
    'How To Make Money On Fiverr (Audio + eBook)',
    'Entrepreneurial Ideas',
    'Copywriting Expertise',
    'Guide To Successful Online Freelancing',
    'Drive Traffic with Hashtags',
    'How To Become An Influencer',
    'Get Paid To Write A Book',
    'Evergreen Internet Profits',
    'Affiliate Marketing For Newbies',
    'Facebook Marketing Unleashed',
    'Digital Product School',
    'Email Marketing Influence',
  ],
  faqs: [
    {
      question: 'What format are the files?',
      answer:
        'PDFs for the ebooks and MP3 audio files for the audiobooks. Three titles include both formats: How To Start An Online Coaching Business, Dropshipping 101, and How To Make Money On Fiverr. Everything else is PDF only. All files open on any device without special software.',
    },
    {
      question: 'Who is this bundle for?',
      answer:
        'People starting or growing an online business, side-hustlers building a personal brand, marketers looking to cover knowledge gaps across disciplines, and anyone who wants a broad digital marketing reference library without paying course prices.',
    },
    {
      question: 'What topics does the bundle cover?',
      answer:
        'Traffic generation (Google, hashtags, viral), email marketing, copywriting, social media, affiliate marketing, dropshipping, chatbot marketing, freelancing, coaching businesses, brand building, influencer strategy, AdSense monetisation, and digital product creation.',
    },
    {
      question: 'How do I access the files?',
      answer:
        'After purchase, you receive a Google Drive link with all 24 files. Download them to your device for permanent offline access. One payment, lifetime download, no subscription.',
    },
  ],
  tags: ['ebooks', 'digital marketing', 'online business'],
  gallery: [
    {
      filename: '1-cover-thumbnail.png',
      role: 'cover',
      alt: 'Digital Marketing Ebooks Bundle cover.',
    },
  ],
  deliveryFiles: ['Digital-Marketing-Ebooks.zip'],
};

export const fiveHundredDigitalProductIdeas: Product = {
  slug: '500-digital-product-ideas',
  title: '500 Digital Product Ideas — MRR',
  shortTitle: '500 Digital Product Ideas',
  tagline:
    '500 proven digital product ideas across 20+ niches — all with Master Resell Rights. Swipe an idea, build it, sell it. Delivered as a visual slide deck.',
  price: 149,
  accent: DIGITAL_LIBRARY.accent,
  category: DIGITAL_LIBRARY,
  format: 'PDF',
  fileCount: 1,
  longDescription: [
    {
      heading: 'What Is This?',
      paragraphs: [
        'A visual slide deck listing 500 digital product ideas across more than 20 niches. Each idea is a specific, actionable starting point — a product concept you can research, build, brand, and sell as your own.',
        'All 500 ideas come with Master Resell Rights, meaning you can also resell this product itself and keep everything you earn from it.',
      ],
    },
    {
      heading: 'How to Use It',
      paragraphs: [
        'Browse the niches until something matches your interests, skills, or existing audience. Take the idea, validate it in your market, create the product, and list it. The deck is a shortcut past the hardest part of starting a digital product business: deciding what to make.',
      ],
    },
    {
      heading: 'What You Receive',
      paragraphs: [
        'One PDF slide deck delivered as a ZIP via Google Drive. Opens on any device. One payment, lifetime download.',
      ],
    },
  ],
  bulletPoints: [
    '500 digital product ideas in a single visual slide deck',
    'Covers 20+ niches: health, finance, relationships, productivity, pets, parenting, and more',
    'Each idea is a specific, actionable concept — not broad themes or filler',
    'Master Resell Rights included — sell this product as your own and keep 100% of what you earn',
    'Instant download, works on any device, no subscription',
    'One payment, lifetime access',
  ],
  faqs: [
    {
      question: 'What is Master Resell Rights (MRR)?',
      answer:
        'MRR means you can resell this product to others and keep everything you earn. You are buying the right to sell it, not just the right to use it. You may sell it at any price you choose.',
    },
    {
      question: 'Are these ideas actually specific, or just broad categories?',
      answer:
        'They are specific enough to act on — defined product concepts, not vague themes. You will still need to research your target market and build the product, but the idea itself is concrete.',
    },
    {
      question: 'What format is the file?',
      answer:
        'A PDF slide deck. It opens on any device and can be printed. Delivered as a ZIP via Google Drive after purchase.',
    },
  ],
  tags: ['ideas', 'digital products', 'mrr'],
  gallery: [
    {
      filename: '1-cover-thumbnail.png',
      role: 'cover',
      alt: '500 Digital Product Ideas cover.',
    },
  ],
  deliveryFiles: ['500-Digital-Product-Ideas.zip'],
};

export const theFullVault: Product = {
  slug: 'the-full-vault',
  title: 'The Full Vault — Everything',
  shortTitle: 'The Full Vault',
  tagline:
    'Every product in the Dropdesk store: 580+ TITAN video courses, 25,000+ N8N automation templates, 24 marketing ebooks, 500 digital product ideas — everything in one Drive folder. One payment, lifetime access.',
  price: 2999,
  anchorPrice: 9999,
  accent: DIGITAL_LIBRARY.accent,
  category: DIGITAL_LIBRARY,
  format: 'Mega Bundle',
  longDescription: [
    {
      heading: 'Everything in the Store',
      paragraphs: [
        'The Full Vault is a single Google Drive folder containing every product currently sold on Dropdesk. One link, permanent access.',
        'No picking and choosing. No calculating which bundle covers what. Everything, at once, for one price.',
      ],
    },
    {
      heading: 'What Is Inside',
      paragraphs: [
        '580+ TITAN HD video courses spanning digital marketing, business, mindset, health, and lifestyle. 25,000+ N8N automation workflow templates covering AI, social media, e-commerce, CRM, and 500+ app integrations. 24 digital marketing ebooks and audiobooks. 500 digital product ideas with Master Resell Rights.',
      ],
    },
    {
      heading: 'One Payment',
      paragraphs: [
        'Buying each product separately at current prices would cost considerably more. The Full Vault is the single-payment option for buyers who want everything without the maths.',
      ],
    },
  ],
  bulletPoints: [
    '580+ HD video courses across digital marketing, business, mindset, health, and lifestyle',
    '25,000+ N8N automation templates covering AI, social media, e-commerce, CRM, and more',
    '24 digital marketing ebooks and audiobooks — all major disciplines covered',
    '500 digital product ideas with Master Resell Rights',
    'One Google Drive folder — download anything, any time, permanently',
    'All current Dropdesk products in a single purchase',
  ],
  faqs: [
    {
      question: 'What exactly is included?',
      answer:
        'Every product currently sold on Dropdesk: the full TITAN video course library (580+ courses), the N8N Automation Mega Pack (25,000+ templates), the Digital Marketing Ebooks Bundle (24 titles), and the 500 Digital Product Ideas deck. Delivered as a shared Google Drive folder with everything organised inside.',
    },
    {
      question: 'How is access delivered?',
      answer:
        'After purchase you receive a Google Drive link with all products organised in folders. Download individual files or entire folders to your device at any time. The link is permanent.',
    },
    {
      question: 'Do I get future products added to the store?',
      answer:
        'New products added to Dropdesk after your purchase will be added to the Full Vault folder as they launch, at no extra cost.',
    },
    {
      question: 'Can I resell the content inside?',
      answer:
        'The 500 Digital Product Ideas deck includes Master Resell Rights. The video courses, ebook bundle, and N8N templates are for personal use and client work only — they are not individually licensed for resale as standalone products.',
    },
  ],
  tags: ['bundle', 'mega pack', 'everything'],
  gallery: [
    { filename: '1-cover-thumbnail.png', role: 'cover', alt: 'The Full Vault cover.' },
  ],
  deliveryFiles: ['The-Full-Vault-Access.txt'],
};
