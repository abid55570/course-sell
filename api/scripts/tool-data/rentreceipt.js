// Rent receipt templates. These are text-heavy PDFs generated with jsPDF, so a
// template is just a small style descriptor (layout + accent + heading font).
// The actual receipt content comes from the form the user fills in the editor.
module.exports = {
  product: 'rentreceipt',
  templates: [
    { slug: 'simple', name: 'Simple', category: 'plain', is_free: true, sort_order: 1,
      description: 'Clean, no-frills receipt — just the essentials an HR/CA needs.',
      data: { style: 'simple', accent: '#2f6b4f', headingFont: 'helvetica', note: '' } },

    { slug: 'bordered', name: 'Bordered', category: 'formal', is_free: false, sort_order: 2,
      description: 'Framed receipt with a header rule — looks official on file.',
      data: { style: 'bordered', accent: '#3a5bbf', headingFont: 'helvetica', note: '' } },

    { slug: 'classic', name: 'Classic', category: 'formal', is_free: false, sort_order: 3,
      description: 'Serif heading, boxed amount — a traditional rent-book look.',
      data: { style: 'bordered', accent: '#9a3b2e', headingFont: 'times', note: '' } },
  ],
};
