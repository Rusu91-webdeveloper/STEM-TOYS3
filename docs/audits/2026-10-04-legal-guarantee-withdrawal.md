# Harmonised legal-guarantee notice and online withdrawal

Prepared 4 October 2026, based on origin/main 26adeac466cd254acd4732346184f2613237f1dd.
This is a draft implementation; publication does not certify the entire shop or
replace verification of actual fulfilment, refunds and email delivery.

## Requirements and sources

- [EU business guidance](https://europa.eu/youreurope/business/selling-in-eu/consumer-contracts-guarantees/eu-legal-guarantee-notice-and-garan-label/index_en.htm).
- [Commission practical guidelines and official vector files](https://commission.europa.eu/publications/practical-guidelines-and-high-resolution-vector-files-eu-notice-and-label-product-guarantees_en).
  Online first-click presentation is described on pages 17–20 of the guidelines.
- [OUG 18/2026](https://legislatie.just.ro/Public/DetaliiDocument/308474),
  published in Monitorul Oficial 236 of 26 March 2026. The official gazette text
  was also read from its [published PDF copy](https://ptir.ro/wp-content/uploads/2026/03/Monitorul-Oficial-Partea-I-nr.-236.pdf)
  when Portal Legislativ was unavailable.
  Article IV applies the online-withdrawal changes from **19 June 2026** and the
  guarantee-information changes from **27 September 2026**. Both dates precede
  this review. Article II point 13 introduces Article 11¹ in OUG 34/2014.
- Article 11¹ requires an accessible online function, separate confirmation,
  name, contract identification and an electronic confirmation destination;
  acknowledgement must contain the declaration and submission date/time on a
  durable medium without undue delay.
- [OUG 34/2014](https://legislatie.just.ro/Public/DetaliiDocumentAfis/254147),
  Articles 9 and 13: the goods deadline starts from receipt, and valid withdrawal
  refunds include standard delivery under the applicable rules. RTO treatment
  must not override statutory withdrawal rights.

## Root gaps and implementation

The existing account return API requires login, a reason and DELIVERED status.
That workflow is preserved, but cannot be the sole online withdrawal function.

### Guarantee notice

`public/images/legal/eu-legal-guarantee-ro.svg` is the unmodified Romanian RGB
Commission asset, extracted from `Legal guarantee_notice RO.svg` in SVG.zip.
SHA-256: `dc168eca5e0b78f3daf7a3cf2b111987c3121d19eec52322a6eeb789b0c45b2a`.
Source/download provenance accompanies it in `eu-legal-guarantee.md`.

A native disclosure appears in the storefront header and immediately before
final checkout actions. It renders the whole asset, including its QR code,
with scrolling and a full-size link. The link to the QR destination is provided
separately for mobile users. No product-specific commercial GARAN label or
manufacturer durability promise is invented.

### Withdrawal function

- `/withdrawal` is public, linked persistently in the header, footer, terms and
  returns page. It requires neither login nor a reason, photos, marketing
  consent, delivered status or a successful account-return request.
- Name, acknowledgement email and contract/products are reviewed first.
  Only the separate **Confirmați retragerea** action submits the declaration.
- `/api/returns/withdrawal` validates the existing signed guest CSRF mechanism,
  limits request size and submission rate, and normalises strict schema input.
- An existing EmailLog row stores the complete declaration and server UTC
  timestamp before email is attempted. Arrival time is captured at handler entry,
  before asynchronous security/rate-limit checks, so validation latency cannot
  shift the acknowledged time across a withdrawal deadline. A random submission reference prevents
  duplicate retries changing the original receipt time. Changed identity or
  content with a reused reference is rejected.
- Tracking privacy: AnalyticsWrapper omits the withdrawal route even with full
  optional consent. Public entry links use full document navigation, not Next
  client navigation that leaves SDK listeners attached. Before form fields
  become available, any already loaded GA4/Meta/TikTok/Vercel tracking script
  triggers a clean reload. Consent preferences elsewhere are preserved.
- Plain-text and escaped HTML acknowledgements contain the same declaration,
  reference and timestamp, also displayed/downloadable on success. Initial
  customer and merchant emails are attempted immediately. The merchant address
  comes from store settings. Development mail simulation is explicitly not
  reported as actual email delivery.
- Failed delivery keeps the declaration and exposes a truthful warning and
  downloadable receipt. Admins can retry only missing recipients. Atomic claims
  avoid concurrent sending; a stale claim can recover after five minutes.
  A timed-out provider may subsequently finish, so duplicate receipt emails
  with the same reference are possible; no exactly-once SMTP promise is made.
- `/admin/withdrawals` and its private, bounded API require the strict ADMIN
  role. Admin mutations also require CSRF. Review state cannot overwrite
  in-flight email state; updates compare the stored receipt before changing it.
- Receipt intake acknowledges notification, and does not automatically cancel,
  refund, release/capture a card hold, approve an exception or disclose order
  details to an unverified email. The merchant verifies identity, the actual
  receipt-based deadline and subsequent return/refund steps separately.
- Terms, returns and privacy copy explain this workflow. RTO wording is clarified
  to preserve a valid pre-delivery withdrawal and standard delivery refunds.
  Admin instructions explicitly require reviewing withdrawal notices before
  capturing a COD refusal hold.
- These legal receipts are distinct from EmailEvent analytics, and are excluded
  from the configured 30-day analytics cleanup. Access/erasure requests for
  guest declarations are handled through the published privacy contact after
  identity verification; required transaction/dispute evidence is preserved
  only for its stated purpose. No new marketing consent is collected.

## Verification and limits

- 35 focused tests pass across service, public/admin routes and the two-stage
  React form: save-before-mail, guest access, timestamp/content, retry identity,
  interrupted delivery, failed storage/email, CSRF, rate/size limits, admin denial,
  review races, escaped HTML, no submission during review, honest UI failures, consented-route exclusions and isolation from loaded SDKs.
- New source/test files have zero lint errors or warnings. Modified existing
  files were checked separately; existing unrelated warnings are not treated as
  a clean repository lint result. Migration validation confirms no schema or
  migration changes. Required full Jest/TypeScript comparisons run through the
  normal Git hooks. The first source commit passed: Jest baseline/current both
  have 64 failed suites and 175 failed tests, with zero added failures; TypeScript
  baseline 1,204/current 1,196 diagnostics, with zero added diagnostics. Existing
  debt remains; neither check represents a clean full repository run.
- Local browser checks confirm the native notice, full-size/QR links, permanent
  withdrawal entry point, guest review step and no horizontal overflow at a
  measured 391 CSS-pixel mobile width. A focused hit-test found that an open
  notice initially covered the mobile withdrawal link. The link is now above the
  disclosure on mobile, while the notice remains left and the link right on
  desktop. Repeated browser hit-testing at 391 CSS pixels confirms the link
  itself is the clickable target with the notice open, with no horizontal overflow.
- Local guest token issuance works. A real local submission correctly showed
  an unconfirmed-registration error when PostgreSQL was unreachable, rather than
  claiming receipt. Docker's socket and CLI were also unresponsive. No production
  database URL was substituted. Successful real-DB persistence was therefore
  not verified in this local session; unit tests use controlled persistence.
- SMTP inbox delivery and authenticated admin processing require an owner-approved
  preview test using a fictitious order and designated recipient. A successful
  mail-provider response alone is not proof of inbox delivery.
- No real withdrawal, order cancellation, refund, card action, production data
  change, new schema, merge or production deployment was performed in this task.

## Merchant acceptance before release

1. Review the notice, withdrawal form and policy wording in the draft preview.
2. Submit a clearly labelled fictitious test declaration to an owner-designated
   email address. Verify the reference, content, date/time, downloadable receipt,
   actual inbox acknowledgement, merchant notification and saved admin row.
3. Confirm guest/non-admin denial of the admin API. As admin, retry a failed
   acknowledgement and mark the test as reviewed; confirm no financial/order
   status changes. Review marking does not itself complete a return/refund.
4. Ensure staff promptly handle incoming declarations and failed acknowledgements,
   including pre-delivery withdrawals, statutory refunds and COD-hold release.
   The UI records notices; fulfilment and lawful financial processing remain
   operational responsibilities.
5. Merge/deploy only after those checks and the owner's release instruction.
