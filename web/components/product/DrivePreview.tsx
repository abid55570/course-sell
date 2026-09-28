/**
 * A live "What's inside" preview for a bundle that's delivered as a shared
 * Google Drive folder. Renders Drive's own embedded folder view, cropped
 * to just the first row of grid thumbnails — enough to prove the folder is
 * real and the clips are what buyers expect, without showing the whole
 * bundle for free.
 *
 * The embed has no `limit` query param, so the cap is enforced visually:
 * the iframe is short enough to fit only 6–8 tiles on the first row, the
 * outer container hides overflow, and a fade + explicit "Full folder
 * unlocked after purchase" label sits under the crop so buyers see this
 * is a sample, not the whole product.
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
          A sample of the actual bundle contents.
        </p>
        <p className="mt-3 max-w-2xl text-sm text-ink-soft">
          A handful of real clips from the Drive folder you get after
          purchase. Thumbnails come straight from Google Drive, so what you
          see here is exactly what you download.
        </p>

        <div className="relative mt-6 overflow-hidden border border-ink/15 bg-canvas-2">
          <iframe
            title={`${productTitle} — sample clips from the delivery Drive folder`}
            src={src}
            className="pointer-events-none block h-[260px] w-full"
            loading="lazy"
          />
          {/* Fade the bottom edge so the crop reads as intentional rather than
              a cut-off scroll region. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-canvas-2 to-transparent"
          />
        </div>
        <p className="mt-3 text-xs text-ink-soft">
          Preview shows a sample only. Full folder access is delivered by
          email after purchase.
        </p>
      </div>
    </section>
  );
}
