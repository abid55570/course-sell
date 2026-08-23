#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const db = require('../utils/db');

const TEMPLATES = [
  {
    slug: '5-tips-education',
    name: '5 Tips — Education',
    category: 'education',
    description: 'A 5-slide educational carousel with numbered tips',
    is_free: true,
    slides: [
      {
        background: { type: 'gradient', colors: ['#1a1130', '#3b1d5e'], angle: 135 },
        decorations: [{ type: 'border', inset: 14, width: 1.5, color: 'rgba(230,193,90,0.4)', radius: 4, useAccent: true }],
        elements: [
          { type: 'text', label: 'Kicker', content: 'CAROUSEL POST', style: { fontSize: 10, fontWeight: 700, color: '#e6c15a', fontFamily: 'Space Grotesk', letterSpacing: '0.12em', textTransform: 'uppercase', isAccent: true, marginBottom: 10 } },
          { type: 'text', label: 'Title', content: '5 Tips to Grow\nYour Audience', style: { fontSize: 28, fontWeight: 800, color: '#ffffff', fontFamily: 'Space Grotesk', lineHeight: '1.15' } },
          { type: 'divider', style: { width: '40', height: '3', color: '#e6c15a', margin: '14' } },
          { type: 'text', label: 'Subtitle', content: 'Simple strategies that actually work', style: { fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.7)', marginTop: 4 } },
          { type: 'text', label: 'Handle', content: '@yourbrand', style: { fontSize: 11, fontWeight: 600, color: '#e6c15a', marginTop: 20, isAccent: true } },
        ],
      },
      ...[1, 2, 3, 4, 5].map(n => ({
        background: { type: 'gradient', colors: ['#1a1130', '#3b1d5e'], angle: 135 },
        decorations: [{ type: 'border', inset: 14, width: 1.5, color: 'rgba(230,193,90,0.4)', radius: 4, useAccent: true }],
        elements: [
          { type: 'number', content: `0${n}`, style: { fontSize: 56, fontWeight: 900, color: 'rgba(255,255,255,0.06)', fontFamily: 'Space Grotesk', marginBottom: 6 } },
          { type: 'text', label: `Tip ${n} Title`, content: ['Post consistently', 'Engage with comments', 'Use carousel posts', 'Write strong hooks', 'Collaborate with others'][n - 1], style: { fontSize: 22, fontWeight: 700, color: '#ffffff', fontFamily: 'Space Grotesk', lineHeight: '1.2' } },
          { type: 'divider', style: { width: '30', height: '2', color: '#e6c15a', margin: '10' } },
          { type: 'text', label: `Tip ${n} Body`, content: ['Share valuable content at least 3–4 times a week to stay top of mind.', 'Reply to every comment within the first hour to boost the algorithm.', 'Carousels get 3× more engagement than single-image posts.', 'The first line decides if people read or scroll past. Make it count.', 'Partner with creators in your niche for cross-promotion.'][n - 1], style: { fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.75)', lineHeight: '1.55', maxWidth: '85%' } },
          { type: 'text', label: 'Handle', content: '@yourbrand', style: { fontSize: 10, fontWeight: 600, color: '#e6c15a', marginTop: 16, isAccent: true } },
        ],
      })),
    ],
  },
  {
    slug: 'motivational-quotes',
    name: 'Daily Motivation',
    category: 'quotes',
    description: 'Inspirational quote carousel with elegant typography',
    is_free: true,
    slides: [
      {
        background: { type: 'gradient', colors: ['#0b1026', '#1b2450'], angle: 150 },
        elements: [
          { type: 'text', label: 'Kicker', content: 'DAILY MOTIVATION', style: { fontSize: 10, fontWeight: 700, color: '#64ffda', letterSpacing: '0.15em', textTransform: 'uppercase', isAccent: true, marginBottom: 14 } },
          { type: 'text', label: 'Quote', content: '"The only way to do\ngreat work is to love\nwhat you do."', style: { fontSize: 24, fontWeight: 400, color: '#ffffff', fontFamily: 'Playfair Display', lineHeight: '1.4' } },
          { type: 'divider', style: { width: '40', height: '2', color: '#64ffda', margin: '16' } },
          { type: 'text', label: 'Author', content: '— Steve Jobs', style: { fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' } },
          { type: 'text', label: 'Handle', content: '@yourbrand', style: { fontSize: 10, fontWeight: 600, color: '#64ffda', marginTop: 24, isAccent: true } },
        ],
      },
      ...[
        ['"Success is not final, failure is not fatal:\nit is the courage to continue that counts."', '— Winston Churchill'],
        ['"In the middle of difficulty\nlies opportunity."', '— Albert Einstein'],
        ['"Your time is limited.\nDon\'t waste it living\nsomeone else\'s life."', '— Steve Jobs'],
        ['"It does not matter how slowly\nyou go as long as\nyou do not stop."', '— Confucius'],
      ].map(([q, a]) => ({
        background: { type: 'gradient', colors: ['#0b1026', '#1b2450'], angle: 150 },
        elements: [
          { type: 'text', label: 'Quote', content: q, style: { fontSize: 22, fontWeight: 400, color: '#ffffff', fontFamily: 'Playfair Display', lineHeight: '1.45' } },
          { type: 'divider', style: { width: '40', height: '2', color: '#64ffda', margin: '16' } },
          { type: 'text', label: 'Author', content: a, style: { fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' } },
          { type: 'text', label: 'Handle', content: '@yourbrand', style: { fontSize: 10, fontWeight: 600, color: '#64ffda', marginTop: 24, isAccent: true } },
        ],
      })),
    ],
  },
  {
    slug: 'product-launch',
    name: 'Product Launch',
    category: 'marketing',
    description: 'Announce a new product or feature with impact',
    is_free: true,
    slides: [
      {
        background: { type: 'gradient', colors: ['#0a0a0a', '#1a1a1a'], angle: 135 },
        elements: [
          { type: 'text', label: 'Badge', content: 'NEW LAUNCH', style: { fontSize: 10, fontWeight: 800, color: '#000000', fontFamily: 'Space Grotesk', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 } },
          { type: 'text', label: 'Product Name', content: 'Introducing\nProductName', style: { fontSize: 30, fontWeight: 800, color: '#ffffff', fontFamily: 'Space Grotesk', lineHeight: '1.1' } },
          { type: 'divider', style: { width: '50', height: '3', color: '#ffffff', margin: '14' } },
          { type: 'text', label: 'Tagline', content: 'The tool you\'ve been waiting for', style: { fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.6)' } },
          { type: 'logo', style: { maxWidth: '60', maxHeight: '30', margin: '20' } },
        ],
      },
      {
        background: { type: 'gradient', colors: ['#0a0a0a', '#1a1a1a'], angle: 135 },
        elements: [
          { type: 'text', label: 'Problem Title', content: 'The Problem', style: { fontSize: 12, fontWeight: 700, color: '#ef4444', letterSpacing: '0.1em', textTransform: 'uppercase', isAccent: true, marginBottom: 10 } },
          { type: 'text', label: 'Problem', content: 'Existing tools are slow,\nexpensive, and complicated.', style: { fontSize: 22, fontWeight: 700, color: '#ffffff', fontFamily: 'Space Grotesk', lineHeight: '1.3' } },
          { type: 'text', label: 'Detail', content: 'Teams waste 10+ hours a week on tasks that should take minutes.', style: { fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.6)', marginTop: 12, lineHeight: '1.5' } },
        ],
      },
      {
        background: { type: 'gradient', colors: ['#0a0a0a', '#1a1a1a'], angle: 135 },
        elements: [
          { type: 'text', label: 'Solution Title', content: 'Our Solution', style: { fontSize: 12, fontWeight: 700, color: '#22c55e', letterSpacing: '0.1em', textTransform: 'uppercase', isAccent: true, marginBottom: 10 } },
          { type: 'text', label: 'Solution', content: 'One click. Done.\nThat\'s the whole pitch.', style: { fontSize: 22, fontWeight: 700, color: '#ffffff', fontFamily: 'Space Grotesk', lineHeight: '1.3' } },
          { type: 'text', label: 'Detail', content: 'We automated the boring parts so you can focus on what matters.', style: { fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.6)', marginTop: 12, lineHeight: '1.5' } },
        ],
      },
      {
        background: { type: 'gradient', colors: ['#0a0a0a', '#1a1a1a'], angle: 135 },
        elements: [
          { type: 'text', label: 'CTA Kicker', content: 'READY?', style: { fontSize: 10, fontWeight: 800, color: '#fbbf24', letterSpacing: '0.15em', textTransform: 'uppercase', isAccent: true, marginBottom: 10 } },
          { type: 'text', label: 'CTA Title', content: 'Try it free today', style: { fontSize: 28, fontWeight: 800, color: '#ffffff', fontFamily: 'Space Grotesk' } },
          { type: 'divider', style: { width: '50', height: '3', color: '#fbbf24', margin: '14' } },
          { type: 'text', label: 'CTA URL', content: 'yourproduct.com/start', style: { fontSize: 14, fontWeight: 600, color: '#fbbf24', isAccent: true } },
          { type: 'logo', style: { maxWidth: '60', maxHeight: '30', margin: '16' } },
        ],
      },
    ],
  },
  {
    slug: 'business-stats',
    name: 'Business Stats',
    category: 'business',
    description: 'Showcase metrics, results, or case study numbers',
    slides: [
      {
        background: { type: 'gradient', colors: ['#06231d', '#0e4a3a'], angle: 135 },
        elements: [
          { type: 'text', label: 'Kicker', content: 'CASE STUDY', style: { fontSize: 10, fontWeight: 700, color: '#34d8f0', letterSpacing: '0.12em', textTransform: 'uppercase', isAccent: true, marginBottom: 10 } },
          { type: 'text', label: 'Title', content: 'How We Grew\n300% in 6 Months', style: { fontSize: 26, fontWeight: 800, color: '#ffffff', fontFamily: 'Space Grotesk', lineHeight: '1.15' } },
          { type: 'divider', style: { width: '40', height: '3', color: '#34d8f0', margin: '14' } },
          { type: 'text', label: 'Subtitle', content: 'The exact strategy behind our growth', style: { fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.65)' } },
          { type: 'text', label: 'Handle', content: '@yourbrand', style: { fontSize: 10, fontWeight: 600, color: '#34d8f0', marginTop: 20, isAccent: true } },
        ],
      },
      ...[
        ['10K+', 'New followers', 'Gained through consistent content + community engagement'],
        ['300%', 'Revenue growth', 'From ₹2L/mo to ₹8L/mo in just 6 months'],
        ['47%', 'Conversion rate', 'Our landing page converts nearly half of all visitors'],
      ].map(([stat, label, detail]) => ({
        background: { type: 'gradient', colors: ['#06231d', '#0e4a3a'], angle: 135 },
        elements: [
          { type: 'text', label: 'Stat', content: stat, style: { fontSize: 52, fontWeight: 900, color: '#34d8f0', fontFamily: 'Space Grotesk', isAccent: true } },
          { type: 'text', label: 'Label', content: label, style: { fontSize: 20, fontWeight: 700, color: '#ffffff', fontFamily: 'Space Grotesk', marginTop: 6 } },
          { type: 'divider', style: { width: '30', height: '2', color: '#34d8f0', margin: '12' } },
          { type: 'text', label: 'Detail', content: detail, style: { fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.7)', lineHeight: '1.5', maxWidth: '85%' } },
        ],
      })),
      {
        background: { type: 'gradient', colors: ['#06231d', '#0e4a3a'], angle: 135 },
        elements: [
          { type: 'text', label: 'CTA', content: 'Want similar results?', style: { fontSize: 24, fontWeight: 800, color: '#ffffff', fontFamily: 'Space Grotesk' } },
          { type: 'divider', style: { width: '40', height: '3', color: '#34d8f0', margin: '14' } },
          { type: 'text', label: 'CTA Detail', content: 'DM us "GROW" or visit\nthe link in bio', style: { fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' } },
          { type: 'text', label: 'Handle', content: '@yourbrand', style: { fontSize: 11, fontWeight: 600, color: '#34d8f0', marginTop: 16, isAccent: true } },
        ],
      },
    ],
  },
  {
    slug: 'personal-branding',
    name: 'Personal Brand Intro',
    category: 'personal',
    description: 'Introduce yourself and your expertise',
    slides: [
      {
        background: { type: 'gradient', colors: ['#1a0a2e', '#3d1654'], angle: 150 },
        elements: [
          { type: 'text', label: 'Hi Line', content: 'HI, I\'M', style: { fontSize: 12, fontWeight: 700, color: '#f97316', letterSpacing: '0.12em', textTransform: 'uppercase', isAccent: true, marginBottom: 6 } },
          { type: 'text', label: 'Name', content: 'Your Name', style: { fontSize: 34, fontWeight: 900, color: '#ffffff', fontFamily: 'Space Grotesk', lineHeight: '1.05' } },
          { type: 'divider', style: { width: '40', height: '3', color: '#f97316', margin: '14' } },
          { type: 'text', label: 'Tagline', content: 'Helping creators build\naudiences that convert', style: { fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.75)', lineHeight: '1.45' } },
          { type: 'text', label: 'Handle', content: '@yourhandle', style: { fontSize: 11, fontWeight: 600, color: '#f97316', marginTop: 20, isAccent: true } },
        ],
      },
      {
        background: { type: 'gradient', colors: ['#1a0a2e', '#3d1654'], angle: 150 },
        elements: [
          { type: 'text', label: 'Section', content: 'WHAT I DO', style: { fontSize: 10, fontWeight: 700, color: '#f97316', letterSpacing: '0.12em', textTransform: 'uppercase', isAccent: true, marginBottom: 10 } },
          { type: 'text', label: 'Service 1', content: '→ Social media strategy', style: { fontSize: 18, fontWeight: 600, color: '#ffffff', marginBottom: 8 } },
          { type: 'text', label: 'Service 2', content: '→ Content creation', style: { fontSize: 18, fontWeight: 600, color: '#ffffff', marginBottom: 8 } },
          { type: 'text', label: 'Service 3', content: '→ Brand consulting', style: { fontSize: 18, fontWeight: 600, color: '#ffffff', marginBottom: 8 } },
          { type: 'text', label: 'Service 4', content: '→ Growth marketing', style: { fontSize: 18, fontWeight: 600, color: '#ffffff' } },
        ],
      },
      {
        background: { type: 'gradient', colors: ['#1a0a2e', '#3d1654'], angle: 150 },
        elements: [
          { type: 'text', label: 'Section', content: 'RESULTS', style: { fontSize: 10, fontWeight: 700, color: '#f97316', letterSpacing: '0.12em', textTransform: 'uppercase', isAccent: true, marginBottom: 10 } },
          { type: 'text', label: 'Result 1', content: '50+ brands helped', style: { fontSize: 20, fontWeight: 700, color: '#ffffff', marginBottom: 6 } },
          { type: 'text', label: 'Result 2', content: '2M+ reach generated', style: { fontSize: 20, fontWeight: 700, color: '#ffffff', marginBottom: 6 } },
          { type: 'text', label: 'Result 3', content: '5x average ROI', style: { fontSize: 20, fontWeight: 700, color: '#ffffff' } },
        ],
      },
      {
        background: { type: 'gradient', colors: ['#1a0a2e', '#3d1654'], angle: 150 },
        elements: [
          { type: 'text', label: 'CTA', content: 'Let\'s work together', style: { fontSize: 26, fontWeight: 800, color: '#ffffff', fontFamily: 'Space Grotesk' } },
          { type: 'divider', style: { width: '40', height: '3', color: '#f97316', margin: '14' } },
          { type: 'text', label: 'CTA Detail', content: 'DM me or click the\nlink in bio to book a call', style: { fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' } },
          { type: 'text', label: 'Handle', content: '@yourhandle', style: { fontSize: 11, fontWeight: 600, color: '#f97316', marginTop: 16, isAccent: true } },
        ],
      },
    ],
  },
  {
    slug: 'how-to-guide',
    name: 'How-To Guide',
    category: 'education',
    description: 'Step-by-step tutorial carousel',
    slides: [
      {
        background: { type: 'gradient', colors: ['#0a192f', '#172a45'], angle: 135 },
        elements: [
          { type: 'text', label: 'Kicker', content: 'HOW-TO GUIDE', style: { fontSize: 10, fontWeight: 700, color: '#818cf8', letterSpacing: '0.12em', textTransform: 'uppercase', isAccent: true, marginBottom: 10 } },
          { type: 'text', label: 'Title', content: 'How to Start\na Newsletter\nin 2025', style: { fontSize: 26, fontWeight: 800, color: '#e6f1ff', fontFamily: 'Space Grotesk', lineHeight: '1.15' } },
          { type: 'divider', style: { width: '40', height: '3', color: '#818cf8', margin: '14' } },
          { type: 'text', label: 'Subtitle', content: 'A beginner-friendly walkthrough', style: { fontSize: 13, fontWeight: 400, color: 'rgba(230,241,255,0.6)' } },
        ],
      },
      ...[
        ['Step 1', 'Choose your niche', 'Pick a topic you can write about consistently for 100+ issues.'],
        ['Step 2', 'Pick a platform', 'Substack, Beehiiv, or ConvertKit — all free to start.'],
        ['Step 3', 'Write your first 3 issues', 'Draft them before you launch so you have momentum.'],
        ['Step 4', 'Launch & promote', 'Share on social, tell your network, and ask for shares.'],
      ].map(([step, title, body]) => ({
        background: { type: 'gradient', colors: ['#0a192f', '#172a45'], angle: 135 },
        elements: [
          { type: 'text', label: 'Step Label', content: step, style: { fontSize: 11, fontWeight: 700, color: '#818cf8', letterSpacing: '0.1em', textTransform: 'uppercase', isAccent: true, marginBottom: 8 } },
          { type: 'text', label: 'Step Title', content: title, style: { fontSize: 22, fontWeight: 700, color: '#e6f1ff', fontFamily: 'Space Grotesk', lineHeight: '1.2' } },
          { type: 'divider', style: { width: '30', height: '2', color: '#818cf8', margin: '10' } },
          { type: 'text', label: 'Step Body', content: body, style: { fontSize: 13, fontWeight: 400, color: 'rgba(230,241,255,0.7)', lineHeight: '1.55', maxWidth: '85%' } },
        ],
      })),
    ],
  },
  {
    slug: 'before-after',
    name: 'Before / After',
    category: 'marketing',
    description: 'Show a transformation or comparison',
    slides: [
      {
        background: { type: 'gradient', colors: ['#2a0a0a', '#6b1a12'], angle: 135 },
        elements: [
          { type: 'text', label: 'Title', content: 'Before vs After', style: { fontSize: 28, fontWeight: 800, color: '#ffffff', fontFamily: 'Space Grotesk', lineHeight: '1.1' } },
          { type: 'divider', style: { width: '40', height: '3', color: '#fbbf24', margin: '14' } },
          { type: 'text', label: 'Subtitle', content: 'The transformation your brand needs', style: { fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.65)' } },
        ],
      },
      {
        background: { type: 'gradient', colors: ['#1a1a1a', '#2a1a1a'], angle: 135 },
        elements: [
          { type: 'text', label: 'Label', content: 'BEFORE', style: { fontSize: 12, fontWeight: 800, color: '#ef4444', letterSpacing: '0.12em', textTransform: 'uppercase', isAccent: true, marginBottom: 10 } },
          { type: 'text', label: 'Before Point 1', content: '✗ Generic, boring content', style: { fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: 8 } },
          { type: 'text', label: 'Before Point 2', content: '✗ Low engagement rates', style: { fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: 8 } },
          { type: 'text', label: 'Before Point 3', content: '✗ No brand consistency', style: { fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.7)' } },
        ],
      },
      {
        background: { type: 'gradient', colors: ['#0d1b0e', '#1a3a1c'], angle: 135 },
        elements: [
          { type: 'text', label: 'Label', content: 'AFTER', style: { fontSize: 12, fontWeight: 800, color: '#22c55e', letterSpacing: '0.12em', textTransform: 'uppercase', isAccent: true, marginBottom: 10 } },
          { type: 'text', label: 'After Point 1', content: '✓ Scroll-stopping visuals', style: { fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.85)', marginBottom: 8 } },
          { type: 'text', label: 'After Point 2', content: '✓ 5× more saves & shares', style: { fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.85)', marginBottom: 8 } },
          { type: 'text', label: 'After Point 3', content: '✓ Cohesive brand identity', style: { fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.85)' } },
        ],
      },
      {
        background: { type: 'gradient', colors: ['#2a0a0a', '#6b1a12'], angle: 135 },
        elements: [
          { type: 'text', label: 'CTA', content: 'Ready for your\ntransformation?', style: { fontSize: 24, fontWeight: 800, color: '#ffffff', fontFamily: 'Space Grotesk', lineHeight: '1.2' } },
          { type: 'divider', style: { width: '40', height: '3', color: '#fbbf24', margin: '14' } },
          { type: 'text', label: 'CTA Detail', content: 'Link in bio →', style: { fontSize: 14, fontWeight: 600, color: '#fbbf24', isAccent: true } },
        ],
      },
    ],
  },
  {
    slug: 'listicle-tools',
    name: 'Top Tools Listicle',
    category: 'tips',
    description: 'Share your favourite tools, apps, or resources',
    slides: [
      {
        background: { type: 'gradient', colors: ['#0d1224', '#172138'], angle: 135 },
        elements: [
          { type: 'text', label: 'Kicker', content: 'TOOLS I USE DAILY', style: { fontSize: 10, fontWeight: 700, color: '#9b7bff', letterSpacing: '0.12em', textTransform: 'uppercase', isAccent: true, marginBottom: 10 } },
          { type: 'text', label: 'Title', content: '7 Free Tools\nEvery Creator Needs', style: { fontSize: 26, fontWeight: 800, color: '#ffffff', fontFamily: 'Space Grotesk', lineHeight: '1.15' } },
          { type: 'divider', style: { width: '40', height: '3', color: '#9b7bff', margin: '14' } },
          { type: 'text', label: 'Subtitle', content: 'Save this for later ↓', style: { fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)' } },
        ],
      },
      ...[
        ['01', 'Canva', 'Quick graphics and presentations'],
        ['02', 'Notion', 'All-in-one workspace for notes and planning'],
        ['03', 'CapCut', 'Free video editing with pro features'],
      ].map(([num, tool, desc]) => ({
        background: { type: 'gradient', colors: ['#0d1224', '#172138'], angle: 135 },
        elements: [
          { type: 'number', content: num, style: { fontSize: 48, fontWeight: 900, color: 'rgba(155,123,255,0.12)', fontFamily: 'Space Grotesk', marginBottom: 4 } },
          { type: 'text', label: 'Tool Name', content: tool, style: { fontSize: 24, fontWeight: 700, color: '#ffffff', fontFamily: 'Space Grotesk' } },
          { type: 'divider', style: { width: '30', height: '2', color: '#9b7bff', margin: '10' } },
          { type: 'text', label: 'Description', content: desc, style: { fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.65)', lineHeight: '1.5' } },
        ],
      })),
    ],
  },
  {
    slug: 'myth-vs-fact',
    name: 'Myth vs Fact',
    category: 'education',
    description: 'Debunk myths in your niche',
    slides: [
      {
        background: { type: 'gradient', colors: ['#1e293b', '#334155'], angle: 135 },
        elements: [
          { type: 'text', label: 'Title', content: 'Myth vs Fact', style: { fontSize: 30, fontWeight: 900, color: '#ffffff', fontFamily: 'Space Grotesk' } },
          { type: 'divider', style: { width: '50', height: '3', color: '#818cf8', margin: '14' } },
          { type: 'text', label: 'Subtitle', content: '5 common myths debunked', style: { fontSize: 14, fontWeight: 400, color: 'rgba(241,245,249,0.6)' } },
        ],
      },
      ...[
        ['You need 10K followers to make money', 'You can monetise with 500 engaged followers via digital products'],
        ['Posting more = more growth', 'Posting better > posting more. Quality beats quantity every time'],
        ['Hashtags are dead', 'They still work — but only when they\'re niche and relevant'],
      ].map(([myth, fact]) => ({
        background: { type: 'gradient', colors: ['#1e293b', '#334155'], angle: 135 },
        elements: [
          { type: 'text', label: 'Myth Label', content: 'MYTH', style: { fontSize: 10, fontWeight: 800, color: '#ef4444', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 } },
          { type: 'text', label: 'Myth', content: `"${myth}"`, style: { fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.5)', lineHeight: '1.4', marginBottom: 16 } },
          { type: 'divider', style: { width: '60', height: '1', color: 'rgba(255,255,255,0.15)', margin: '6' } },
          { type: 'text', label: 'Fact Label', content: 'FACT', style: { fontSize: 10, fontWeight: 800, color: '#22c55e', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 10, marginBottom: 6 } },
          { type: 'text', label: 'Fact', content: fact, style: { fontSize: 16, fontWeight: 600, color: '#f1f5f9', lineHeight: '1.4' } },
        ],
      })),
    ],
  },
  {
    slug: 'announcement-minimal',
    name: 'Minimal Announcement',
    category: 'general',
    description: 'Clean, minimal announcement or update post',
    slides: [
      {
        background: { type: 'gradient', colors: ['#f8fafc', '#e2e8f0'], angle: 180 },
        elements: [
          { type: 'text', label: 'Kicker', content: 'ANNOUNCEMENT', style: { fontSize: 10, fontWeight: 700, color: '#6d6bff', letterSpacing: '0.14em', textTransform: 'uppercase', isAccent: true, marginBottom: 12 } },
          { type: 'text', label: 'Title', content: 'Something big\nis coming...', style: { fontSize: 30, fontWeight: 800, color: '#0f172a', fontFamily: 'Space Grotesk', lineHeight: '1.1' } },
          { type: 'divider', style: { width: '40', height: '3', color: '#6d6bff', margin: '16' } },
          { type: 'text', label: 'Date', content: 'Launching July 15, 2025', style: { fontSize: 14, fontWeight: 500, color: '#64748b' } },
          { type: 'text', label: 'Handle', content: '@yourbrand', style: { fontSize: 11, fontWeight: 600, color: '#6d6bff', marginTop: 20, isAccent: true } },
        ],
      },
      {
        background: { type: 'gradient', colors: ['#f8fafc', '#e2e8f0'], angle: 180 },
        elements: [
          { type: 'text', label: 'Detail Title', content: 'What to expect', style: { fontSize: 22, fontWeight: 800, color: '#0f172a', fontFamily: 'Space Grotesk', marginBottom: 14 } },
          { type: 'text', label: 'Point 1', content: '→ New features', style: { fontSize: 16, fontWeight: 500, color: '#334155', marginBottom: 8 } },
          { type: 'text', label: 'Point 2', content: '→ Better experience', style: { fontSize: 16, fontWeight: 500, color: '#334155', marginBottom: 8 } },
          { type: 'text', label: 'Point 3', content: '→ More value', style: { fontSize: 16, fontWeight: 500, color: '#334155' } },
        ],
      },
      {
        background: { type: 'gradient', colors: ['#f8fafc', '#e2e8f0'], angle: 180 },
        elements: [
          { type: 'text', label: 'CTA', content: 'Stay tuned', style: { fontSize: 26, fontWeight: 800, color: '#0f172a', fontFamily: 'Space Grotesk' } },
          { type: 'divider', style: { width: '40', height: '3', color: '#6d6bff', margin: '14' } },
          { type: 'text', label: 'CTA Detail', content: 'Follow for updates', style: { fontSize: 14, fontWeight: 500, color: '#64748b' } },
          { type: 'text', label: 'Handle', content: '@yourbrand', style: { fontSize: 11, fontWeight: 600, color: '#6d6bff', marginTop: 16, isAccent: true } },
        ],
      },
    ],
  },
];

async function seed() {
  console.log('Seeding carousel templates...');
  for (const t of TEMPLATES) {
    const exists = await db.get('SELECT id FROM carousel_templates WHERE slug = $1', [t.slug]);
    if (exists) {
      await db.run(
        `UPDATE carousel_templates SET name=$1, category=$2, description=$3, slides=$4, is_free=$5, updated_at=NOW() WHERE slug=$6`,
        [t.name, t.category, t.description, JSON.stringify(t.slides), t.is_free || false, t.slug]
      );
      console.log(`  updated: ${t.slug}`);
    } else {
      await db.run(
        `INSERT INTO carousel_templates (slug, name, category, description, slides, is_free) VALUES ($1,$2,$3,$4,$5,$6)`,
        [t.slug, t.name, t.category, t.description, JSON.stringify(t.slides), t.is_free || false]
      );
      console.log(`  created: ${t.slug}`);
    }
  }

  const productExists = await db.get("SELECT id FROM courses WHERE slug = 'carousel-editor'");
  if (!productExists) {
    await db.run(
      `INSERT INTO courses (slug, title, short_description, description, original_price, discounted_price, kind, is_published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE)`,
      [
        'carousel-editor',
        'Carousel & Post Editor Pro',
        'Create stunning social media carousels and posts with 100+ templates. One-time purchase, no subscription.',
        'A browser-based carousel and post-graphic editor with 100+ pre-built templates. Edit text, swap brand colors, upload your logo, and export print-ready PNGs at 1080x1350. Pay once, get a license key, unlock everything forever. No account needed, no monthly fees.',
        1699,
        499,
        'product',
      ]
    );
    console.log('  created carousel-editor product in courses table');
  } else {
    await db.run(
      `UPDATE courses SET discounted_price=499, original_price=1699, is_published=TRUE, updated_at=NOW() WHERE slug='carousel-editor'`,
    );
    console.log('  updated carousel-editor product pricing');
  }

  console.log(`Done. ${TEMPLATES.length} templates seeded.`);
}

seed().then(() => db.close()).catch(async (e) => { console.error(e); await db.close(); process.exit(1); });
