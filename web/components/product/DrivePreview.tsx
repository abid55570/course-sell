/**
 * A live "What's inside" preview for a bundle that's delivered as a shared
 * Google Drive folder. Renders Drive's own embedded folder view, which
 * carries real thumbnails for every video in the folder and updates
 * automatically as clips are added or removed — no per-file wiring, no API
 * keys, no build-time snapshot to keep in sync.
 *
 * The iframe only loads what the buyer's browser can already reach on Drive:
 * if the folder is not publicly shared, the iframe shows a sign-in screen
 * (the same wall a buyer would hit clicking the delivery email link). That
 * failure mode is the same signal for the product page and the delivery
 * flow, which is a virtue — a broken preview here is the earliest place a
 * misconfigured folder shows up before an order gets taken.
 *
 * The height is fixed rather than fluid because the embedded folder view
 * carries its own scrollbar past the fold, so growing our container just
 * hides the buyer's own controls off-screen without letting them see more
 * at once. 520px shows enough thumbnails to be persuasive at any width.
 */

type Props = {
  folderId: string;
  productTitle: string;
};

export default function DrivePreview({ folderId, productTitle }: Props) {
  const src = `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`;
  return (
    <section className="bg-canvas px-5 py-12 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
          What&rsquo;s inside
        </h2>
        <p className="mt-2 font-display text-2xl font-bold text-ink">
          A live look at the actual bundle contents.
        </p>
        <p className="mt-3 max-w-2xl text-sm text-ink-soft">
          Every clip in this bundle, live from the Drive folder you get after
          purchase. Thumbnails come straight from Google Drive, so what you
          see here is exactly what you download.
        </p>

        <div className="mt-6 overflow-hidden border border-ink/15 bg-canvas-2">
          <iframe
            title={`${productTitle} — sample clips from the delivery Drive folder`}
            src={src}
            className="block h-[520px] w-full"
            loading="lazy"
            // The Drive embed only serves its own frame — no third-party
            // scripts, cookies for us or fingerprinting we can turn off. It
            // does need enough sandbox to render, though, so we do not
            // over-restrict past what a normal iframe already blocks.
          />
        </div>
      </div>
    </section>
  );
}
