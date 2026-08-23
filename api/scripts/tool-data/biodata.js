// Marriage biodata templates. `data.theme` colours drive the whole design;
// `sections` are the editable label/value rows.
const PERSONAL = [
  { label: 'Full Name', value: 'Your Name' }, { label: 'Date of Birth', value: '01 Jan 1996' },
  { label: 'Time of Birth', value: '10:30 AM' }, { label: 'Place of Birth', value: 'City' },
  { label: 'Height', value: "5' 8\"" }, { label: 'Blood Group', value: 'O+' },
  { label: 'Complexion', value: 'Fair' }, { label: 'Education', value: 'B.Tech' },
  { label: 'Occupation', value: 'Software Engineer' }, { label: 'Annual Income', value: '₹12 LPA' },
];
const FAMILY = [
  { label: "Father's Name", value: 'Mr. Father Name' }, { label: "Father's Occupation", value: 'Business' },
  { label: "Mother's Name", value: 'Mrs. Mother Name' }, { label: "Mother's Occupation", value: 'Homemaker' },
  { label: 'Siblings', value: '1 Brother, 1 Sister' }, { label: 'Native Place', value: 'City, State' },
];
const HOROSCOPE = [
  { label: 'Rashi', value: 'Simha' }, { label: 'Nakshatra', value: 'Magha' },
  { label: 'Gotra', value: 'Kashyap' }, { label: 'Manglik', value: 'No' },
];
const CONTACT = [
  { label: 'Contact Person', value: 'Father' }, { label: 'Phone', value: '+91 90000 00000' },
  { label: 'Address', value: 'Full postal address' },
];
function sections(withHoroscope) {
  const s = [{ title: 'Personal Details', fields: PERSONAL }, { title: 'Family Details', fields: FAMILY }];
  if (withHoroscope) s.push({ title: 'Horoscope', fields: HOROSCOPE });
  s.push({ title: 'Contact Details', fields: CONTACT });
  return JSON.parse(JSON.stringify(s));
}
function tpl(theme, extra) {
  return Object.assign({ headingFont: 'Playfair Display', bodyFont: 'Inter', ornament: 'lotus', deity: '॥ श्री गणेशाय नमः ॥', showDeity: true }, theme, extra || {});
}

module.exports = {
  product: 'biodata',
  templates: [
    { slug: 'traditional-gold', name: 'Traditional Gold', category: 'traditional', is_free: true, sort_order: 1,
      description: 'Classic ivory & gold with deity header and horoscope',
      data: { title: 'Marriage Biodata', showPhoto: true, theme: tpl({ bg: '#fffdf6', bg2: '#f7edd4', accent: '#a5842f', text: '#5b4a2a', heading: '#7a5c1c' }), sections: sections(true) } },

    { slug: 'rose-elegant', name: 'Rose Elegant', category: 'modern', is_free: true, sort_order: 2,
      description: 'Soft rose tones with floral ornament',
      data: { title: 'Bio-Data', showPhoto: true, theme: tpl({ bg: '#fdf5f7', bg2: '#f6dfe8', accent: '#b3567a', text: '#6b2f45', heading: '#8a2f52', ornament: 'floral', showDeity: false }), sections: sections(false) } },

    { slug: 'royal-blue', name: 'Royal Blue', category: 'modern', is_free: true, sort_order: 3,
      description: 'Clean modern blue, no deity line',
      data: { title: 'Biodata', showPhoto: true, theme: tpl({ bg: '#f3f7ff', bg2: '#dde8fb', accent: '#3a5bbf', text: '#2f3f6b', heading: '#243a7a', ornament: 'diamond', headingFont: 'Space Grotesk', showDeity: false }), sections: sections(false) } },

    { slug: 'sandal-green', name: 'Sandal Green', category: 'traditional', sort_order: 4,
      description: 'Auspicious green with Ganesh vandana',
      data: { title: 'Marriage Biodata', showPhoto: true, theme: tpl({ bg: '#f6f8ef', bg2: '#e6efd6', accent: '#5c8a2f', text: '#3f4a2a', heading: '#3d5c1c', deity: '॥ श्री गणेशाय नमः ॥' }), sections: sections(true) } },

    { slug: 'maroon-classic', name: 'Maroon Classic', category: 'traditional', sort_order: 5,
      description: 'Rich maroon with Cinzel headings',
      data: { title: 'Marriage Biodata', showPhoto: true, theme: tpl({ bg: '#fdf3f1', bg2: '#f3d9d2', accent: '#9a3b2e', text: '#5a2a22', heading: '#7a271c', headingFont: 'Cinzel', ornament: 'star' }), sections: sections(true) } },

    { slug: 'minimal-white', name: 'Minimal White', category: 'modern', sort_order: 6,
      description: 'Understated monochrome, photo-forward',
      data: { title: 'Biodata', showPhoto: true, theme: tpl({ bg: '#ffffff', bg2: '#f1f1f1', accent: '#333333', text: '#2a2a2a', heading: '#111111', ornament: 'none', headingFont: 'Space Grotesk', showDeity: false }), sections: sections(false) } },

    { slug: 'lavender-soft', name: 'Lavender Soft', category: 'modern', sort_order: 7,
      description: 'Gentle lavender, great for brides',
      data: { title: 'Bio-Data', showPhoto: true, theme: tpl({ bg: '#f7f5fd', bg2: '#e6dff8', accent: '#6d4fb3', text: '#3f3364', heading: '#4a2f8a', ornament: 'floral', showDeity: false }), sections: sections(false) } },

    { slug: 'peach-warm', name: 'Peach Warm', category: 'modern', sort_order: 8,
      description: 'Warm peach with lotus accents',
      data: { title: 'Marriage Biodata', showPhoto: true, theme: tpl({ bg: '#fff6f0', bg2: '#fbe1cf', accent: '#c56a2c', text: '#63432a', heading: '#8a4a1c' }), sections: sections(true) } },
  ],
};
