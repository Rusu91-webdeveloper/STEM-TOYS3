# Privacy-policy review — 2026-10-03

## Scope and verified state

Fetched `origin/main` before editing: `eeadaab6`. The worktree was clean at
`44ddff53`, branch `codex/cookie-consent`, existing draft
[PR #59](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/59).
This is a reviewable policy draft on that preview branch, not production
activation of Meta and not certification of GDPR compliance.

The owner's Events Manager screenshot at 16:04:26 shows dataset
`787839287564208` with `PageView` and `RomanianSTEMView` Active, three receipts
for each. It proves ingestion in Meta's Overview. It does not identify which
browser generated those receipts, prove the Test events UI, or verify purchases.

## Changes and evidence

- Replaced the wrong `TechTots Educational Solutions` operator with the existing
  canonical `COMPANY_LEGAL` values for WEBIRA REM S.R.L. in
  `lib/config/company-legal.ts`. These are the shop's established legal details;
  this review did not independently validate registry records. A read-only
  production GET of `/api/store-settings` confirmed `info@techtots.ro` and
  `+40 771 248 029` on 2026-10-03.
- Static revision date, 3 October 2026, replaces the date that changed on every
  visit. Removed unsupported DPO appointment, 13-year threshold, office hours
  and blanket compliance assurances. Metadata describes the notice's contents.
- Data/source/purpose/basis disclosures follow the account, contact, newsletter,
  checkout and tracking flows. The legal bases are proposed policy positions
  for operator review, not an assertion that every operational process has
  already passed a compliance audit.
- Payment recipients: Stripe and NETOPIA, conditional on the selected method;
  FAN Courier for delivery/FANbox; Google sign-in and GA4; Meta Pixel; Vercel
  hosting and analytics. TikTok is described conditionally, not as currently
  active. Database/email services are recipient categories, without guessing
  the deployed SMTP/database vendor from repository defaults.
- `app/api/checkout/order/route.ts` and `lib/checkout/cod-guarantee-policy.ts`
  evaluate COD eligibility/guarantees from value, delivery and order history.
  The notice discloses automation rather than promising no automated decisions.
- The consent text matches `lib/analytics/consent.ts` and
  `components/analytics/AnalyticsWrapper.tsx`: separate analysis/advertising,
  refusal, withdrawal, 180-day local choice; essential checkout remains usable.
  Authentication `maxAge` is 30 days in `lib/server/auth.ts`; it is not an
  account-erasure deadline. Cart local storage is retained by the cart context.
- Policy prose is rendered on the server; only the existing cookie-settings
  event button requires client JavaScript. Sections were split into small
  components to satisfy the repository's 300-line limit. No new dependencies.

## Primary legal/provider sources checked

- [GDPR, Regulation (EU) 2016/679](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679):
  legal bases, information and retention criteria. EUR-Lex direct fetching hit
  a bot-verification page; relevant indexed official text and the regulator's
  guidance were used, not third-party policy generators.
- [ANSPDCP FAQ](https://www.dataprotection.ro/index.jsp?page=IntrebariFrecvente1),
  sections 21–26: rights, one-month response (possible two-month extension),
  complaints, safeguards and purpose-limited storage.
- [ANSPDCP complaints](https://www.dataprotection.ro/?page=Plangeri_RGPD).
- [Accounting Law 82/1991, consolidated art. 25](https://legislatie.just.ro/Public/DetaliiDocumentAfis/291549)
  and [Law 36/2023](https://legislatie.just.ro/Public/DetaliiDocument/263884):
  general financial supporting-document retention is five years from 1 July
  following the relevant financial year. The indexed official text confirms
  the amendment; direct retrieval intermittently returned server errors.
  This is not a five-year blanket limit on all customer records.
- [Stripe privacy policy](https://stripe.com/privacy) and
  [privacy center](https://stripe.com/legal/privacy-center): payment processing
  and Stripe's own purposes; do not classify every recipient as only a processor.
- [NETOPIA privacy policy](https://netopia-payments.com/politica-de-confidentialitate/).
- [FAN Courier processing policy](https://www.fancourier.ro/politica-de-prelucrare-a-datelor-cu-caracter-personal/).
- [Google transfer frameworks](https://policies.google.com/privacy/frameworks):
  adequacy/DPF and SCC mechanisms, not a claim of EU-only processing.
- [GA4 retention settings](https://support.google.com/analytics/answer/7667196?hl=ro):
  standard user/event settings differ from aggregated reporting. The actual
  merchant setting has not been verified.
- [Vercel DPA](https://vercel.com/legal/dpa) and
  [privacy notice](https://vercel.com/legal/privacy-notice).
- [Meta Controller Addendum](https://www.facebook.com/legal/controller_addendum)
  and [Business Tools Terms](https://www.facebook.com/legal/terms/businesstools):
  authenticated Chrome rendered the official pages (automated web retrieval
  redirected to login). Read-only; no account settings or agreements submitted.
  Collection/transmission for the advertising purposes is joint processing;
  Meta handles rights for data it stores after that processing. Business Tools
  section 4(b) states up to two years for Event Data and audiences until deleted.
- [Meta transfer safeguards](https://www.facebook.com/privacy/policy/?subpage=9.subpage.3-HowDoWeSafeguard):
  official policy dialog and its “appropriate mechanisms” explanation checked
  in Chrome. DPF applies to certified services; other transfers may use SCCs.
- [TikTok's Romanian EEA privacy policy](https://www.tiktok.com/legal/page/eea/privacy-policy/ro)
  rendered in Chrome (updated 30 November 2025); automated retrieval was
  robots-blocked. No active TikTok configuration was assumed or changed.

## Material findings remaining before production approval

1. **Saved-card endpoint:** `app/api/account/payment-cards/route.ts` POST
   encrypts and persists a full card number and CVV. The schema and handler
   confirm this code path; the production GET returns 401 without authentication.
   No POST, account login or database query was used to test it, and no claim
   is made about the number of stored cards or whether customers use the path.
   The [PCI SSC guidance](https://www.pcisecuritystandards.org/faqs/are-merchants-allowed-to-request-card-verification-codes-values-from-cardholders/)
   prohibits retaining CVV after authorization even encrypted. Investigate,
   disable/replace direct saved-card collection with provider tokenization and
   plan authorized cleanup separately. This draft does not claim the shop
   never stores full card details and does not normalize CVV storage as safe.
2. **Erasure implementation:** `/api/gdpr/delete` anonymizes selected fields and
   records a `30_days_then_permanent_deletion` label, while its response promises
   permanent deletion within 30 days “as per GDPR”. That is not GDPR's general
   one-calendar-month response rule. No scheduled permanent-deletion worker
   was found in `vercel.json` or callers of the archival cleanup method.
   Order-related fields and guest data need a separate inventory/rights review.
   The policy does not repeat the automatic 30-day deletion guarantee.
3. **Owner-controlled retention:** actual GA4 setting/reset-on-activity,
   support-mailbox practices, account cleanup, hosting/email/database contracts,
   backup/log retention and transfer safeguards remain unverified. An owner
   question is pending. General category-specific criteria avoid fabricated
   durations but still need an operational schedule and owner review.
4. **Operator review:** initial preview verification exposed a registration-number
   conflict: the shared config used `J20/352/2025`, while About and the translated
   footer used `J2025035239005`. The owner confirmed `J2025035239005` in this chat
   on 2026-10-03. The shared config and footer fallback now agree; the privacy
   notice includes that value through the shared config. The confirmation is
   owner-supplied, not an independent registry lookup. Confirm company address,
   receipt and handling
   of privacy requests, financial-record exceptions, lawful-basis positions,
   provider agreements and new tracking uses before treating the draft as final.
   Advanced Matching, CAPI and purchase tracking are not enabled by this change.

No schema, migration, payment flow, account-erasure behavior, supplier-feed
visibility or secret/history changes are part of this policy update.

## Validation

- Five focused analytics/consent suites pass: 31 tests.
- Changed privacy files pass Prettier and ESLint. The one-file identifier
  omission was formatted and linted again.
- Required full Jest comparison for `c1d50d3c`: 65 failing suites / 179 failed
  tests in both baseline and candidate; zero new failures. Required TypeScript:
  1208 baseline errors / 1207 candidate errors; zero added. Existing debt remains.
- Vercel preview `dpl_2bhdhzfYmUaerkzikHJpriNzUQLd`, source `c1d50d3c`, READY:
  https://stem-toys-3-43hgxch6o-rusujobs-3774s-projects.vercel.app/privacy
- Read-only HTTP GET returned 200; the initial HTML contains the policy article,
  correct operator, retention, rights and Meta disclosures without executing JS.
  The old operator is absent.
- CUA browser checks at 1440×900 and 390×844: document width matches viewport,
  all 11 contents links resolve to section IDs, and mobile anchor navigation
  settles below the header. The three-column basis table remains within 309 px.
- After refusing optional cookies, the article's settings button opens the
  consent panel on both viewports with analysis/advertising unchecked and
  necessary storage checked/disabled. Mobile controls remain visible/reachable.
- These layout/interaction checks also exposed the registration conflict above.
  The follow-up changes only omit that number and record this audit; its final
  deployment/text verification is recorded in PR #59. No production promotion.


## Owner registration-number confirmation — 2026-10-03

The owner supplied `J2025035239005`. Applied it to `COMPANY_LEGAL.regCom`
(which also supplies the email legal footer), corrected the footer fallback,
and reinstated the shared register number in the privacy notice. Existing About
and Romanian/English translated footer values already match. No other legal
facts, dates, payment behavior or database/schema files changed.

Changed source files pass ESLint; privacy/config formatting and diff checks pass.
Required regression hooks and the exact final deployment/rendered value are
reported in draft PR #59 after publication. Other operational findings remain open.

## Saved-card follow-up — 3 October 2026

The follow-up investigation confirms reachable account-page callers for the
legacy card POST. Checkout explicitly excludes these records because they are
not chargeable provider tokens. The containment patch disables POST/PUT without
parsing card input, removes collection forms, and preserves owner-only masked
viewing/removal. See [the saved-card audit](2026-10-03-saved-card-safety.md) for
verified evidence, tests and deployment status. Existing stored records have not
been inventoried or purged; the original finding is not fully closed.
