import Image from 'next/image';
import type { GalleryImage } from '@/lib/catalog';

export default function Gallery({ slug, images }: { slug: string; images: GalleryImage[] }) {
  if (images.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {images.map((img) => (
        <figure key={img.filename} className="overflow-hidden bg-canvas-2">
          <div className="relative aspect-[4/5] w-full">
            <Image
              src={`/products/${slug}/${img.filename}`}
              alt={img.alt}
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-contain"
            />
          </div>
        </figure>
      ))}
    </div>
  );
}
