import { describe, it, expect } from 'vitest';
import { buildReceiptPdf, toAscii, wrap, leader, RECEIPT_COLS } from '@/lib/receipt-pdf';

const ORDER = {
  // Deliberately hostile: an em dash, middle dots, and parentheses — the last
  // of which delimit strings in PDF and corrupt the file if left unescaped.
  productTitle: 'Glow-Up OS — The Complete System (Body·Looks·Mind)',
  amount: 1999,
  orderId: 'ORD-8F2C41A9',
  buyerEmail: 'anas0007shamshad@gmail.com',
  stamp: '23 AUG 2026, 15:58',
};

const decode = (bytes: Uint8Array) => String.fromCharCode(...bytes);

describe('buildReceiptPdf', () => {
  it('produces something a PDF reader will open', () => {
    const pdf = decode(buildReceiptPdf(ORDER));
    expect(pdf.startsWith('%PDF-1.4')).toBe(true);
    expect(pdf.trimEnd().endsWith('%%EOF')).toBe(true);
    expect(pdf).toContain('/Root 1 0 R');
  });

  /**
   * The xref table is the one part of a hand-built PDF that silently rots: it
   * is byte offsets, so any change to the bytes before an object moves it. A
   * reader that cannot follow these offsets rejects the whole file.
   */
  it('points every xref offset at the object it claims', () => {
    const pdf = decode(buildReceiptPdf(ORDER));

    const startxref = Number(/startxref\s+(\d+)/.exec(pdf)![1]);
    expect(pdf.slice(startxref, startxref + 4)).toBe('xref');

    const offsets = [...pdf.slice(startxref).matchAll(/^(\d{10}) 00000 n/gm)].map((m) =>
      Number(m[1])
    );
    expect(offsets).toHaveLength(6);
    offsets.forEach((offset, i) => {
      expect(pdf.slice(offset), `object ${i + 1} is not at its stated offset`).toMatch(
        new RegExp(`^${i + 1} 0 obj`)
      );
    });
  });

  it('declares a stream length that matches the stream', () => {
    const pdf = decode(buildReceiptPdf(ORDER));
    const match = /\/Length (\d+) >>\s*stream\n/.exec(pdf)!;
    const declared = Number(match[1]);
    const actual = pdf.indexOf('\nendstream', match.index) - match.index - match[0].length;
    expect(actual).toBe(declared);
  });

  it('escapes the parentheses in a product title', () => {
    const pdf = decode(buildReceiptPdf(ORDER));
    // Unescaped, "(Body-Looks-Mind)" would close the PDF string early and
    // corrupt every operator after it.
    expect(pdf).toContain('\\(Body-Looks-Mind\\)');
  });

  it('stays inside ASCII, so one character is one byte', () => {
    const bytes = buildReceiptPdf(ORDER);
    const high = [...bytes].filter((b) => b > 0x7e);
    expect(high, 'a non-ASCII byte breaks the xref offsets above').toEqual([]);
  });

  it('writes the amount as INR, since the rupee sign has no glyph here', () => {
    const pdf = decode(buildReceiptPdf(ORDER));
    expect(pdf).toContain('INR 1,999');
    expect(pdf).not.toContain('₹');
  });

  it('carries the order id, the buyer and the date', () => {
    const pdf = decode(buildReceiptPdf(ORDER));
    expect(pdf).toContain('ORD-8F2C41A9');
    expect(pdf).toContain('anas0007shamshad@gmail.com');
    expect(pdf).toContain('23 AUG 2026, 15:58');
  });

  it('claims no seller identity the site does not claim', () => {
    const pdf = decode(buildReceiptPdf(ORDER));
    // The site names no legal entity anywhere, so neither may the receipt, and
    // no tax registration may be invented on it.
    expect(pdf).not.toMatch(/private limited|pvt\.? ?ltd|gstin|gst no/i);
  });

  it('omits the buyer row entirely when there is no email', () => {
    const pdf = decode(buildReceiptPdf({ ...ORDER, buyerEmail: undefined }));
    expect(pdf).not.toContain('SENT TO');
    expect(pdf).toContain('ORD-8F2C41A9');
  });

  it('stays an 80mm roll whatever the content', () => {
    const pdf = decode(buildReceiptPdf(ORDER));
    expect(pdf).toContain('/MediaBox [0 0 226.77');
  });

  it('grows taller for a longer title rather than overflowing the page', () => {
    const short = buildReceiptPdf({ ...ORDER, productTitle: 'Short' });
    const long = buildReceiptPdf({
      ...ORDER,
      productTitle: 'A very much longer product title that has to wrap across several lines',
    });
    const height = (bytes: Uint8Array) =>
      Number(/\/MediaBox \[0 0 [\d.]+ (\d+)\]/.exec(decode(bytes))![1]);
    expect(height(long)).toBeGreaterThan(height(short));
  });
});

describe('toAscii', () => {
  it('folds the characters a standard PDF font cannot draw', () => {
    expect(toAscii('₹999')).toBe('INR 999');
    expect(toAscii('a — b – c')).toBe('a - b - c');
    expect(toAscii('Body·Looks•Mind')).toBe('Body-Looks-Mind');
    expect(toAscii('“quoted” and ‘single’')).toBe('"quoted" and \'single\'');
    expect(toAscii('wait…')).toBe('wait...');
  });

  it('drops anything still unrepresentable rather than emitting a stray byte', () => {
    expect(toAscii('नमस्ते hello 日本')).toBe(' hello ');
  });
});

describe('wrap', () => {
  it('never exceeds the roll width', () => {
    for (const line of wrap('A very much longer product title that must wrap somewhere sensible')) {
      expect(line.length).toBeLessThanOrEqual(RECEIPT_COLS);
    }
  });

  it('breaks mid-word only when the word cannot fit alone', () => {
    const lines = wrap('short ' + 'x'.repeat(RECEIPT_COLS + 10));
    expect(lines[0]).toBe('short');
    expect(lines.slice(1).join('').length).toBe(RECEIPT_COLS + 10);
  });

  it('returns a single empty line for empty input, never an empty list', () => {
    expect(wrap('')).toEqual(['']);
  });
});

describe('leader', () => {
  it('fills the row to exactly the roll width', () => {
    const [row] = leader('PAID', 'INR 1,999');
    expect(row).toHaveLength(RECEIPT_COLS);
    expect(row.startsWith('PAID ')).toBe(true);
    expect(row.endsWith(' INR 1,999')).toBe(true);
  });

  it('spills a long value onto its own line rather than truncating it', () => {
    const rows = leader('SENT TO', 'a-very-long-address@some-long-domain.example.com');
    expect(rows.length).toBeGreaterThan(1);
    // The address must survive intact: a buyer may need to read it back.
    expect(rows.slice(1).join('')).toContain('a-very-long-address@some-long-domain.example.com');
  });
});
