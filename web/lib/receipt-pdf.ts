/**
 * A receipt as a real PDF file, built by hand.
 *
 * "Download receipt" used to call window.print(), which opens a print dialog —
 * not a download. This produces an actual file.
 *
 * No PDF library: jsPDF and friends cost 90KB+ gzip, and this store is built
 * for mid-range Android phones on mobile data. A text-only receipt needs one
 * of the 14 standard PDF fonts and no embedding, which is a few hundred lines
 * at most. Cost here is under 2KB.
 *
 * Courier throughout, for two reasons: a thermal receipt is monospace anyway,
 * and a fixed advance width (0.6em for every Courier glyph) makes centring and
 * right-alignment exact arithmetic rather than guessed font metrics.
 *
 * Everything is transliterated to ASCII, so one character is always one byte.
 * That keeps the xref byte offsets below correct without a UTF-16 encoding
 * pass — and the rupee sign is not in WinAnsiEncoding regardless, so a PDF
 * showing "₹" would need an embedded font. It says INR instead, which is what
 * an invoice says.
 */

const PT_PER_MM = 72 / 25.4;
const PAGE_W = 80 * PT_PER_MM; // an 80mm till roll, the width this receipt imitates
const MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;

const SIZE = 9;
const ADVANCE = 0.6; // every Courier glyph, by definition
const COLS = Math.floor(CONTENT_W / (SIZE * ADVANCE));

export type ReceiptData = {
  productTitle: string;
  amount: number;
  orderId: string;
  buyerEmail?: string;
  stamp: string;
};

/** PDF text strings are delimited by parentheses, so those three escape. */
function esc(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/** Standard-14 fonts have no glyph for most of these, so fold them to ASCII. */
export function toAscii(text: string): string {
  return text
    .replace(/₹\s*/g, 'INR ') // rupee sign: absent from WinAnsiEncoding
    .replace(/[‐-―]/g, '-') // hyphens and dashes
    .replace(/[‘’]/g, "'") // curly single quotes
    .replace(/[“”]/g, '"') // curly double quotes
    .replace(/…/g, '...') // ellipsis
    .replace(/[·•]/g, '-') // middle dot, bullet
    .replace(/ /g, ' ') // non-breaking space
    .replace(/[^\x20-\x7E]/g, ''); // anything left has no glyph
}

/** Wrap to the roll width, breaking a word only when it cannot fit alone. */
export function wrap(text: string, cols = COLS): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (!line) line = word;
    else if (line.length + 1 + word.length <= cols) line += ' ' + word;
    else {
      lines.push(line);
      line = word;
    }
    while (line.length > cols) {
      lines.push(line.slice(0, cols));
      line = line.slice(cols);
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

/**
 * A dotted leader row, the same device the site uses for metadata. Returns two
 * lines when the pair cannot share one — an email is often too long — rather
 * than truncating an address the buyer may need to read.
 */
export function leader(label: string, value: string, cols = COLS): string[] {
  const dots = cols - label.length - value.length - 2;
  if (dots >= 1) return [`${label} ${'.'.repeat(dots)} ${value}`];
  if (value.length >= cols) return [label, ...wrap(value, cols)];
  return [label, value.padStart(cols)];
}

type Line = { text: string; bold?: boolean; center?: boolean; size?: number; gap?: number };
type Rule = { rule: true; gap?: number };
type Row = Line | Rule;

function isRule(row: Row): row is Rule {
  return 'rule' in row;
}

function rows(data: ReceiptData): Row[] {
  const amount = `INR ${new Intl.NumberFormat('en-IN').format(data.amount)}`;
  const out: Row[] = [
    { text: 'DROPDESK', bold: true, center: true, size: 13, gap: 17 },
    { text: 'DIGITAL PRODUCTS - INSTANT DOWNLOAD', center: true, size: 6.5, gap: 14 },
    { rule: true, gap: 13 },
  ];

  for (const line of wrap(toAscii(data.productTitle))) out.push({ text: line, gap: 12 });
  out.push({ rule: true, gap: 13 });

  for (const line of leader('PAID', amount)) out.push({ text: line, bold: true, gap: 12 });
  for (const line of leader('ORDER', toAscii(data.orderId))) out.push({ text: line, gap: 12 });
  if (data.buyerEmail) {
    for (const line of leader('SENT TO', toAscii(data.buyerEmail))) out.push({ text: line, gap: 12 });
  }
  for (const line of leader('DATE', toAscii(data.stamp))) out.push({ text: line, gap: 12 });

  out.push({ rule: true, gap: 15 });
  out.push({ text: 'PAYMENT RECEIVED', bold: true, center: true, gap: 18 });
  out.push({ text: 'Keep this for your records.', center: true, size: 7, gap: 10 });
  return out;
}

// Uint8Array<ArrayBuffer>, not a bare Uint8Array: the default generic admits
// SharedArrayBuffer, which is not a valid BlobPart.
export function buildReceiptPdf(data: ReceiptData): Uint8Array<ArrayBuffer> {
  const body = rows(data);

  // Lay out downward from the top edge, then flip: PDF's origin is bottom-left.
  let down = MARGIN + 4;
  const placed = body.map((row) => {
    const at = down;
    down += row.gap ?? 12;
    return { row, at };
  });
  const height = Math.round(down + MARGIN);

  const ops: string[] = [];
  for (const { row, at } of placed) {
    const y = (height - at).toFixed(2);
    if (isRule(row)) {
      // Dotted, matching the leader rows and the rules on the page itself.
      ops.push(`q 0.6 w [1 2] 0 d ${MARGIN} ${y} m ${(PAGE_W - MARGIN).toFixed(2)} ${y} l S Q`);
      continue;
    }
    const size = row.size ?? SIZE;
    const font = row.bold ? '/F2' : '/F1';
    const width = row.text.length * size * ADVANCE;
    const x = row.center ? ((PAGE_W - width) / 2).toFixed(2) : String(MARGIN);
    ops.push(`BT ${font} ${size} Tf ${x} ${y} Td (${esc(row.text)}) Tj ET`);
  }
  const stream = ops.join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W.toFixed(2)} ${height}] ` +
      '/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];

  // The xref table is byte offsets into the file, so it can only be written
  // once the bytes before it exist. ASCII-only content makes length === bytes.
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i += 1) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return bytes;
}

export const RECEIPT_COLS = COLS;
