/**
 * The hero headline. Each line rises and fades in on load, staggered, one
 * sequence and nothing else.
 *
 * This used to be a client component that dynamically imported GSAP to tween
 * three spans. That pulled roughly 26KB gzipped and a hydration boundary onto
 * the most important paint on the site, to do something CSS does natively.
 *
 * It is now a server component with a CSS keyframe and a per-line delay. The
 * motion is identical, it starts at first paint instead of after a chunk
 * downloads, and it costs no JavaScript at all.
 *
 * Reduced motion is handled in globals.css, where the animation is replaced by
 * the final state rather than merely shortened. A line must never be left at
 * opacity 0 because an effect did not run: with no JavaScript involved, it
 * cannot be.
 */
export default function HeroHeadline({ lines }: { lines: string[] }) {
  return (
    <h1
      // The clamp floor was 3.5rem, wider than a 360-390px viewport can hold for
      // the longest line, so it wrapped and the three-beat headline read as
      // four. 2.25rem clears the narrowest viewport; 12vw returns to poster
      // scale as soon as there is room.
      className="font-display text-[clamp(2.25rem,12vw,11rem)] font-bold leading-[0.86] tracking-tight text-balance text-white"
    >
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden">
          <span
            data-hero-line
            className="hero-line block"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            {line}
          </span>
        </span>
      ))}
    </h1>
  );
}
