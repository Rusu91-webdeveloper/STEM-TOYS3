# Mandatory COD authorization and guest checkout CSRF

Owner decision, 2026-10-04: every COD order must authorize the outbound shipping
cost on a card. This supersedes the previous risk-based 200 lei threshold and
returning-customer exemptions. The amount remains the authoritative configured
shipping hold price, not the full order total. No database/schema changes.

## Confirmed root causes

- The owner's 168 lei cart reached a 193.01 lei COD total. The tested preview
  policy API returned `required: false`, mode `risk_based`, new-customer
  threshold 200 lei. The missing card form followed that policy.
- Lockers have a separate prepaid-only rule in the payment selector and order
  API. They are not enabled for COD by this change. The guarantee policy itself
  must not exempt a locker if delivery eligibility changes later.
- The same guest browser's `/api/csrf-token` returned no valid session. The
  active middleware never issued the `guest_id` cookie the CSRF code required.
- A synthetic execution of the actual security functions confirmed that a
  generated `guest:<id>` token failed validation: splitting on every colon
  truncated the session id.
- Order submission reconstructed a plain Request after reading the body. For
  authenticated shoppers that could select a hashed-cookie identity rather
  than the decoded NextAuth identity used by token issuance.

## Change

- Shared policy always requires authorization. Retired `off`/`risk_based`
  environment settings cannot grant exemptions; historical threshold fields
  remain response metadata for compatibility and no longer control eligibility.
- The client keeps authorization mandatory even if it receives an older
  `required: false` policy response. It cannot continue without authorization.
- The order API keeps server-price, currency, actor ownership, email, consent
  and intent-reuse checks. Only a Stripe `requires_capture` intent qualifies;
  an already captured `succeeded` payment is not a temporary shipping hold.
- Guest intent issuance still rejects prepaid-only lockers, using the same
  explicit eligibility error as order placement.
- Token issuance establishes a random guest id in an HttpOnly, SameSite=Lax,
  HTTPS Secure cookie. Mutation validation never creates a missing session and
  continues to require a matching, signed, unexpired token.
- Token parsing preserves session ids containing colons; order validation uses
  the original request and the separately parsed body. Production signing uses
  the configured CSRF secret or configured auth secret and rejects an absent
  secret instead of using a public fallback. Token/session values and the raw
  checkout payload are removed from the affected debug logs.
- Checkout, consent, shipping and shared return/FAQ copy say that every COD
  order requires authorization. Consent version is `2026-10-04`; shipping is
  paid with the order at delivery and the authorization is not an upfront charge.

## Verification

81 focused tests pass across nine suites, including actual signed guest and
authenticated CSRF round trips, missing/wrong/tampered/expired token denial,
real PaymentForm behavior for low-value guest/returning customers with a stale
policy response, missing shipping-price denial, manual-capture intent pricing,
and order rejection for missing, captured, reused or mismatched authorizations.
Stripe calls, order writes and email are mocked in tests. No real card charged
or owner order submitted by the agent.

Required release comparisons against `origin/main` merge base `a635bfb7` pass:
Jest baseline/current both have 65 failed suites and 179 failed tests, with zero
regressions; TypeScript baseline/current both have 1207 errors, with zero added
diagnostics. These are regression comparisons, not clean full-suite results.
The first push caught an incomplete threshold test fixture; supplying its real
typed fields resolved that new diagnostic without weakening the test. Focused
new-file lint passes; broad changed-file lint retains seven pre-existing errors
and 133 warnings. Diff and focused formatting checks pass. No schema, migration,
dependency or environment-variable changes.

Deployment `dpl_Gc1knbtDYPjwSkJA3bK9oAvrwxU1` is READY at source
`3c6412e8d946053d87e2f7e07b800570a0ee1f21`:
[verified preview](https://stem-toys-3-rhcc931zz-rusujobs-3774s-projects.vercel.app/).
The deployed policy API returns HTTP 200, `required: true`, mode `always` for
the owner's 193.01 lei example. Its `amount` field is the evaluated order total,
not the amount held. Chrome refused direct navigation to that policy URL with
`ERR_BLOCKED_BY_CLIENT`; the authenticated Vercel fetch verified the response.

Chrome verifies the mandatory wording at `/shipping#rto` and anonymous
`/api/csrf-token` issuance without exposing token/session values in evidence.
Vercel fetch confirms HTTP 200, a nonempty guest token, `no-store` caching and
the new guest cookie's HttpOnly, Secure and SameSite=Lax flags. Actual mutation
round trips and rejected invalid tokens are covered by the integration tests;
no real checkout POST was submitted by the agent.

A fresh guest checkout is prepared with one 168 lei rocket, 19.99 lei shipping
and blank contact fields, with optional cookies refused. The owner's old filled
checkout tab is preserved. The owner must enter real details on this new host,
choose FanCourier home delivery and COD, accept the terms and authorize the
19.99 lei shipping hold. Real Stripe authorization, successful order submission
and any refusal capture/release remain owner acceptance checks. Production has
not been promoted. [Draft PR #61](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/61).

## Remaining acceptance and operations

The owner must complete an actual card authorization and guest COD order on
the new preview. A temporary authorization expires at Stripe's `capture_before`
deadline; requiring it on every order does not guarantee that funds remain
capturable until a late courier refusal. Operational deadline handling needs a
separate review before promising that coverage. See
[Stripe manual capture documentation](https://docs.stripe.com/payments/place-a-hold-on-a-payment-method).

COD Purchase tracking still requires verified cash collection and a consent-aware
server integration, as recorded in the Meta audit. This change does not treat
order creation or delivery as collected COD revenue.
