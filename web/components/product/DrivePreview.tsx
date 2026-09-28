/**
 * "What's inside" preview for a bundle delivered as a shared Drive folder.
 *
 * Two modes:
 *   - Curated: 4 individual Drive-hosted video previews, one per clip. Used
 *     when reel-samples.json has entries for this bundle's slug. Each
 *     player is Drive's own /file/d/<id>/preview iframe, so no MP4 lives
 *     in git and no Drive API key is needed — the clips just need to be
 *     shared 'Anyone with the link' the same way the folder is.
 *   - Fallback: nothing. If a slug has no sample ids, no preview shows.
 *
 * To curate a bundle's samples, open its Drive folder, right-click each
 * clip you want to preview -> 'Get link' -> copy the file id (between
 * /d/ and /view), and paste up to 4 ids into that slug's array in
 * web/lib/catalog/reel-samples.json. See the _readme key in that file.
 */

type Props = {
  productTitle: string;
  sampleFileIds: string[];
};

export default function DrivePreview({ productTitle, sampleFileIds }: Props) {
  const clips = sampleFileIds.slice(0, 4);
  if (clips.length === 0) return null;

  return (
    <section className="bg-canvas px-5 py-12 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
          What&rsquo;s inside
        </h2>
        <p className="mt-2 font-display text-2xl font-bold text-ink">
          A few clips from this bundle.
        </p>
        <p className="mt-3 max-w-2xl text-sm text-ink-soft">
          A hand-picked sample of the actual clips you get after purchase.
          The full folder — dozens more — is delivered by email.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {clips.map((fileId, idx) => (
            <div
              key={fileId}
              className="relative overflow-hidden border border-ink/15 bg-canvas-2"
              style={{ aspectRatio: '9 / 16' }}
            >
              <iframe
                title={`${productTitle} — sample clip ${idx + 1}`}
                src={`https://drive.google.com/file/d/${fileId}/preview`}
                className="absolute inset-0 h-full w-full"
                loading="lazy"
                allow="autoplay"
              />
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs text-ink-soft">
          Preview shows {clips.length} sample{clips.length === 1 ? '' : 's'}.
          Full folder access is delivered by email after purchase.
        </p>
      </div>
    </section>
  );
}
