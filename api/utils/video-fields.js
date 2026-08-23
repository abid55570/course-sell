// Pure validation/sanitization for buyer-submitted video customization data.
// A template's `fields_schema` is an array of field definitions; this module
// validates submitted values against it and returns cleaned output. No DB, no
// side effects -> fully unit-testable.

const FIELD_TYPES = ['text', 'textarea', 'date', 'time', 'phone', 'select', 'color', 'events'];

const CONTROL_CHARS = new RegExp('[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]', 'g');

function stripControl(s) {
  // Drop ASCII control chars but keep newline and tab; collapse runs of
  // spaces/tabs without eating newlines.
  return String(s).replace(CONTROL_CHARS, '').replace(/[ \t]+/g, ' ');
}

function sanitizeString(v, max) {
  let s = stripControl(v ?? '').trim();
  if (max && s.length > max) s = s.slice(0, max);
  return s;
}

function isValidDate(s) {
  // Accept YYYY-MM-DD (what <input type=date> submits).
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime());
}

function isValidTime(s) {
  return /^([01]?\d|2[0-3]):[0-5]\d$/.test(s);
}

function isValidPhone(s) {
  const digits = s.replace(/[^\d]/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

function isValidHexColor(s) {
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s);
}

/**
 * @param {Array} schema  field definitions [{key,label,type,required,max,options,maxItems,fields}]
 * @param {Object} data   submitted values keyed by field key
 * @returns {{ ok:boolean, errors:Object, cleaned:Object }}
 */
function validateProjectData(schema, data) {
  const errors = {};
  const cleaned = {};
  const src = data && typeof data === 'object' ? data : {};

  for (const field of Array.isArray(schema) ? schema : []) {
    const { key, type, required, max, options } = field;
    if (!key || !FIELD_TYPES.includes(type)) continue;
    const raw = src[key];
    const isEmpty =
      raw === undefined ||
      raw === null ||
      (typeof raw === 'string' && raw.trim() === '') ||
      (type === 'events' && (!Array.isArray(raw) || raw.length === 0));

    if (isEmpty) {
      if (required) errors[key] = `${field.label || key} is required`;
      continue;
    }

    switch (type) {
      case 'text':
      case 'textarea': {
        cleaned[key] = sanitizeString(raw, max || (type === 'textarea' ? 500 : 120));
        break;
      }
      case 'date': {
        const s = sanitizeString(raw, 10);
        if (!isValidDate(s)) errors[key] = `${field.label || key} must be a valid date`;
        else cleaned[key] = s;
        break;
      }
      case 'time': {
        const s = sanitizeString(raw, 5);
        if (!isValidTime(s)) errors[key] = `${field.label || key} must be a valid time`;
        else cleaned[key] = s;
        break;
      }
      case 'phone': {
        const s = sanitizeString(raw, 20);
        if (!isValidPhone(s)) errors[key] = `${field.label || key} must be a valid phone number`;
        else cleaned[key] = s;
        break;
      }
      case 'select': {
        const s = sanitizeString(raw, 60);
        const allowed = Array.isArray(options) ? options.map((o) => (typeof o === 'string' ? o : o.value)) : [];
        if (allowed.length && !allowed.includes(s)) errors[key] = `${field.label || key} is not a valid choice`;
        else cleaned[key] = s;
        break;
      }
      case 'color': {
        const s = sanitizeString(raw, 7);
        if (!isValidHexColor(s)) errors[key] = `${field.label || key} must be a hex colour`;
        else cleaned[key] = s;
        break;
      }
      case 'events': {
        const maxItems = field.maxItems || 6;
        const sub = Array.isArray(field.fields) ? field.fields : [];
        const items = raw
          .slice(0, maxItems)
          .map((item) => {
            const row = {};
            for (const sf of sub) {
              const val = item && item[sf.key];
              if (val === undefined || val === null || String(val).trim() === '') continue;
              if (sf.type === 'date') {
                if (isValidDate(String(val))) row[sf.key] = String(val);
              } else if (sf.type === 'time') {
                if (isValidTime(String(val))) row[sf.key] = String(val);
              } else {
                row[sf.key] = sanitizeString(val, sf.max || 80);
              }
            }
            return row;
          })
          .filter((row) => Object.keys(row).length > 0);
        cleaned[key] = items;
        break;
      }
      default:
        break;
    }
  }

  // Pass buyer-added custom text lines through (not part of the fixed schema).
  if (src.custom_texts !== undefined) {
    cleaned.custom_texts = validateCustomTexts(src.custom_texts);
  }

  return { ok: Object.keys(errors).length === 0, errors, cleaned };
}

/**
 * Validate buyer style overrides. Keeps only a known palette name and valid
 * hex colours; silently drops anything else.
 * @param {object} style           { palette, accent, bg, bgTo }
 * @param {string[]} paletteNames  allowed palette keys
 */
const FRAME_STYLES = ['none', 'single', 'inset', 'double'];

function validateStyle(style, paletteNames) {
  const out = {};
  if (!style || typeof style !== 'object') return out;
  if (style.palette && Array.isArray(paletteNames) && paletteNames.includes(style.palette)) {
    out.palette = style.palette;
  }
  for (const k of ['accent', 'bg', 'bgTo']) {
    if (style[k] && isValidHexColor(String(style[k]))) out[k] = String(style[k]);
  }
  if (style.frame && FRAME_STYLES.includes(style.frame)) out.frame = style.frame;
  return out;
}

const CUSTOM_TEXT_STYLES = ['heading', 'normal', 'small'];

// Buyer-added free-form text lines. Kept separate from the template's fixed
// fields so any template can accept extra text the buyer wants on the card.
function validateCustomTexts(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((x) => ({
      text: sanitizeString(x && x.text, 120),
      style: CUSTOM_TEXT_STYLES.includes(x && x.style) ? x.style : 'normal',
    }))
    .filter((x) => x.text)
    .slice(0, 6);
}

module.exports = {
  FIELD_TYPES,
  sanitizeString,
  isValidDate,
  isValidTime,
  isValidPhone,
  isValidHexColor,
  validateProjectData,
  validateStyle,
  validateCustomTexts,
  FRAME_STYLES,
  CUSTOM_TEXT_STYLES,
};
