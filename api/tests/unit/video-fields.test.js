const { test } = require('node:test');
const assert = require('node:assert');
const { validateProjectData, isValidDate, isValidPhone, isValidHexColor, validateStyle, validateCustomTexts } = require('../../utils/video-fields');

const WEDDING_SCHEMA = [
  { key: 'bride_name', label: 'Bride', type: 'text', required: true, max: 40 },
  { key: 'groom_name', label: 'Groom', type: 'text', required: true, max: 40 },
  { key: 'wedding_date', label: 'Date', type: 'date', required: true },
  { key: 'wedding_time', label: 'Time', type: 'time', required: false },
  { key: 'venue', label: 'Venue', type: 'textarea', required: false, max: 200 },
  { key: 'phone', label: 'RSVP', type: 'phone', required: false },
  { key: 'theme', label: 'Theme', type: 'select', required: false, options: ['royal', 'pastel', 'floral'] },
  { key: 'accent', label: 'Accent', type: 'color', required: false },
  {
    key: 'events', label: 'Events', type: 'events', maxItems: 4,
    fields: [
      { key: 'name', type: 'text', max: 40 },
      { key: 'date', type: 'date' },
      { key: 'venue', type: 'text', max: 80 },
    ],
  },
];

test('valid wedding data passes and is cleaned', () => {
  const { ok, errors, cleaned } = validateProjectData(WEDDING_SCHEMA, {
    bride_name: 'Priya', groom_name: 'Rahul', wedding_date: '2026-11-20',
    wedding_time: '19:30', venue: 'Grand Hyatt, Mumbai', phone: '+91 98765 43210',
    theme: 'royal', accent: '#C9A227',
    events: [{ name: 'Mehndi', date: '2026-11-18', venue: 'Home' }],
  });
  assert.strictEqual(ok, true);
  assert.deepStrictEqual(errors, {});
  assert.strictEqual(cleaned.bride_name, 'Priya');
  assert.strictEqual(cleaned.theme, 'royal');
  assert.strictEqual(cleaned.events.length, 1);
  assert.strictEqual(cleaned.events[0].name, 'Mehndi');
});

test('missing required fields are reported', () => {
  const { ok, errors } = validateProjectData(WEDDING_SCHEMA, { bride_name: 'Priya' });
  assert.strictEqual(ok, false);
  assert.ok(errors.groom_name);
  assert.ok(errors.wedding_date);
  assert.ok(!errors.bride_name);
});

test('invalid date/time/phone/color are rejected', () => {
  const { ok, errors } = validateProjectData(WEDDING_SCHEMA, {
    bride_name: 'A', groom_name: 'B', wedding_date: '20-11-2026',
    wedding_time: '99:99', phone: '123', accent: 'gold',
  });
  assert.strictEqual(ok, false);
  assert.ok(errors.wedding_date);
  assert.ok(errors.wedding_time);
  assert.ok(errors.phone);
  assert.ok(errors.accent);
});

test('select rejects values outside the option list', () => {
  const { ok, errors } = validateProjectData(WEDDING_SCHEMA, {
    bride_name: 'A', groom_name: 'B', wedding_date: '2026-11-20', theme: 'neon',
  });
  assert.strictEqual(ok, false);
  assert.ok(errors.theme);
});

test('text is length-capped and control chars stripped', () => {
  const longName = 'x'.repeat(100);
  const { cleaned } = validateProjectData(WEDDING_SCHEMA, {
    bride_name: longName, groom_name: 'BC', wedding_date: '2026-11-20',
  });
  assert.strictEqual(cleaned.bride_name.length, 40);
  assert.strictEqual(cleaned.groom_name, 'BC');
});

test('events beyond maxItems are truncated and empty rows dropped', () => {
  const many = Array.from({ length: 10 }, (_, i) => ({ name: `E${i}`, date: '2026-11-20' }));
  many.push({ name: '', venue: '' });
  const { cleaned } = validateProjectData(WEDDING_SCHEMA, {
    bride_name: 'A', groom_name: 'B', wedding_date: '2026-11-20', events: many,
  });
  assert.strictEqual(cleaned.events.length, 4);
});

test('validateStyle keeps valid palette, colours and frame; drops junk', () => {
  const out = validateStyle(
    { palette: 'noir', accent: '#ffd166', bg: 'not-a-hex', bgTo: '#101010', frame: 'inset', evil: 'x' },
    ['royal', 'noir', 'teal']
  );
  assert.deepStrictEqual(out, { palette: 'noir', accent: '#ffd166', bgTo: '#101010', frame: 'inset' });
});

test('validateStyle rejects unknown palette and frame', () => {
  const out = validateStyle({ palette: 'neon', frame: 'circle' }, ['royal', 'noir']);
  assert.deepStrictEqual(out, {});
});

test('validateStyle handles empty / non-object input', () => {
  assert.deepStrictEqual(validateStyle(null, ['royal']), {});
  assert.deepStrictEqual(validateStyle('x', ['royal']), {});
});

test('validateCustomTexts trims, coerces style, drops empties, caps at 6', () => {
  const out = validateCustomTexts([
    { text: '  Hello  ', style: 'heading' },
    { text: '', style: 'small' },
    { text: 'plain', style: 'bogus' },
    ...Array.from({ length: 8 }, (_, i) => ({ text: `line${i}`, style: 'small' })),
  ]);
  assert.strictEqual(out.length, 6);
  assert.deepStrictEqual(out[0], { text: 'Hello', style: 'heading' });
  assert.deepStrictEqual(out[1], { text: 'plain', style: 'normal' });
});

test('validateProjectData passes custom_texts through cleaned', () => {
  const { cleaned } = validateProjectData(WEDDING_SCHEMA, {
    bride_name: 'A', groom_name: 'B', wedding_date: '2026-11-20',
    custom_texts: [{ text: 'Extra line', style: 'normal' }],
  });
  assert.strictEqual(cleaned.custom_texts.length, 1);
  assert.strictEqual(cleaned.custom_texts[0].text, 'Extra line');
});

test('helper predicates', () => {
  assert.strictEqual(isValidDate('2026-11-20'), true);
  assert.strictEqual(isValidDate('2026-13-40'), false);
  assert.strictEqual(isValidPhone('+91 98765 43210'), true);
  assert.strictEqual(isValidPhone('12'), false);
  assert.strictEqual(isValidHexColor('#abc'), true);
  assert.strictEqual(isValidHexColor('#C9A227'), true);
  assert.strictEqual(isValidHexColor('red'), false);
});
