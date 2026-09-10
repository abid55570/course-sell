# Mobile Repair Seekho

Approved foundations edition: 44-page Hinglish guide + 24-page workbook. Buyer files are in `storage/ebooks/mobile-repair/` (private, not a public download route). Product gallery assets are in `web/public/products/mobile-repair-seekho/`.

From the repository root:

```powershell
node api/scripts/seed-mobile-repair.js --check
node api/scripts/seed-mobile-repair.js
```

The seed creates only this product, unpublished, unavailable and with delivery disabled. Price 0 is a draft placeholder, not an approved selling price. Reruns preserve all existing admin settings. It requires catalogue migrations through 012; email retries require 013. Apply outstanding migrations through the existing migration process before restarting the API.

After seeding, in Admin > Catalogue, set the selling price, attach the buyer Drive folder, enable Send the Drive link, and check access using a separate account. Enable availability and publish only after delivery is ready. Keep PDF-email delivery off.

10 September 2026 verification: seed and repeat-run preservation passed in embedded PostgreSQL with all 13 migrations. The actual configured database connection and seed attempt failed with ETIMEDOUT. SMTP authentication verification failed with EAUTH; no test email was sent and no real order was changed. Correct DATABASE_URL/connectivity and SMTP credentials in the deployment environment, then rerun the seed and complete a controlled email test to an approved mailbox. Do not put credentials in this README or chat.
