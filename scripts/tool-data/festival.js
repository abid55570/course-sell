// Festival offer poster templates. `data.theme` colours + motif drive the whole
// design; `data.brand` is the shop's auto-placed brand bar (logo + name + phone
// + address) that is composited onto every poster. `data.headline` / `offer` /
// `subtext` are the editable poster copy.
function brand(extra) {
  return Object.assign({ shopName: 'Your Shop', phone: '+91 90000 00000', address: 'Shop address, City', tagline: '' }, extra || {});
}
function theme(t) {
  return Object.assign({ headingFont: 'Playfair Display', motif: 'diya' }, t);
}

module.exports = {
  product: 'festival',
  templates: [
    { slug: 'diwali-gold-diya', name: 'Diwali Gold Diya', category: 'diwali', is_free: true, sort_order: 1,
      description: 'Deep maroon & gold Diwali poster with glowing diyas',
      dimensions: { width: 1080, height: 1350 },
      data: {
        festival: 'Diwali', headline: 'Happy Diwali', offer: 'Flat 40% OFF', subtext: 'On all products this festive season',
        theme: theme({ bg: '#2a0a1a', bg2: '#7a1030', accent: '#f7c948', text: '#fff3d6', headingFont: 'Playfair Display', motif: 'diya' }),
        brand: brand({ tagline: 'Wishing you light & prosperity' }),
      } },

    { slug: 'diwali-rangoli-purple', name: 'Diwali Rangoli', category: 'diwali', is_free: true, sort_order: 2,
      description: 'Royal purple Diwali sale with rangoli motif',
      dimensions: { width: 1080, height: 1350 },
      data: {
        festival: 'Diwali', headline: 'Diwali Dhamaka', offer: 'Buy 1 Get 1', subtext: 'Limited period festive offer',
        theme: theme({ bg: '#1a0b2e', bg2: '#5b1a8a', accent: '#ffb347', text: '#f3e8ff', headingFont: 'Cinzel', motif: 'rangoli' }),
        brand: brand(),
      } },

    { slug: 'holi-splash', name: 'Holi Colour Splash', category: 'holi', is_free: true, sort_order: 3,
      description: 'Bright multi-colour Holi celebration poster',
      dimensions: { width: 1080, height: 1350 },
      data: {
        festival: 'Holi', headline: 'Happy Holi', offer: '30% OFF', subtext: 'Add colour to your savings',
        theme: theme({ bg: '#12123a', bg2: '#e91e63', accent: '#22d3ee', text: '#fff7fb', headingFont: 'Space Grotesk', motif: 'flowers' }),
        brand: brand(),
      } },

    { slug: 'eid-mubarak-green', name: 'Eid Mubarak', category: 'eid', is_free: true, sort_order: 4,
      description: 'Elegant green & gold Eid crescent-moon poster',
      dimensions: { width: 1080, height: 1350 },
      data: {
        festival: 'Eid', headline: 'Eid Mubarak', offer: 'Up to 50% OFF', subtext: 'Celebrate with special discounts',
        theme: theme({ bg: '#04241c', bg2: '#0a6b4a', accent: '#e6c15a', text: '#eafff5', headingFont: 'Cinzel', motif: 'moon' }),
        brand: brand({ tagline: 'Eid greetings to you & family' }),
      } },

    { slug: 'rakhi-warm', name: 'Raksha Bandhan', category: 'rakshabandhan', sort_order: 5,
      description: 'Warm saffron Rakhi festival offer poster',
      dimensions: { width: 1080, height: 1350 },
      data: {
        festival: 'Raksha Bandhan', headline: 'Happy Rakhi', offer: 'Flat 25% OFF', subtext: 'Gifts for your loved ones',
        theme: theme({ bg: '#3a1206', bg2: '#c2410c', accent: '#fcd34d', text: '#fff4e6', headingFont: 'Playfair Display', motif: 'flowers' }),
        brand: brand(),
      } },

    { slug: 'new-year-neon', name: 'New Year Neon', category: 'newyear', sort_order: 6,
      description: 'Midnight neon New Year sale with crackers',
      dimensions: { width: 1080, height: 1350 },
      data: {
        festival: 'New Year', headline: 'Happy New Year', offer: 'Mega 60% OFF', subtext: 'Start the year with big savings',
        theme: theme({ bg: '#050816', bg2: '#1e3a8a', accent: '#22d3ee', text: '#eef6ff', headingFont: 'Space Grotesk', motif: 'crackers' }),
        brand: brand({ tagline: 'Cheers to a great year ahead' }),
      } },

    { slug: 'independence-tricolour', name: 'Independence Day', category: 'independenceday', sort_order: 7,
      description: 'Tricolour Independence Day freedom sale',
      dimensions: { width: 1080, height: 1350 },
      data: {
        festival: 'Independence Day', headline: 'Freedom Sale', offer: '15 August Special', subtext: 'Flat 47% OFF storewide',
        theme: theme({ bg: '#0a2818', bg2: '#c2410c', accent: '#ffffff', text: '#f4fff8', headingFont: 'Cinzel', motif: 'none' }),
        brand: brand({ tagline: 'Har Ghar Tiranga' }),
      } },

    { slug: 'ganesh-saffron', name: 'Ganesh Chaturthi', category: 'ganeshchaturthi', sort_order: 8,
      description: 'Devotional saffron Ganesh Chaturthi poster',
      dimensions: { width: 1080, height: 1350 },
      data: {
        festival: 'Ganesh Chaturthi', headline: 'Ganpati Bappa Morya', offer: 'Festive 35% OFF', subtext: 'Blessed offers for you',
        theme: theme({ bg: '#3a1500', bg2: '#b8460a', accent: '#ffd166', text: '#fff3e0', headingFont: 'Cinzel', motif: 'flowers' }),
        brand: brand(),
      } },

    { slug: 'christmas-red-green', name: 'Christmas Sale', category: 'christmas', sort_order: 9,
      description: 'Festive red & green Christmas offer poster',
      dimensions: { width: 1080, height: 1350 },
      data: {
        festival: 'Christmas', headline: 'Merry Christmas', offer: 'Holiday 40% OFF', subtext: 'Season of joy & savings',
        theme: theme({ bg: '#0a2417', bg2: '#9a1717', accent: '#f7c948', text: '#f2fff6', headingFont: 'Playfair Display', motif: 'flowers' }),
        brand: brand({ tagline: 'Warm wishes this Christmas' }),
      } },

    { slug: 'generic-sale-bold', name: 'Generic Mega Sale', category: 'sale', sort_order: 10,
      description: 'Bold high-contrast all-purpose sale poster',
      dimensions: { width: 1080, height: 1350 },
      data: {
        festival: 'Generic Sale', headline: 'Mega Sale', offer: 'Up to 70% OFF', subtext: 'Everything must go — limited time',
        theme: theme({ bg: '#0b0b12', bg2: '#dc2626', accent: '#facc15', text: '#ffffff', headingFont: 'Space Grotesk', motif: 'none' }),
        brand: brand(),
      } },
  ],
};
