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

79 focused tests pass across eight suites, including actual signed guest and
authenticated CSRF round trips, missing/wrong/tampered/expired token denial,
real PaymentForm behavior for low-value guest/returning customers with a stale
policy response, missing shipping-price denial, manual-capture intent pricing,
and order rejection for missing, captured, reused or mismatched authorizations.
Stripe calls, order writes and email are mocked in tests. No real card charged
or owner order submitted by the agent.

Release comparison and deployed-browser results will be appended after preview
publication. [Draft PR #61](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/61).

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
