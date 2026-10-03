# Saved-card containment — 3 October 2026

## Verified root cause

Started from fetched `origin/main`, `392e04a1`, with a clean worktree. The
account payment-methods page, new-card page and edit page reach the legacy card
feature. `PaymentCardForm` and `SavedPaymentMethods` submit card details to the
account API. This is a reachable collection path, not an unused database model.

Before this change, `POST /api/account/payment-cards` encrypted and persisted
the full card number and CVV. `PaymentCard.encryptedCardData` is required and
`encryptedCvv` is optional in the existing Prisma schema. Encryption does not
make post-authorization CVV retention acceptable; see the
[PCI SSC guidance](https://www.pcisecuritystandards.org/faqs/are-merchants-allowed-to-request-card-verification-codes-values-from-cardholders/).

Checkout explicitly excludes account cards in
`features/checkout/components/PaymentForm.tsx`: they are not chargeable provider
tokens. Stripe's Payment Element and the NETOPIA checkout flow are separate.
There is no `decryptData` caller in the application paths searched. This patch
retires account-card collection rather than introducing a new recurring or
saved-provider-payment feature. Stripe describes direct provider collection in
its [security guide](https://docs.stripe.com/security/guide).

## Containment implemented

- Account POST/PUT require an authenticated user ID, then return HTTP 410 with
  `LEGACY_CARD_STORAGE_DISABLED`. Neither parses the request body nor accesses
  the database. Anonymous or incomplete sessions receive 401.
- Removed account card-number/CVV forms and add/edit/default controls. Existing
  new/edit URLs redirect to the payment-methods page. Compatibility components
  cannot submit card details.
- Customers see an explanation directing card entry to the payment processor at
  checkout. Previously saved entries show only masked metadata and retain an
  explicit, owner-only removal action with a confirmation dialog.
- GET and DELETE select only necessary metadata; no encrypted card data or CVV
  is read. Removal is scoped to the authenticated owner. Every account-card
  response is private/no-store, including denial and error responses. Generic
  errors do not log database exception objects or echo submitted card input.
- No schema, migration, dependency, payment-provider or checkout behavior
  changes. Existing owner-removal/default-fallback semantics are preserved.

## Existing data remains unverified

The mandatory local database safety check returned `.env.local file not found`.
No database connection, production query, decryption, export, migration or bulk
cleanup was performed. Record counts and historical customer use are unknown. A
code fix does not establish that previously stored sensitive data is absent.

The remaining operation must use approved database access and verified target
identity. First obtain aggregate counts of legacy records and nonempty encrypted
fields without selecting their values. Review backups/logs and any other copies.
If records exist, prepare an explicit cleanup of legacy card records, which are
not used at checkout, with affected-row counts and an owner-approved execution
and recovery plan. Do not create an additional plaintext export of card data.
Any destructive operation requires the repository's database safety workflow and
explicit owner authorization for that concrete operation. No automatic purge is
included in this patch.

## Validation

- Five focused suites: 56 tests pass, covering incomplete/anonymous sessions,
  malformed and card-bearing rejected writes, owner-only metadata/removal,
  deletion failures, redirects, retired forms, and existing Stripe checkout
  ownership/Payment Element behavior. Synthetic test card data stays in mocks.
- Changed source/tests pass ESLint and Prettier. Every new code file has fewer
  than 300 lines.
- Full TypeScript comparison: 1,207 baseline and candidate errors; zero added.
  Existing repository errors remain; this is a regression comparison.
- Required full Jest: baseline/candidate both have 65 failing suites and 179
  failing tests, zero regressions. The first snapshot failed with disk
  exhaustion; clearing generated Jest cache allowed the unchanged hook to pass.
  Pre-push confirms no schema/migration changes and repeats the passing
  TypeScript comparison. Published
  [PR #60](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/60), final
  source `6aa13dc8`. No local production build was run because its script
  invokes database migrations.
- The preview domain lacks the owner's Google OAuth configuration; no
  authentication bypass or production test identity was introduced. The owner
  completed authenticated acceptance on production, as recorded below.

## Production acceptance and source integration

The owner deployed final source `6aa13dc8` to production as
`dpl_9irmWyDBovM8yk1rwRwhDWfyGj3d`, READY on techtots.ro and www.techtots.ro.
The screenshot supplied at 21:29 EEST shows the signed-in account page with the
payment-processor notice, no stored entries and no card-entry/add/edit controls.
The owner subsequently confirmed that the account page, new-card redirect and
configured card-payment checkout options work as expected. This confirms those
manual acceptance checks; no completed order or payment is claimed.

Independent anonymous production checks confirmed HTTP 401 and private/no-store
for `/api/account/payment-cards`, account login redirects and HTTP 200 for the
authentication providers endpoint. These checks do not establish global card
record counts.

At the owner's explicit request, PR #60 was merged on 3 October 2026 at 21:38
EEST as `9bc2ef3c0b5f5d99ea1be1ce90d6257fb2722f77`. Its Git tree matches the
owner-tested `6aa13dc8` exactly. Production deployment
`dpl_72wNAcBJnoDSTpyMruMnyCx3Gmx8` is READY from that merge commit and serves
both shop domains. Post-release checks on www.techtots.ro pass: homepage HTTP
200; saved-card API HTTP 401 with private/no-store; account/payment-methods and
new-card URL redirect to login for anonymous visitors; authentication providers
HTTP 200 with Google and credentials available. Release-record publication
changes documentation only. Existing sensitive-record inventory and any
authorized cleanup remain open.

## Owner acceptance on the approved deployment

Sign in with an ordinary customer account and visit `/account/payment-methods`.
There must be no card-number or CVV inputs and no add/edit/default action. New
and edit URLs must redirect there. If existing entries are shown, only their
masked metadata and removal action are available; removing a real record is an
intentional destructive customer action, not required just to test the layout. A
normal checkout must still offer its configured Stripe/NETOPIA options. Do not
submit a real order merely to verify this account-page change.
