import type { Helpline } from '@/lib/catalog';

export default function Disclaimer({
  disclaimer,
  helplines,
}: {
  disclaimer?: string;
  helplines?: Helpline[];
}) {
  const list = helplines ?? [];
  if (!disclaimer && list.length === 0) return null;

  return (
    <div className="border-t border-ink/10 pt-6 text-sm text-ink-soft">
      <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">Disclaimer</h3>
      {disclaimer ? <p className="mt-3">{disclaimer}</p> : null}
      {list.length > 0 ? (
        <ul className="mt-4 space-y-1">
          {list.map((h) => (
            <li key={h.name}>
              <span className="font-semibold text-ink">
                {h.name}: {h.number}
              </span>{' '}
              — {h.context}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
