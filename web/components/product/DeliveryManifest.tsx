import type { Product } from '@/lib/catalog';
import { formatRupees } from '@/lib/format';

type DeliveryManifestProps = {
  product: Product;
};

export default function DeliveryManifest({ product }: DeliveryManifestProps) {
  if (product.deliveryFiles.length === 0) return null;

  return (
    <section className="band-register border-t border-ink/10 bg-canvas-2 px-5 py-12 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
          What you receive
        </h2>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          {product.fileSizeLabel ? (
            <span className="font-mono text-xs text-ink-soft">Download: {product.fileSizeLabel}</span>
          ) : null}
          {product.fileCount ? (
            <span className="font-mono text-xs text-ink-soft">
              {product.fileCount} {product.fileCount === 1 ? 'file' : 'files'}
            </span>
          ) : null}
          <span className="font-mono text-xs text-ink-soft">
            Delivered as a download link by email
          </span>
        </div>
        <ul className="mt-4 space-y-1.5">
          {product.deliveryFiles.map((file) => (
            <li key={file} className="font-mono text-sm text-ink">
              <span className="mr-2 text-ink-soft" aria-hidden="true">
                +
              </span>
              {file}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
