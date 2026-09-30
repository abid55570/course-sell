import { formatRupees } from '@/lib/format';

/**
 * Renders a product's price, and — when the product carries a higher anchor
 * price — the anchor struck through beside it plus a small "SAVE ₹X" chip in
 * the product's accent colour. When there is no anchor, only the price shows,
 * so the same component is safe to drop in everywhere a price is currently
 * printed alone.
 *
 * Two visual variants:
 *   - light  (default): white/dark text on a light surface (ProductCard's ink
 *              body, product-page ink hero and receipt use different surfaces
 *              but read colours from the same tokens; the component doesn't
 *              own the surface).
 *   - dark:   same treatment on a light background — inverts token pairs so
 *              the strike and chip stay legible on white.
 */
export default function PriceBlock({
  price,
  anchorPrice,
  accentHex,
  size = 'md',
  variant = 'dark-surface',
}: {
  price: number;
  anchorPrice?: number | null;
  accentHex: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark-surface' | 'light-surface';
}) {
  const hasSaving = typeof anchorPrice === 'number' && anchorPrice > price;
  const saved = hasSaving ? anchorPrice - price : 0;
  const priceClass =
    size === 'lg'
      ? 'font-display text-3xl font-bold sm:text-4xl'
      : size === 'sm'
      ? 'font-display text-base font-bold'
      : 'font-display text-xl font-bold';
  const strikeClass =
    size === 'lg' ? 'text-lg font-mono' : size === 'sm' ? 'text-xs font-mono' : 'text-sm font-mono';
  const onDark = variant === 'dark-surface';
  const priceColor = onDark ? 'text-white' : 'text-ink';
  const strikeColor = onDark ? 'text-white/50' : 'text-ink-soft';

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className={`${priceClass} ${priceColor}`}>{formatRupees(price)}</span>
      {hasSaving ? (
        <>
          <span className={`${strikeClass} ${strikeColor} line-through decoration-2`}>
            {formatRupees(anchorPrice as number)}
          </span>
          <span
            className="rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-ink"
            style={{ backgroundColor: accentHex }}
            aria-label={`Save ${formatRupees(saved)}`}
          >
            Save {formatRupees(saved)}
          </span>
        </>
      ) : null}
    </div>
  );
}
