import type { Metadata } from 'next';
import Link from 'next/link';
import LegalLayout from '@/components/legal/LegalLayout';
import { getFooterData } from '@/lib/catalog/footer-data';
import { SUPPORT_EMAIL, getPricingLadder } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'Terms of Service | Dropdesk',
  description: 'The terms that apply when you buy a Dropdesk PDF system.',
};

export default async function TermsPage() {
  const [footer, pricingLadder] = await Promise.all([getFooterData(), getPricingLadder()]);
  return (
    <LegalLayout footer={footer} title="Terms of Service" updated="18 August 2026">
      <div>
        <p>
          Dropdesk sells digital products you download after paying once. Prices start at ₹
          {pricingLadder.single} and vary by product, and some products are also sold together as
          bundles at a set price. Buying from this site means you agree to the terms below.
        </p>
      </div>

      <div>
        <h2>What you are buying</h2>
        <p>
          Each product is one or more files delivered as a download link. What a given product
          contains is stated on its own page. You are buying a personal-use licence to read, print and
          keep those files, not a physical item and not a subscription.
        </p>
      </div>

      <div>
        <h2>Who can buy</h2>
        <p>
          You must be able to enter a binding contract under Indian law to pay for an order. If
          you are under 18, have a parent or guardian make the purchase on your behalf.
        </p>
      </div>

      <div>
        <h2>Payment</h2>
        <p>
          All prices are in Indian rupees. Payment is processed by Razorpay — UPI, cards and
          netbanking are all accepted. We do not store your card or bank details.
        </p>
      </div>

      <div>
        <h2>Delivery</h2>
        <p>
          The moment your payment clears, we email a download link to the address you gave at
          checkout. We do not attach the PDF files to the email; you download them from the link.
          There is no physical shipment and no waiting period.
        </p>
      </div>

      <div>
        <h2>Licence and restrictions</h2>
        <p>The files are for your personal use. You may not:</p>
        <ul>
          <li>Resell, share or redistribute the files or the download link.</li>
          <li>Upload the files to a public site, drive folder or group chat.</li>
          <li>Claim the content as your own or remove any attribution inside the files.</li>
        </ul>
      </div>

      <div>
        <h2>Refunds</h2>
        <p>
          Digital products are non-refundable once your download link has been sent, with limited
          exceptions. See our <Link href="/refunds">Refund Policy</Link> for the exceptions and how
          to request one.
        </p>
      </div>

      <div>
        <h2>What the products are not</h2>
        <p>
          Every product carries a disclaimer on its own page. In general: these are educational,
          general-information PDFs for healthy adults. They are not medical, psychological,
          financial, tax, legal or investment advice, and no earnings, rank, score, placement or
          salary outcome is promised. Read the disclaimer on a product&rsquo;s page before buying.
        </p>
      </div>

      <div>
        <h2>Limitation of liability</h2>
        <p>
          The products are provided as-is. To the extent permitted by law, Dropdesk is not liable
          for indirect or consequential loss arising from the use of a product. Nothing here
          limits liability that cannot be limited under Indian law.
        </p>
      </div>

      <div>
        <h2>Governing law</h2>
        <p>These terms are governed by the laws of India.</p>
      </div>

      <div>
        <h2>Changes to these terms</h2>
        <p>We may update these terms from time to time. The date at the top of this page shows the latest revision.</p>
      </div>

      <div>
        <h2>Contact</h2>
        <p>
          Email {SUPPORT_EMAIL} with any question about these terms.
          <br />
          Registered business address: REPLACE_BUSINESS_ADDRESS.
        </p>
      </div>
    </LegalLayout>
  );
}
