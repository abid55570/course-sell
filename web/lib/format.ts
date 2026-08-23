/** Formats a whole-rupee amount the way the catalog copy does: ₹1,499, not ₹1499. */
export function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * A compact label for a product title, for spots (a ticker chip, a closing
 * headline) that need something shorter than the full title. Some titles
 * pair a name with a descriptor using an em dash — "Glow-Up OS — The
 * Complete System (Body · Looks · Mind)" reads as "Glow-Up OS" here — but
 * that convention is optional, not assumed: a title with no dash, like
 * "Invoice Template Pack", is returned exactly as given. This reads the
 * label off the approved title text rather than storing a second copy of it.
 */
export function titleLead(title: string): string {
  return title.split(' — ')[0].trim();
}

function relativeLuminance(hex: string): number {
  const channel = (i: number) => parseInt(hex.slice(i, i + 2), 16) / 255;
  const [r, g, b] = [1, 3, 5]
    .map(channel)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hexA: string, hexB: string): number {
  const a = relativeLuminance(hexA) + 0.05;
  const b = relativeLuminance(hexB) + 0.05;
  return a > b ? a / b : b / a;
}

/**
 * Picks whichever of ink or white clears more contrast against a given
 * accent hex, for text sitting on an accent-coloured field (a badge, a
 * chip). Every accent in the current catalog clears WCAG AA (4.5:1) against
 * one of the two — this stays generic instead of hardcoding a per-accent
 * table, so it keeps working if the catalog's accent hexes ever change.
 */
export function accentForeground(hex: string): string {
  const ink = '#0B1020';
  const white = '#FFFFFF';
  return contrastRatio(ink, hex) >= contrastRatio(white, hex) ? ink : white;
}
