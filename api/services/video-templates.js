// Built-in template catalog + render-model mappers.
//
// DATA that varies per template (fields, palette, price, category) lives here
// and is seeded into the DB. CODE that turns a template's cleaned field values
// into the normalized render model lives here too, keyed by `composition_id`.
//
// Buyers can further customise the look: they pick a palette and (optionally)
// override the accent / background colours. Those overrides arrive as `style`
// and are applied on top of the template's default palette in buildRenderModel.

const CATEGORIES = [
  { slug: 'wedding', name: 'Wedding', icon: '\u{1F492}', sort_order: 1 },
  { slug: 'engagement', name: 'Engagement / Roka', icon: '\u{1F48D}', sort_order: 2 },
  { slug: 'save-the-date', name: 'Save the Date', icon: '\u{1F4C5}', sort_order: 3 },
  { slug: 'anniversary', name: 'Anniversary', icon: '\u{2764}', sort_order: 4 },
  { slug: 'birthday', name: 'Birthday', icon: '\u{1F382}', sort_order: 5 },
  { slug: 'baby-shower', name: 'Baby Shower', icon: '\u{1F476}', sort_order: 6 },
  { slug: 'griha-pravesh', name: 'Griha Pravesh', icon: '\u{1F3E1}', sort_order: 7 },
  { slug: 'new-year', name: 'New Year', icon: '\u{1F386}', sort_order: 8 },
  { slug: 'festival', name: 'Festival Greeting', icon: '\u{1FA94}', sort_order: 9 },
  { slug: 'business', name: 'Business Greeting', icon: '\u{1F3E2}', sort_order: 10 },
];

// Palettes (all dark-bg / light-text so text stays readable, incl. over photos).
// Values are hex WITHOUT the leading '#'.
const PALETTES = {
  royal: { bg: '1a1130', bgTo: '3b1d5e', text: 'f7f0ff', accent: 'e6c15a', label: 'Royal Purple' },
  pastel: { bg: '3a2a3f', bgTo: '6d4a5f', text: 'fff5fa', accent: 'f4b8cf', label: 'Pastel Rose' },
  emerald: { bg: '06231d', bgTo: '0e4a3a', text: 'f0fff8', accent: 'e6c15a', label: 'Emerald Gold' },
  midnight: { bg: '0b1026', bgTo: '1b2450', text: 'eef2ff', accent: 'ffd76a', label: 'Midnight Blue' },
  festive: { bg: '2a0a0a', bgTo: '6b1a12', text: 'fff4e6', accent: 'ffcf5a', label: 'Festive Red' },
  rose: { bg: '2a0f1c', bgTo: '5e2440', text: 'fff0f6', accent: 'f7a8c4', label: 'Rose Blush' },
  teal: { bg: '04232b', bgTo: '0a4a52', text: 'eafffb', accent: '6fe3d2', label: 'Teal Mint' },
  noir: { bg: '0a0a0d', bgTo: '1c1c22', text: 'f4f4f6', accent: 'c9a24a', label: 'Black & Gold' },
  sunset: { bg: '2b1206', bgTo: '6e2a10', text: 'fff3e8', accent: 'ff9e5a', label: 'Sunset Amber' },
  plum: { bg: '1c0f2e', bgTo: '4a2170', text: 'f6efff', accent: 'd9b3ff', label: 'Plum Violet' },
  forest: { bg: '0c1f12', bgTo: '1d4227', text: 'eefff2', accent: 'bfe3a0', label: 'Forest Green' },
  wine: { bg: '240810', bgTo: '5a1024', text: 'ffeef2', accent: 'e2a3b0', label: 'Wine Maroon' },
  sky: { bg: '0a1a2e', bgTo: '17406b', text: 'eef6ff', accent: '7cc4ff', label: 'Sky Blue' },
};

// ---- Field-schema fragments (buyers fill these; extra text slots included) ----
const WEDDING_FIELDS = [
  { key: 'quote', label: 'Top line / blessing (optional)', type: 'text', required: false, max: 60, group: 'Header' },
  { key: 'bride_name', label: "Bride's name", type: 'text', required: true, max: 30, group: 'Couple' },
  { key: 'groom_name', label: "Groom's name", type: 'text', required: true, max: 30, group: 'Couple' },
  { key: 'wedding_date', label: 'Wedding date', type: 'date', required: true, group: 'When & where' },
  { key: 'wedding_time', label: 'Time', type: 'time', required: false, group: 'When & where' },
  { key: 'venue', label: 'Venue', type: 'textarea', required: false, max: 160, group: 'When & where' },
  { key: 'message', label: 'Invitation message', type: 'textarea', required: false, max: 160, group: 'Message' },
  { key: 'hosts', label: 'Invited by (family names)', type: 'text', required: false, max: 80, group: 'Message' },
  { key: 'rsvp_phone', label: 'RSVP contact', type: 'phone', required: false, group: 'Message' },
  { key: 'hashtag', label: 'Hashtag (optional)', type: 'text', required: false, max: 40, group: 'Message' },
];

const GREETING_FIELDS = [
  { key: 'greeting_title', label: 'Greeting (leave blank for default)', type: 'text', required: false, max: 40, group: 'Greeting' },
  { key: 'subtitle', label: 'Subtitle (optional)', type: 'text', required: false, max: 60, group: 'Greeting' },
  { key: 'message', label: 'Message', type: 'textarea', required: false, max: 160, group: 'Greeting' },
  { key: 'greeting_from', label: 'From (your / business name)', type: 'text', required: true, max: 40, group: 'Greeting' },
  { key: 'footer', label: 'Footer line (optional)', type: 'text', required: false, max: 60, group: 'Greeting' },
];

const BIRTHDAY_FIELDS = [
  { key: 'celebrant', label: 'Name', type: 'text', required: true, max: 30, group: 'Details' },
  { key: 'age', label: 'Turning (age)', type: 'text', required: false, max: 4, group: 'Details' },
  { key: 'party_date', label: 'Party date', type: 'date', required: false, group: 'Details' },
  { key: 'party_time', label: 'Time', type: 'time', required: false, group: 'Details' },
  { key: 'venue', label: 'Venue', type: 'textarea', required: false, max: 160, group: 'Details' },
  { key: 'message', label: 'Message', type: 'textarea', required: false, max: 160, group: 'Details' },
  { key: 'hashtag', label: 'Hashtag (optional)', type: 'text', required: false, max: 40, group: 'Details' },
];

// A flexible "write anything" card: most slots optional so the buyer designs it.
const CLASSIC_FIELDS = [
  { key: 'event_label', label: 'Occasion / header line', type: 'text', required: false, max: 50, group: 'Header' },
  { key: 'quote', label: 'Top line / quote (optional)', type: 'text', required: false, max: 60, group: 'Header' },
  { key: 'title1', label: 'Main name / title', type: 'text', required: true, max: 34, group: 'Main' },
  { key: 'title2', label: 'Second name (optional)', type: 'text', required: false, max: 34, group: 'Main' },
  { key: 'subtitle', label: 'Subtitle (optional)', type: 'text', required: false, max: 60, group: 'Main' },
  { key: 'event_date', label: 'Date', type: 'date', required: false, group: 'When & where' },
  { key: 'event_time', label: 'Time', type: 'time', required: false, group: 'When & where' },
  { key: 'venue', label: 'Venue', type: 'textarea', required: false, max: 160, group: 'When & where' },
  { key: 'message', label: 'Message', type: 'textarea', required: false, max: 180, group: 'Message' },
  { key: 'footer', label: 'Footer line (optional)', type: 'text', required: false, max: 60, group: 'Message' },
  { key: 'hashtag', label: 'Hashtag (optional)', type: 'text', required: false, max: 40, group: 'Message' },
];

// `price_tier` (low / mid / high) resolves to an actual price via the
// VIDEO_PRICE_* env vars (see services/pricing.js), so occasion pricing is
// changed in .env, not here.
const TEMPLATES = [
  // Weddings — premium tier
  { slug: 'wedding-royal', name: 'Royal Wedding', category: 'wedding', composition_id: 'elegant_wedding', duration_seconds: 24, fields_schema: WEDDING_FIELDS, preset: { palette: 'royal', heading: 'Together with their families' }, price_tier: 'high' },
  { slug: 'wedding-pastel', name: 'Pastel Wedding', category: 'wedding', composition_id: 'elegant_wedding', duration_seconds: 24, fields_schema: WEDDING_FIELDS, preset: { palette: 'pastel', heading: 'Request the pleasure of your company' }, price_tier: 'high' },
  { slug: 'wedding-emerald', name: 'Emerald Wedding', category: 'wedding', composition_id: 'elegant_wedding', duration_seconds: 24, fields_schema: WEDDING_FIELDS, preset: { palette: 'emerald', heading: 'Together with their families' }, price_tier: 'high' },
  { slug: 'wedding-rose', name: 'Rose Wedding', category: 'wedding', composition_id: 'elegant_wedding', duration_seconds: 24, fields_schema: WEDDING_FIELDS, preset: { palette: 'rose', heading: 'With love, we invite you' }, price_tier: 'high' },
  { slug: 'wedding-noir', name: 'Black & Gold Wedding', category: 'wedding', composition_id: 'elegant_wedding', duration_seconds: 24, fields_schema: WEDDING_FIELDS, preset: { palette: 'noir', heading: 'Together with their families' }, price_tier: 'high' },
  // Engagement / anniversary / housewarming / baby shower / corporate — mid tier
  { slug: 'engagement-classic', name: 'Engagement Invite', category: 'engagement', composition_id: 'classic', duration_seconds: 20, fields_schema: CLASSIC_FIELDS, preset: { palette: 'plum', heading: 'Engagement Ceremony' }, price_tier: 'mid' },
  { slug: 'anniversary-gold', name: 'Anniversary', category: 'anniversary', composition_id: 'classic', duration_seconds: 20, fields_schema: CLASSIC_FIELDS, preset: { palette: 'wine', heading: 'Happy Anniversary' }, price_tier: 'mid' },
  { slug: 'baby-shower', name: 'Baby Shower', category: 'baby-shower', composition_id: 'classic', duration_seconds: 18, fields_schema: CLASSIC_FIELDS, preset: { palette: 'pastel', heading: 'Baby Shower' }, price_tier: 'mid' },
  { slug: 'griha-pravesh', name: 'Griha Pravesh', category: 'griha-pravesh', composition_id: 'classic', duration_seconds: 18, fields_schema: CLASSIC_FIELDS, preset: { palette: 'forest', heading: 'Griha Pravesh' }, price_tier: 'mid' },
  { slug: 'corporate-greeting', name: 'Corporate Greeting', category: 'business', composition_id: 'greeting', duration_seconds: 16, fields_schema: GREETING_FIELDS, preset: { palette: 'noir', heading: "Season's Greetings" }, price_tier: 'mid' },
  // Save-the-date / birthday / festival greetings — entry tier
  { slug: 'save-the-date', name: 'Save the Date', category: 'save-the-date', composition_id: 'classic', duration_seconds: 18, fields_schema: CLASSIC_FIELDS, preset: { palette: 'sky', heading: 'Save the Date' }, price_tier: 'low' },
  { slug: 'birthday-bash', name: 'Birthday Bash', category: 'birthday', composition_id: 'birthday', duration_seconds: 18, fields_schema: BIRTHDAY_FIELDS, preset: { palette: 'midnight', heading: 'You are invited' }, price_tier: 'low' },
  { slug: 'new-year-gold', name: 'New Year Gold', category: 'new-year', composition_id: 'greeting', duration_seconds: 16, fields_schema: GREETING_FIELDS, preset: { palette: 'midnight', heading: 'Happy New Year' }, price_tier: 'low' },
  { slug: 'diwali-greeting', name: 'Diwali Greeting', category: 'festival', composition_id: 'greeting', duration_seconds: 16, fields_schema: GREETING_FIELDS, preset: { palette: 'festive', heading: 'Happy Diwali' }, price_tier: 'low' },
  { slug: 'holi-greeting', name: 'Holi Greeting', category: 'festival', composition_id: 'greeting', duration_seconds: 16, fields_schema: GREETING_FIELDS, preset: { palette: 'rose', heading: 'Happy Holi' }, price_tier: 'low' },
  { slug: 'eid-greeting', name: 'Eid Greeting', category: 'festival', composition_id: 'greeting', duration_seconds: 16, fields_schema: GREETING_FIELDS, preset: { palette: 'emerald', heading: 'Eid Mubarak' }, price_tier: 'low' },
];

function fmtDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || '';
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${d} ${months[m - 1]} ${y}`;
}

function dateLine(dateIso, time) {
  const d = fmtDate(dateIso);
  if (!d) return '';
  return d + (time ? `  |  ${time}` : '');
}

// Each mapper returns an ordered list of {text, role}. Renderer stacks them.
const MAPPERS = {
  elegant_wedding(c, preset) {
    const el = [];
    if (c.quote) el.push({ text: c.quote, role: 'kicker' });
    if (preset.heading) el.push({ text: preset.heading, role: 'kicker' });
    el.push({ text: c.bride_name || '', role: 'name' });
    el.push({ text: '&', role: 'amp' });
    el.push({ text: c.groom_name || '', role: 'name' });
    const dl = dateLine(c.wedding_date, c.wedding_time);
    if (dl) el.push({ text: dl, role: 'detail' });
    if (c.venue) el.push({ text: c.venue, role: 'detail' });
    if (c.message) el.push({ text: c.message, role: 'message' });
    if (c.hosts) el.push({ text: c.hosts, role: 'small' });
    if (c.rsvp_phone) el.push({ text: `RSVP ${c.rsvp_phone}`, role: 'small' });
    if (c.hashtag) el.push({ text: c.hashtag, role: 'small' });
    return el;
  },
  greeting(c, preset) {
    const el = [];
    el.push({ text: c.greeting_title || preset.heading || "Season's Greetings", role: 'name' });
    if (c.subtitle) el.push({ text: c.subtitle, role: 'detail' });
    if (c.message) el.push({ text: c.message, role: 'message' });
    if (c.greeting_from) el.push({ text: `— ${c.greeting_from}`, role: 'detail' });
    if (c.footer) el.push({ text: c.footer, role: 'small' });
    return el;
  },
  birthday(c, preset) {
    const el = [];
    if (preset.heading) el.push({ text: preset.heading, role: 'kicker' });
    el.push({ text: c.celebrant || '', role: 'name' });
    if (c.age) el.push({ text: `turning ${c.age}`, role: 'detail' });
    const dl = dateLine(c.party_date, c.party_time);
    if (dl) el.push({ text: dl, role: 'detail' });
    if (c.venue) el.push({ text: c.venue, role: 'detail' });
    if (c.message) el.push({ text: c.message, role: 'message' });
    if (c.hashtag) el.push({ text: c.hashtag, role: 'small' });
    return el;
  },
  classic(c, preset) {
    const el = [];
    if (c.quote) el.push({ text: c.quote, role: 'kicker' });
    const label = c.event_label || preset.heading;
    if (label) el.push({ text: label, role: 'kicker' });
    el.push({ text: c.title1 || '', role: 'name' });
    if (c.title2) { el.push({ text: '&', role: 'amp' }); el.push({ text: c.title2, role: 'name' }); }
    if (c.subtitle) el.push({ text: c.subtitle, role: 'detail' });
    const dl = dateLine(c.event_date, c.event_time);
    if (dl) el.push({ text: dl, role: 'detail' });
    if (c.venue) el.push({ text: c.venue, role: 'detail' });
    if (c.message) el.push({ text: c.message, role: 'message' });
    if (c.footer) el.push({ text: c.footer, role: 'small' });
    if (c.hashtag) el.push({ text: c.hashtag, role: 'small' });
    return el;
  },
};

function stripHash(h) { return String(h).replace(/^#/, ''); }

/**
 * @param {object} template  { composition_id, preset, duration_seconds }
 * @param {object} cleaned   validated field values
 * @param {object} [style]   buyer overrides: { palette, accent, bg, bgTo, frame }
 * @param {object} [opts]    { duration } — plan-driven length override (canvas
 *                           stays 1080x1920; output resolution is scaled later).
 */
function buildRenderModel(template, cleaned, style, opts) {
  const mapper = MAPPERS[template.composition_id] || MAPPERS.greeting;
  const paletteName = (style && style.palette) || (template.preset && template.preset.palette);
  let palette = PALETTES[paletteName] || PALETTES.royal;
  palette = { ...palette };
  if (style) {
    if (style.accent) palette.accent = stripHash(style.accent);
    if (style.bg) palette.bg = stripHash(style.bg);
    if (style.bgTo) palette.bgTo = stripHash(style.bgTo);
    else if (style.bg) palette.bgTo = stripHash(style.bg);
  }
  const elements = mapper(cleaned, template.preset || {}).filter((e) => e.text && String(e.text).trim());

  // Buyer-added custom text lines are appended after the template content.
  const roleFor = { heading: 'kicker', normal: 'detail', small: 'small' };
  if (Array.isArray(cleaned.custom_texts)) {
    for (const ct of cleaned.custom_texts) {
      if (ct && ct.text && String(ct.text).trim()) {
        elements.push({ text: ct.text, role: roleFor[ct.style] || 'detail' });
      }
    }
  }

  const frame = (style && style.frame) || 'double';
  const duration = (opts && opts.duration) || template.duration_seconds || 20;
  return { width: 1080, height: 1920, fps: 30, duration, palette, elements, frame };
}

module.exports = { CATEGORIES, TEMPLATES, PALETTES, buildRenderModel, fmtDate, _mappers: MAPPERS };
