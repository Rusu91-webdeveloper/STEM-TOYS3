# Shipping, privacy operations and legal/trust remediation

Date: 2026-10-04. Baseline: origin/main
77e6b2d34f6514dd493303ec894cb2a5c571db56. Scope requested by the owner:
investigate and fix shipping consistency, then privacy operations, then
legal/trust content. No production orders, payments, customer erasure or
historical card purge were performed.

## Shipping findings and changes

The drawer initialized delivery to zero while settings loaded, presenting
unknown delivery as “Gratuit”. Its failure fallback used 15 lei / 199 lei. The
legacy shipping-settings endpoint returned unused Online/Ramburs prices. A
second client calculation could discard an authoritative separate-shipment
surcharge above the threshold.

Read-only production settings verified: delivery 19.99 lei; free first-shipment
threshold 500 lei inclusive; COD fixed fee 5 lei and percentage setting **0.01
percent**, not 1 percent. For 168 lei products + 19.99 lei shipping, COD is 5.02
lei and total 193.01 lei. The configured rate was preserved. FANbox requires
prepaid online payment. Every eligible home-delivery COD order requires the
previously released temporary outbound-shipping authorization.

The drawer and cart retain an unknown estimate while loading or on a failed
settings request. Shared defaults follow 19.99 / 500. Public shipping endpoints
omit obsolete Online/Ramburs fields. Checkout cannot proceed using a made-up
quote after an API failure. The selector and summary preserve server quote
prices, including supplier surcharges. Shipping/FAQ and checkout explanations
use the configured COD rate and explain the hold; visible FAQ and FAQPage data
agree.

Fetched GitHub again before publication and incorporated Cursor commit
`cfea8830`, which replaces the remaining hardcoded payment-selector fee label
with fetched admin settings and formats zero-percentage fees correctly. Its
9.90 lei fallback was preserved; it is not evidence of the live configured
rate. A fresh production endpoint read still returned 5.00 lei / 0.01 percent.
A focused assertion verifies that this configuration displays 0.01% + 5 lei
and calculates 5.02 lei for the reported 187.99 lei pre-fee amount.

Final browser review also found an exclusive “over 500” label in the shared
product badge and “unavailable” before settings loaded. The badge now says
“from 500” and shows delivery calculated at checkout while unresolved, in
Romanian and English. Its untranslated return fallback is corrected to 14 days.

## Privacy root issues and changes

The prior erasure endpoint trusted a broad authentication wrapper, scheduled a
30-day claim without a demonstrated job, retained old card rows and active
identity fields, and cleared addresses needed by transaction records. Retention
controls returned invented compliance numbers; PATCH inferred a policy ID from
the route pathname. Maintenance independently deleted old failed/cancelled
orders after seven days, bypassing statutory-record review.

Erasure now requires a concrete signed-in account, CSRF and explicit
confirmation. A serializable transaction clears account/profile data,
password-reset/two-factor data, cards (including encrypted PAN/CVV), unused
addresses, marketing membership, downloads, reviews and wishlist. It disables
login and clears caches. Orders, invoices, order-linked addresses and minimal
request evidence are retained for legal review. Open orders or returns place the
request in an admin review queue; staff identities require review. Repeated
processing is safe and transactional rollback prevents partial erasure. The
active account screen uses this real flow and authenticated JSON export rather
than simulated deletion/export handlers.

Admin `/admin/privacy` shows aggregate historical card counts, actual configured
policies and pending erasure requests. Its routes require ADMIN and
private/no-store responses. Counts never select or decrypt card content. Request
processing accepts only an existing customer-confirmed queue record, with CSRF
and a separate irreversible-action acknowledgement.

Only explicitly configured email-event and performance-metric policies run
automatically, bounded to 500 records per category per daily cron run.
Personal/marketing data cannot be blanket-purged by these controls. Orders,
invoices and consent evidence are preserved. No production retention cleanup was
triggered.

### Verified external operations

- Read-only aggregate inventory completed against the Vercel-connected live Neon
  main branch: zero PaymentCard rows, zero rows with encrypted card data, zero
  rows with encrypted CVVs. No card content was selected or decrypted and no
  purge was necessary. Neon reported one active branch, no listed snapshots, no
  automatic snapshot schedule and a one-day point-in-time recovery window. This
  establishes the current live inventory, not the absence of data from past
  recovery points or separately exported backups.
- The owner explicitly chose GA4 event/user retention of 2 months with reset on
  new activity disabled. The user setting was saved and verified after reload in
  property 489085677; event retention was already 2 months. Google states that
  changes apply after 24 hours. The privacy notice now reflects the saved
  configuration. Standard aggregate reporting is separate.
- Live DataRetentionPolicy was empty. After the owner explicitly approved the
  scope, application email-event retention was set to 30 days and performance
  metrics to 60 days, both with automatic cleanup enabled. A separate read
  confirmed both rows. No cleanup was triggered manually. The existing metric
  backlog will be processed in bounded batches by the new daily worker after
  release; transaction records and consent evidence are excluded. External
  email/Meta provider retention is separate from these application policies.
- Vercel settings show cron jobs enabled, daily maintenance scheduled at 01:00
  UTC and `CRON_SECRET` configured for all environments (value not revealed).
  Deployment-scoped logs show its latest previous-source production run
  returned HTTP 200. The new worker is connected to that existing authenticated
  schedule; its first scheduled production cleanup has not yet been observed.

## Legal and trust changes

Terms identify WEBIRA REM S.R.L., CUI 51813997 and owner-confirmed registration
J2025035239005. The revision is a fixed 4 October 2026, not an automatically
changing date. The blanket warranty/liability disclaimer is replaced with the
statutory conformity guarantee and remedies, preserving non-waivable consumer
rights. Withdrawal refund timing allows legally permitted withholding until
receipt or evidence of return. Defect photos assist review rather than
extinguishing rights. Digital withdrawal exceptions require prior express
consent and acknowledgement.

The common footer includes the current official ANPC SAL image and SAL/complaint
links, including mobile. The PNG was downloaded unmodified from ANPC; provenance
is in public/images/legal/README.md. Removed unsupported personal-testing,
therapeutic ADHD/autism, regional collection, donation and blanket certification
claims from About/Returns and FAQ translations. Removed an unverified company
founding date from About metadata. Shipping no longer promises unverified
universal insurance.

Preview review also found that the shared product template asserted safe
materials and guaranteed learning outcomes for every product. Its generic RO/EN
copy now uses conditional play guidance and the manufacturer's age/warning
instructions. Supplier product descriptions were not rewritten without product
evidence. English newsletter copy now matches the Romanian text without an
unverified weekly schedule, free resource pack or educator endorsement.
Shipping uses an inclusive threshold label, a fixed revision date and
estimated processing guidance instead of an unverified 14:00 same-day processing
promise.

### Primary sources consulted

- [OUG 140/2021](https://legislatie.just.ro/Public/DetaliiDocumentAfis/268151):
  conformity liability and statutory remedies.
- [OUG 34/2014, consolidated primary PDF](https://www.ancom.ro/uploads/links_files/OUG_34_2014.pdf):
  withdrawal, refund timing and exceptions.
- [ANPC Order 270/2026](https://legislatie.just.ro/Public/DetaliiDocument/310590):
  current SAL pictogram, 250 × 50 display and current SAL destination.
- [ANPC official SAL page](https://www.anpc.ro/sal): current download
  `/download/sal/SAL-PICTOGRAMA.png` and SAL links.
- [GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/): erasure exceptions and
  one-month response period.
- [GA4 retention documentation](https://support.google.com/analytics/answer/7667196?hl=en):
  user/event retention and reset behavior.

## Verification evidence

- Final combined run: 16 focused Jest suites / 99 tests passed:
  loading/failure/500-boundary
  shipping estimates, authoritative quote and surcharge preservation, required
  COD hold, configured fee copy/schema, account erasure identity/CSRF/failure
  handling, review queue, inventory access, retention controls and
  regression-diagnostic normalization, configured COD labels, translation
  fallback types and the corrected analytics route fixtures. Scoped merged
  component/helper lint completed with zero errors and warnings.
- `scripts/verify-account-erasure.ts` passed against the disposable local
  PostgreSQL 16 database `localhost:55432/stemtoys_dev`: actual schema/FKs,
  closed and open transactions, invoice/address preservation, legacy-card
  removal, repeat requests, staff denial, missing account, rollback and
  configured retention. The script explicitly rejects other hosts, ports and
  database names. No production data was involved. A later Docker availability
  issue prevented further local authenticated UI checks; the earlier database
  assertions remain the evidence for these behaviors.
- Browser inspection of local `/terms` confirmed company, revision, guarantee,
  preserved consumer rights and ANPC links. Screenshot stored in the task's
  visualization directory, not in Git.
- The repository has substantial pre-existing Jest/TypeScript/lint debt.
  Required hook checks compare against the fetched baseline. TypeScript
  diagnostic normalization now canonicalizes an unchanged literal union's member
  order; a unit test confirms changed members and changed surrounding messages
  remain distinct. No new error is waived.
- First commit 653aa29 passed mandatory full Jest regression checks:
  baseline/current 65 failing suites and 179 failing tests, zero added failures.
  Full TypeScript comparison: baseline 1207 errors/current 1203, zero added
  errors. These are regression passes, not clean full suites.
- Vercel preview `stem-toys-3-6n02iiwjs-rusujobs-3774s-projects.vercel.app`
  reached READY for exact commit 653aa29. Browser checks: drawer 206 lei + 19.99
  shipping = 225.99; 412 lei + 19.99 = 431.99; 618 lei/free shipping = 618. Full
  cart agreed at 206 and 618. The public shipping-settings endpoint returned
  19.99/500 and omitted legacy Online/Ramburs prices. Shipping explained the
  configured 5 lei + 0.01% COD fee and mandatory authorization. Terms showed
  company, fixed revision, two-year conformity remedies, preserved rights and
  ANPC/SAL links.
- Copy refinement commit be040b9f also passed mandatory Jest/TypeScript baseline
  comparison with the same counts and zero added failures/errors. Its exact
  Vercel deployment `stem-toys-3-oc6o8uym4-rusujobs-3774s-projects.vercel.app`
  reached READY. Final approved-retention notice and release checks follow.
- Adding final translation labels exposed a pre-existing unsafe string-map cast:
  translation dictionaries also contain nested error objects. Client and server
  translation helpers now accept only string values and preserve English/default
  fallback behavior; nested objects cannot reach rendered text. A focused test
  covers valid strings, empty strings, missing locales and object-valued keys.
  Two existing order metadata callers also lacked a `siteTitle` dictionary
  entry; both dictionaries now provide the verified TechTots name. The analytics
  route test fixture now supplies the actual product shape, executes the cache
  fetcher on a miss, isolates the shared quota/timers, and asserts the route's
  existing summary default. The affected translation, COD explanation and
  analytics suites pass (25 tests). Failed checks were corrected in source;
  hooks were not bypassed. Combined commit 0736b125 passed: full Jest baseline
  65 failing suites/179 tests versus candidate 64/175, zero added regressions;
  full TypeScript baseline 1207 errors versus candidate 1196, zero added errors.
- Exact preview 0736b125 reached READY at
  `stem-toys-3-bepowsf6u-rusujobs-3774s-projects.vercel.app`. Browser confirmed
  approved 30/60-day application and 2-month/reset-off GA4 wording, drawer
  206 + 19.99 = 225.99, current COD rate, statutory warranty and EN conditional
  product/14-day return/newsletter wording. The preview basket was cleared.
  Final review caught an omitted Romanian free-delivery key and an older
  English 1–3-day footer promise; translations now match Romanian delivery
  labels and the 1–4-business-day shipping estimate. This final copy correction
  requires its own passing hooks and exact-preview check.
- Production source release remains pending. GA4 and application policy
  configuration have been applied with the owner's explicit choices; no
  production customer erasure, card purge or manual retention cleanup occurred.
