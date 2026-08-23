// QR Menu & Price List templates. `data.theme` colours + fonts drive the whole
// menu design; `categories[].items[]` are the editable rows. Each template opens
// the editor with a small sample tagline + a couple of categories so the user
// sees example items straight away. `is_free` only tags the theme in the gallery
// — every theme is selectable; the paid gate is PUBLISHING the live QR menu.

function menu(theme, tagline, categories) {
  return {
    theme: Object.assign({ headingFont: 'Poppins' }, theme),
    tagline,
    currency: 'Rs',
    categories: JSON.parse(JSON.stringify(categories)),
  };
}

const CAFE_CATS = [
  { name: 'Coffee', items: [
    { name: 'Cappuccino', price: '120', veg: true, desc: 'Rich espresso with steamed milk foam' },
    { name: 'Cold Brew', price: '150', veg: true, desc: 'Slow-steeped, smooth & bold' },
    { name: 'Cafe Mocha', price: '160', veg: true, desc: 'Espresso, chocolate & milk' },
  ] },
  { name: 'Bites', items: [
    { name: 'Veg Sandwich', price: '110', veg: true, desc: 'Grilled with garden veggies' },
    { name: 'Chicken Panini', price: '180', veg: false, desc: 'Pressed with smoky chicken' },
  ] },
];

const RESTO_CATS = [
  { name: 'Starters', items: [
    { name: 'Paneer Tikka', price: '220', veg: true, desc: 'Char-grilled cottage cheese' },
    { name: 'Chicken 65', price: '260', veg: false, desc: 'Spicy South-Indian fry' },
    { name: 'Veg Manchurian', price: '180', veg: true, desc: 'Crispy balls in tangy sauce' },
  ] },
  { name: 'Main Course', items: [
    { name: 'Butter Chicken', price: '340', veg: false, desc: 'Creamy tomato gravy' },
    { name: 'Dal Makhani', price: '240', veg: true, desc: 'Slow-cooked black lentils' },
    { name: 'Paneer Butter Masala', price: '280', veg: true, desc: 'Rich makhani gravy' },
  ] },
  { name: 'Breads', items: [
    { name: 'Butter Naan', price: '50', veg: true, desc: 'Tandoor-baked, buttered' },
    { name: 'Garlic Roti', price: '45', veg: true, desc: 'Whole-wheat with garlic' },
  ] },
];

const BAKERY_CATS = [
  { name: 'Cakes', items: [
    { name: 'Choco Truffle Slice', price: '140', veg: true, desc: 'Dark chocolate ganache' },
    { name: 'Red Velvet Slice', price: '150', veg: true, desc: 'Cream-cheese frosting' },
  ] },
  { name: 'Breads & Bakes', items: [
    { name: 'Butter Croissant', price: '90', veg: true, desc: 'Flaky, all-butter layers' },
    { name: 'Cheese Garlic Bread', price: '120', veg: true, desc: 'Fresh from the oven' },
  ] },
];

const BAR_CATS = [
  { name: 'Cocktails', items: [
    { name: 'Mojito', price: '320', veg: true, desc: 'Mint, lime & soda' },
    { name: 'Long Island', price: '450', veg: true, desc: 'The house classic' },
  ] },
  { name: 'Small Plates', items: [
    { name: 'Peri Peri Fries', price: '180', veg: true, desc: 'Loaded & spicy' },
    { name: 'Chicken Wings', price: '290', veg: false, desc: 'Smoky BBQ glaze' },
  ] },
];

const MINIMAL_CATS = [
  { name: 'Menu', items: [
    { name: 'House Special', price: '250', veg: true, desc: 'Chef pick of the day' },
    { name: 'Soup of the Day', price: '150', veg: true, desc: 'Ask your server' },
    { name: 'Grilled Chicken Bowl', price: '320', veg: false, desc: 'Greens, grains & protein' },
  ] },
];

module.exports = {
  product: 'qrmenu',
  templates: [
    { slug: 'cafe-warm', name: 'Cafe Warm', category: 'cafe', is_free: true, sort_order: 1,
      description: 'Warm cream & caramel tones for cafes and coffee shops',
      data: menu(
        { bg: '#fdf6ee', bg2: '#f6e7d3', accent: '#b06a2c', text: '#4a382a', cardBg: '#fffdf9', headingFont: 'Poppins' },
        'Freshly brewed, every day',
        CAFE_CATS,
      ) },

    { slug: 'restaurant-dark', name: 'Restaurant Dark', category: 'restaurant', is_free: true, sort_order: 2,
      description: 'Elegant dark theme with gold accents for fine dining',
      data: menu(
        { bg: '#14110f', bg2: '#221b16', accent: '#d4a017', text: '#f3ead9', cardBg: '#1e1813', headingFont: 'Playfair Display' },
        'Authentic flavours, freshly cooked',
        RESTO_CATS,
      ) },

    { slug: 'bakery-pastel', name: 'Bakery Pastel', category: 'bakery', is_free: true, sort_order: 3,
      description: 'Soft pink pastel palette for bakeries and dessert bars',
      data: menu(
        { bg: '#fdf3f6', bg2: '#f8e0ea', accent: '#d6608a', text: '#5c3a48', cardBg: '#fffbfc', headingFont: 'Poppins' },
        'Baked fresh with love',
        BAKERY_CATS,
      ) },

    { slug: 'bar-neon', name: 'Bar Neon', category: 'bar', sort_order: 4,
      description: 'Moody dark bar theme with neon cyan glow',
      data: menu(
        { bg: '#0b0f1a', bg2: '#111a2e', accent: '#2ee6c4', text: '#e6f6f2', cardBg: '#111827', headingFont: 'Space Grotesk' },
        'Sip, snack & unwind',
        BAR_CATS,
      ) },

    { slug: 'minimal-clean', name: 'Minimal Clean', category: 'minimal', sort_order: 5,
      description: 'Understated black-on-white for a modern, clean look',
      data: menu(
        { bg: '#ffffff', bg2: '#f2f2f2', accent: '#111111', text: '#2a2a2a', cardBg: '#ffffff', headingFont: 'Space Grotesk' },
        'Simple. Fresh. Good.',
        MINIMAL_CATS,
      ) },
  ],
};
