import type { Metadata } from 'next';
import LegalLayout from '@/components/legal/LegalLayout';
import { getFooterData } from '@/lib/catalog/footer-data';
import { SUPPORT_EMAIL } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'Refund Policy | Dropdesk',
  description: 'When a Dropdesk order qualifies for a refund, and how to request one.',
};

export default async function RefundsPage() {
  const footer = await getFooterData();
  return (
    <LegalLayout footer={footer} title="Refund Policy" updated="18 August 2026">
      <div>
        <p>
          Every product on this site is a digital file delivered by download link, sent the moment
          payment clears. Because the file is available to you immediately, orders are final sale
          once the link is sent, with the exceptions below.
        </p>
      </div>

      <div>
        <h2>When we will refund you</h2>
        <ul>
          <li>The download link never arrives in your inbox or spam folder.</li>
          <li>The link is broken, or the file will not open.</li>
          <li>You were charged twice for the same order.</li>
          <li>You were charged for a product you did not select.</li>
        </ul>
        <p>
          In each case, email {SUPPORT_EMAIL} with your order details. We will fix the delivery
          problem first if we can — resend the link or the correct file — and refund you only if
          we cannot.
        </p>
      </div>

      <div>
        <h2>When we will not refund you</h2>
        <ul>
          <li>You changed your mind after the download link was sent.</li>
          <li>You bought the wrong product by mistake and already downloaded it.</li>
          <li>You did not read the module breakdown or disclaimer on the product page before buying.</li>
        </ul>
        <p>Read a product&rsquo;s page in full before you pay. That is exactly why every module and every disclaimer is listed there.</p>
      </div>

      <div>
        <h2>How to request a refund</h2>
        <p>
          Email {SUPPORT_EMAIL} with the email address you used at checkout and the product name.
          We reply to refund requests directly; there is no separate refund form.
        </p>
      </div>

      <div>
        <h2>How long it takes</h2>
        <p>
          Approved refunds are issued back through Razorpay to your original payment method, and
          typically reflect in your account within 5-7 business days, depending on your bank.
        </p>
      </div>

      <div>
        <h2>Contact</h2>
        <p>
          Email {SUPPORT_EMAIL} with any question about a refund.
          <br />
          Operating from Uttar Pradesh, India.
        </p>
      </div>
    </LegalLayout>
  );
}
