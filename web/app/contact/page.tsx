import type { Metadata } from 'next';
import Link from 'next/link';
import LegalLayout from '@/components/legal/LegalLayout';
import { getFooterData } from '@/lib/catalog/footer-data';
import { SUPPORT_EMAIL } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'Contact | Dropdesk',
  description: 'How to reach Dropdesk about an order, a product question, or anything else.',
};

export default async function ContactPage() {
  const footer = await getFooterData();
  return (
    <LegalLayout footer={footer} title="Contact" updated="18 August 2026">
      <div>
        <p>
          Dropdesk is a small, one-person storefront. Every message goes to the same inbox and
          gets a real reply, usually within a day or two.
        </p>
      </div>

      <div>
        <h2>Email</h2>
        <p>
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </p>
      </div>

      <div>
        <h2>Order questions</h2>
        <p>Include the email address you used at checkout and the product name. That is enough to find your order.</p>
      </div>

      <div>
        <h2>Refunds</h2>
        <p>
          See the <Link href="/refunds">Refund Policy</Link> first — it covers the situations that
          qualify and how to request one.
        </p>
      </div>

      <div>
        <h2>A product isn&rsquo;t working</h2>
        <p>
          If a download link is broken or a file will not open, say so directly and we will resend
          it or fix it, no refund needed for a simple delivery problem.
        </p>
      </div>

      <div>
        <h2>Business details</h2>
        <p>
          Registered business name: Axilrise Private Limited.
          <br />
          Operating from Uttar Pradesh, India.
        </p>
      </div>
    </LegalLayout>
  );
}
