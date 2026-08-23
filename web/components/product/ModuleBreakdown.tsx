import type { Product } from '@/lib/catalog';

export default function ModuleBreakdown({ product }: { product: Product }) {
  const modules = product.modules ?? [];
  if (modules.length === 0) return null;

  return (
    <dl className="divide-y divide-ink/10 border-y border-ink/10">
      {modules.map((m) => (
        <div key={m.id} className="py-6">
          <dt className="flex items-baseline justify-between gap-3 font-mono text-sm font-semibold uppercase tracking-[0.08em] text-ink">
            <span>
              {m.id} · {m.title}
            </span>
            <span className="shrink-0 text-ink-soft">{m.pageCount}pp</span>
          </dt>
          <dd className="mt-3 space-y-2 text-sm text-ink-soft">
            {m.highlights.map((h) => (
              <p key={h} className="flex gap-2.5">
                <span
                  aria-hidden="true"
                  className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: product.accent.hex }}
                />
                <span>{h}</span>
              </p>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}
