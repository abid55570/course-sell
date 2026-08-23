'use client';
import { useState } from 'react';

export type FaqItem = { question: string; answer: string };

export default function Faq({ items, title = 'Questions, answered straight.' }: { items: FaqItem[]; title?: string }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-canvas px-5 py-20 sm:py-24 lg:px-12">
      {/* Deliberately the page's near-plain section: bare stock between the
          dotted-leader sheet and the ink counterfoil, so the treated grounds
          around it register as intentional. */}
      <div className="mx-auto max-w-3xl">
        <h2 className="flex items-center gap-3 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
          FAQ
          <span aria-hidden="true" className="h-px flex-1 border-b border-dotted border-ink/25" />
        </h2>
        <p className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">{title}</p>
        <div className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.question}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left font-display text-xl font-bold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:text-2xl"
                >
                  <span>{item.question}</span>
                  <span className="shrink-0 font-mono text-primary" aria-hidden="true">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen ? <p className="pb-5 text-base text-ink-soft sm:text-lg">{item.answer}</p> : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
