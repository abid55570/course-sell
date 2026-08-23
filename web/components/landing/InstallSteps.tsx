const STEPS = [
  {
    title: 'Pick a product',
    body: 'Every product page shows exactly what you get before you pay. Open the one you want.',
  },
  {
    title: 'Pay by UPI',
    body: 'Cards and netbanking work too, through Razorpay. Only your name and email are collected.',
  },
  {
    title: 'Download and start',
    body: 'The link lands in your email the moment payment clears. No password, no login, no wait.',
  },
];

// Three ledger rows on carbon-copy paper. The sequence is real (do this,
// then this, then this): an ordered list carries it for assistive tech, and
// a mono row number carries it visually, per the corrected design brief.
// The numbers are aria-hidden because the list already announces position.
export default function InstallSteps() {
  return (
    <section className="band-carbon px-5 py-20 sm:py-24 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <h2 className="flex items-center gap-3 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
          Install
          <span aria-hidden="true" className="h-px flex-1 border-b border-dotted border-ink/25" />
          <span className="shrink-0 tracking-[0.15em]">{String(STEPS.length).padStart(2, '0')} steps</span>
        </h2>
        <ol className="mt-8 border-t border-ink/15">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-y-2 border-b border-ink/15 py-6 sm:grid-cols-[2.75rem_minmax(0,15rem)_1fr] sm:gap-x-8 sm:py-7"
            >
              <span aria-hidden="true" className="pt-1 font-mono text-sm font-semibold text-ink-soft">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="font-display text-2xl font-bold uppercase leading-[0.95] text-ink sm:text-3xl">
                {step.title}
              </h3>
              <p className="col-start-2 text-base text-ink-soft sm:col-auto sm:border-l sm:border-ink/15 sm:pl-8">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
