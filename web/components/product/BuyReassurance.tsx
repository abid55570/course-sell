import Link from 'next/link';

type Tone = 'light' | 'dark';

export default function BuyReassurance({ tone = 'light' }: { tone?: Tone }) {
  const colour = tone === 'dark' ? 'text-white/70' : 'text-ink-soft';
  return (
    <p className={`mt-4 font-mono text-xs ${colour}`}>
      Link broken or missing? <Link href="/refunds" className="underline underline-offset-4 hover:opacity-80">We fix it or refund you.</Link>
    </p>
  );
}
