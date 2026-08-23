/**
 * Typographic stand-in for a product with no cover image.
 *
 * The three imported guide families ship exactly one cover image per
 * family, on the full-set product — the 75 individual guides have no cover
 * art at all. `ProductCard` and the product page's hero were both built
 * assuming a cover always exists; this is what they render instead of
 * nothing, so a cover-less card sits comfortably next to a real cover in
 * the same grid instead of reading as a broken image.
 *
 * It borrows the storefront's existing "register paperwork" system rather
 * than inventing a new one: ruled horizontal lines (the same 1px-rule ground
 * used by .ground-chart/.band-register in app/globals.css, tinted with the
 * product's own category accent instead of redeclared per family), a square
 * ticket-stub accent bar standing in for a torn edge, Big Shoulders display
 * type for the title and Geist Mono for the kicker. No rounded corners
 * anywhere, matching every other card in the grid. Because the titles ARE
 * the appeal here ("How to be like Bruce Wayne", "10 Ways to Be Dangerously
 * Disciplined"), the title is set large and does the job a photo would have
 * done, not shrunk to make room for decoration.
 *
 * Pure server-rendered markup: no client JS, no images, so 75 of these on
 * one page cost nothing beyond a few DOM nodes each.
 */
export default function CoverFallback({
  title,
  kicker,
  accentHex,
  size = 'sm',
}: {
  title: string;
  kicker?: string;
  accentHex: string;
  size?: 'sm' | 'lg';
}) {
  const isLg = size === 'lg';

  return (
    <div
      className={`absolute inset-0 flex flex-col justify-between overflow-hidden bg-ink ${
        isLg ? 'p-7 sm:p-9' : 'p-3.5'
      }`}
      style={{
        backgroundImage: `repeating-linear-gradient(to bottom, ${accentHex}26 0 1px, transparent 1px ${
          isLg ? 30 : 20
        }px)`,
      }}
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: accentHex }} />
      {kicker ? (
        <span
          className={`relative block font-mono font-semibold uppercase tracking-[0.15em] text-white/55 ${
            isLg ? 'text-xs' : 'text-[9px]'
          }`}
        >
          {kicker}
        </span>
      ) : (
        <span aria-hidden="true" />
      )}
      <p
        className={`relative font-display font-bold uppercase leading-[0.95] text-white ${
          isLg ? 'text-2xl line-clamp-6 sm:text-3xl lg:text-4xl' : 'text-base line-clamp-5 sm:text-lg'
        }`}
      >
        {title}
      </p>
    </div>
  );
}
