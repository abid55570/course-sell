import type { Metadata } from 'next';
import LegalLayout from '@/components/legal/LegalLayout';
import { getFooterData } from '@/lib/catalog/footer-data';
import { SUPPORT_EMAIL } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'Privacy Policy | Dropdesk',
  description: 'How Dropdesk collects, uses and protects your information when you buy a PDF system.',
};

export default async function PrivacyPage() {
  const footer = await getFooterData();
  return (
    <LegalLayout footer={footer} title="Privacy Policy" updated="18 August 2026">
      <div>
        <p>
          Dropdesk sells digital PDF products. This page explains what information we collect
          when you buy one, why we collect it, and who else sees it.
        </p>
      </div>

      <div>
        <h2>What we collect</h2>
        <p>At checkout you give us your name and email address, and optionally a phone number.</p>
        <ul>
          <li>Your name — printed on the order record.</li>
          <li>Your email — where the download link is sent.</li>
          <li>Your phone number, if you enter one — used only if we need to reach you about an order.</li>
        </ul>
        <p>
          We never see or store your card number, UPI PIN or netbanking password. Razorpay, our
          payment processor, collects that directly and passes us only a payment confirmation.
        </p>
      </div>

      <div>
        <h2>How we use it</h2>
        <ul>
          <li>To send your download link once payment clears.</li>
          <li>To answer a support request you send us.</li>
          <li>To fix a problem with an order, such as a link that will not open.</li>
        </ul>
        <p>We do not sell your information, and we do not run affiliate or ad-retargeting pixels on the checkout page.</p>
      </div>

      <div>
        <h2>Payment processing</h2>
        <p>
          Every payment runs through Razorpay. Razorpay processes your payment details under its
          own privacy policy, separate from this one. We receive only your order amount and a
          success or failure status.
        </p>
      </div>

      <div>
        <h2>Data retention</h2>
        <p>
          We keep order records — name, email, product, amount, date — for as long as needed to
          answer support requests and meet tax record-keeping requirements. We do not keep card
          or bank details, because we never receive them.
        </p>
      </div>

      <div>
        <h2>Your rights</h2>
        <p>
          Email {SUPPORT_EMAIL} to ask what information we hold about you, to correct it, or to
          ask us to delete it. We will action any deletion request that does not conflict with a
          legal record-keeping duty.
        </p>
      </div>

      <div>
        <h2>Children</h2>
        <p>
          Dropdesk&rsquo;s products are written for adults and young adults aged 18 to 28. We do
          not knowingly collect information from children under 18. Some product content is
          usable at a younger age with a parent&rsquo;s involvement, but the checkout itself is
          for the person making the purchase.
        </p>
      </div>

      <div>
        <h2>Changes to this policy</h2>
        <p>
          If this policy changes, we will update the date at the top of this page. Continuing to
          use the site after a change means you accept the update.
        </p>
      </div>

      <div>
        <h2>Contact</h2>
        <p>
          Email {SUPPORT_EMAIL} with any privacy question.
          <br />
          Operating from Uttar Pradesh, India.
        </p>
      </div>
    </LegalLayout>
  );
}
