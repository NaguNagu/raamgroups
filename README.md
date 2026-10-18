# Sri Raam Rope Merchants · Raam Groups

Next.js storefront and business workspace deployed on Vercel at **https://raamgroups.vercel.app**.

## Features

- Home, About, searchable/category-filtered Products, product detail and Contact pages.
- Supplied logo, forest/cream/gold palette, self-hosted Playfair Display and Inter fonts.
- Browser-persistent cart with quantities; WhatsApp order requests include the customer's name and mobile number. Customers send the prepared message themselves; no payment integration.
- Firebase Authentication: primary administrator plus explicitly approved team accounts with the same business access. Google and email/password sign-in are available. Settings includes team creation, deactivation and password changes; sessions expire after two hours of inactivity.
- Inventory, products/photos/prices/categories/stock, occasion banner, customer bills, vendor purchases, enquiries and CSV reports.
- AG Grid Community desktop records, mobile record cards, accessible side drawers and A4/A5 print CSS.
- Tamil Nadu place of supply: CGST/SGST. Other states: IGST. Integer-paise calculations, invoice snapshots, duplicate-save protection and atomic stock/bill-number updates.
- First-time billed items become hidden inventory entries; their opening stock can be entered afterward. Existing stocked items cannot be oversold. Purchases add stock.
- Daily, Monday-based weekly, monthly, yearly and custom reports; item/GST groups and vendor-wise purchases.

## Firebase

Project **sri-raam-rope**, number **822993063639**. Firestore is **Standard**, database **(default)**, region **asia-south1 (Mumbai)**. Web app configuration is in `lib/firebase-config.ts`; the Firebase web API key is a public app identifier, not a server secret.

FirebaseServerApp bridges a Firebase user ID token into server-side Firestore requests. A maintained JWT library verifies Firebase public-key signatures, issuer, audience, expiry and required claims. Admission requires the verified primary administrator or an active membership bound to the exact UID/email; Firestore independently enforces the rules. No service-account key, custom admin password hash or Postgres credential is used. HttpOnly/Secure/SameSite cookies and authenticated request headers carry short-lived Firebase ID tokens. The browser SDK refreshes tokens on admin requests.

Collections: `products`, `bills`, `enquiries`, `teamMembers`, `authSessions`, private business records, public settings, and content-addressed assets. Private metadata holds the invoice sequence and revision. A Firestore transaction checks the revision and commits changed records, stock and sequence together. Historical invoices keep item/tax/business snapshots. Live business records remain in Firebase; private imports are not bundled into the public source. An uninitialized business database must be restored before billing.

Images are resized and converted to WebP in the browser. Small immutable image documents are served through a cached image API; catalogue and invoice documents contain image URLs, not large embedded image strings. Image strings are capped below Firestore's document limit.

Only published products, business contact settings and individual public image assets can be read without login. The public contact form may create a schema-validated new enquiry; it cannot read enquiries or change their status. Other paths default to deny. Runtime contact throttling is best-effort per server instance, not a global anti-spam guarantee.

## Development and checks

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```

`/admin/demo` is a labelled, browser-local sandbox, separate from live Firestore records. `/admin` is the actual business workspace. Test data entered in the demo never affects production.

`node scripts/check-public-rules.mjs` runs non-destructive access checks against the configured Firestore project. It verifies public catalogue access and rejection of private reads and invalid writes; it does not create records. The business owner should exercise the authenticated save/print workflow after their first Google sign-in.

## Owner data

Business name/address and WhatsApp **+91 98428 88851** are confirmed. GSTIN will be added later in Settings. The supplied product report has been imported into Firebase. Only published catalogue data is included in browser fallback assets. Selling prices, HSN classifications and GST rates require owner confirmation; closing stock valuations are not retail prices.

Sales with GST require a business GSTIN in Settings. Tax rates remain item-specific and must be set from the actual product classification. Purchase records are internal supplier records, not supplier-issued tax invoices. Reports include saved bills and enquiries, and do not establish that a WhatsApp message was sent or an order fulfilled.

See `CONTENT.md` and `DEPLOYMENT.md` for content and operating notes. No payment gateway, GST return filing, e-invoice/IRN integration, refunds or general accounting ledger is included.

## Private source records

The original stock report is retained at the authenticated Firestore path `private/openingStockReport`. Its CSV download requires an active business session at `/api/inventory-source`. The full private report, unpublished opening inventory, credentials and local operational notes are excluded from this public repository. Reference photographs are credited at `/image-credits`; exact photos remain pending for unmatched items.
