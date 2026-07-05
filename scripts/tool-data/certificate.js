// Bulk certificate templates. `data.theme` colours drive the whole design;
// `title`/`intro`/`subline` carry {{name}}, {{course}}, {{date}} placeholders
// that are substituted per recipient. Landscape 1414x1000.
function tpl(theme, extra) {
  return Object.assign({
    title: 'Certificate of Completion',
    intro: 'This certificate is proudly presented to',
    subline: 'for successfully completing {{course}}',
    fields: { course: 'Web Development Bootcamp', date: '2026', signatory: 'Program Director', org: 'Your Organization' },
    showLogo: true,
    showSeal: true,
  }, extra || {}, { theme });
}

module.exports = {
  product: 'certificate',
  templates: [
    { slug: 'classic-gold', name: 'Classic Gold', category: 'classic', is_free: true, sort_order: 1,
      description: 'Timeless ivory & gold with ornate double border and seal',
      dimensions: { width: 1414, height: 1000 },
      data: tpl({ bg: '#fffdf5', bg2: '#f7edcf', border: '#b08d2f', accent: '#a5842f', text: '#5b4a2a', headingFont: 'Playfair Display' }) },

    { slug: 'elegant-blue', name: 'Elegant Blue', category: 'classic', is_free: true, sort_order: 2,
      description: 'Soft blue tones with a refined, professional frame',
      dimensions: { width: 1414, height: 1000 },
      data: tpl({ bg: '#f5f9ff', bg2: '#dde9fb', border: '#3a5bbf', accent: '#3a5bbf', text: '#2f3f6b', headingFont: 'Cinzel' }) },

    { slug: 'modern-minimal', name: 'Modern Minimal', category: 'modern', is_free: true, sort_order: 3,
      description: 'Clean monochrome, thin border, contemporary type',
      dimensions: { width: 1414, height: 1000 },
      data: tpl({ bg: '#ffffff', bg2: '#f2f2f2', border: '#222222', accent: '#111111', text: '#2a2a2a', headingFont: 'Space Grotesk' }, { showSeal: false }) },

    { slug: 'formal-navy', name: 'Formal Navy', category: 'classic', sort_order: 4,
      description: 'Deep navy with gold accents for official awards',
      dimensions: { width: 1414, height: 1000 },
      data: tpl({ bg: '#f4f6fb', bg2: '#dfe4f0', border: '#1e2a4a', accent: '#c9a227', text: '#25304f', headingFont: 'Cinzel' }) },

    { slug: 'achievement-purple', name: 'Achievement Purple', category: 'modern', sort_order: 5,
      description: 'Elegant lavender with a celebratory feel',
      dimensions: { width: 1414, height: 1000 },
      data: tpl({ bg: '#f8f5fd', bg2: '#e7ddf8', border: '#6d4fb3', accent: '#6d4fb3', text: '#3f3364', headingFont: 'Playfair Display' }) },

    { slug: 'corporate-teal', name: 'Corporate Teal', category: 'modern', sort_order: 6,
      description: 'Fresh teal, crisp lines — great for training batches',
      dimensions: { width: 1414, height: 1000 },
      data: tpl({ bg: '#f2fbfa', bg2: '#d3efec', border: '#0f7c72', accent: '#0f7c72', text: '#204a46', headingFont: 'Space Grotesk' }) },
  ],
};
