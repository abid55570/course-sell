import type { Metadata } from 'next';
import { Big_Shoulders, Instrument_Sans, Geist_Mono, Noto_Sans_Devanagari } from 'next/font/google';
import SmoothScroll from '@/lib/motion/SmoothScroll';
import SiteHeader from '@/components/chrome/SiteHeader';
import SearchBox from '@/components/search/SearchBox';
import { listProducts } from '@/lib/catalog';
import { SITE_URL } from '@/lib/env';
import './globals.css';

// Google Fonts merged "Big Shoulders Display" into the single variable
// family "Big Shoulders" (next/font/google exports Big_Shoulders,
// Big_Shoulders_Inline, Big_Shoulders_Stencil — no `_Display` export).
const display = Big_Shoulders({ subsets: ['latin'], variable: '--font-big-shoulders', weight: ['600', '700', '800'] });
const body = Instrument_Sans({ subsets: ['latin'], variable: '--font-instrument' });
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });
const deva = Noto_Sans_Devanagari({ subsets: ['devanagari'], variable: '--font-noto-deva', weight: ['400', '700'] });

// A function rather than a const, because the product count it quotes now
// comes from the database and arrives asynchronously.
export async function generateMetadata(): Promise<Metadata> {
  const products = await listProducts();
  return {
    // Without this, Next resolves Open Graph and Twitter image paths against
    // localhost, so a link shared to WhatsApp or Instagram previews with no
    // image at all. It has to be the public origin, which is what SITE_URL is.
    metadataBase: new URL(SITE_URL),
    title: 'Dropdesk — digital products, instant download',
    description: `${products.length} finished digital products for Indians building their next move. Instant download, pay by UPI.`,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} ${deva.variable}`}>
      <body>
        <SmoothScroll>
          <SiteHeader searchSlot={<SearchBox />} />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
