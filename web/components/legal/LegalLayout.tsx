import Footer from '@/components/landing/Footer';

export default function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main>
      <section className="bg-canvas px-5 py-16">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-ink-soft">Last updated {updated}</p>
          <div className="mt-8 space-y-8 text-ink-soft [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2">
            {children}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
