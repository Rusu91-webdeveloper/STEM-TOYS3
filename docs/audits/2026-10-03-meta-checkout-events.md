# Meta storefront conversion tracking

Started 2026-10-03, 21:58 EEST, from fetched `origin/main`
`a635bfb756060180a72c0a179abdd9c293f3e67c`. Owner requested checkout
verification after accepting the saved-card containment release.

## Verified root causes and implementation

- The configured consent-gated Pixel recorded PageView, but the actual product,
  cart and CheckoutFlow callers only called GA4. Connect ViewContent, AddToCart
  and InitiateCheckout independently of analytics consent.
- Queue advertising-consented activity until this shop's Pixel initializes;
  target Pixel `787839287564208` with trackSingle. Bound the queue to 50 and
  discard activity from a changed consent revision. Do not replay activity
  collected before consent.
- Use database product/book IDs, RON, product prices and the quantity actually
  added after stock capping. Checkout uses the current cart merchandise value.
  Purchase uses the existing server-generated order analytics, excluding tax,
  shipping and COD fees. No customer identity fields are added to Meta payloads.
- Only verified PAID card orders can emit Purchase; failed order responses,
  pending payments and test mode cannot. Order-specific eventID plus browser
  session deduplication suppress repeated accepted responses and callback
  reloads.
- Netopia's URL is not proof of payment. Keep the existing database-backed
  payment/amount/currency validation and also require the same consent category
  and revision as at order creation before tracking after redirect.
- Product views capture the currently visible product when consent is granted,
  and React rerenders/StrictMode do not duplicate a view or checkout entry.

## Owner decision and operational limits

Owner confirmed: **COD Purchase only after payment has been collected.** The
current admin delivery update automatically sets COD paymentStatus to PAID when
status becomes DELIVERED; that is not a separate cash-collection signal.
Therefore this browser patch excludes all COD orders from Meta Purchase,
including COD with a PAID payload. Actual COD collection tracking remains open:
it needs a verified collection signal, retained consent evidence and a
separately reviewed server-side integration. Existing payment/accounting
behavior is unchanged.

Browser tracking remains best effort: ad blockers, unavailable storage, missing
consent and closing the browser can prevent delivery. No Conversions API or
cross-device deduplication is introduced. Product IDs are verified against the
shop; correspondence with an external Meta catalog has not been established. No
database/schema/migration/dependency changes or real paid test order.

## Validation and release

- Eight focused analytics/cart/checkout/consent suites: 55 tests pass.
- Changed-file ESLint: zero errors; existing warnings remain. ESLint initially
  exceeded Node's default heap; rerunning with an 8 GB heap completed.
- The legacy GuestCheckoutFlow test's `49.99` expectation fails against the
  actual Romanian `49,99 lei` display on both fetched main and this branch;
  independently reproduced in an isolated main snapshot. Not changed here.
- React review: tracking runs in effects/event handlers, subscriptions are
  cleaned by the existing consent hook, refs prevent rerender duplication; no
  render-time network calls or new fetch waterfalls.
- Required Git hooks completed: full Jest baseline and candidate each have 65
  failing suites / 179 failed tests, with zero regressions; TypeScript has 1207
  errors in both snapshots, with zero added diagnostics. Existing debt remains;
  these are comparison checks, not fully clean suites.
- [Draft PR #61](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/61)
  published from source `c1147f0d`. Public Pixel configuration was saved for
  Preview branch `codex/meta-checkout-events` only after publishing the branch
  (Vercel rejected the nonexistent branch before publication). Production
  settings are unchanged. Preview browser evidence remains pending.
- Guest COD: prepare the cart/checkout for the owner to finish with real contact
  and delivery details. No invented customer data or order submission.

## Browser investigation on 2026-10-04

Preview `dpl_CfBuLwWy8aD94xiFDkA6JqPiRYYC` at commit `d9f51a71`
is READY with the branch-specific Pixel configuration. Chrome Network shows no
Facebook requests before a choice, after refusal/product navigation, or with
analytics-only consent. Advertising-only consent loads fbevents.js and the
configuration for Pixel `787839287564208` (HTTP 200), but no event requests
arrive: Chrome Console reports that Meta's iframe/form transport to
`https://www.facebook.com/tr/` violates `frame-src` and `form-action`.

Allow that specific tracking path in both directives; keep the existing
destinations and all other restrictions. Consent gating remains mandatory.
The rebuilt preview must prove actual event delivery before release.

## Verified rebuilt preview

On 2026-10-04, deployment `dpl_DNpajSW5aFqms1znWfWMynovYt94` is READY
at source `ae3f48d46492acfd213af861ac8040a0861985b0`:
[tested preview](https://stem-toys-3-8xndlfg6b-rusujobs-3774s-projects.vercel.app/).
Chrome DevTools Network/Payload/Headers, through actual storefront controls,
confirms all three events target Pixel `787839287564208` and return HTTP 200:

- ViewContent on granting advertising-only consent while viewing the rocket.
- AddToCart after one accepted cart addition.
- InitiateCheckout on entering the guest checkout.

All use product ID `cmtvafnwi000tybxy0n4itjr6`, quantity 1, item price/value
168, currency RON and num_items 1. Analytics consent was unchecked. Inspecting
the complete event request list after image changes and consent-dialog
opening/closing found exactly one of each of these three events. Additional
PageView, RomanianSTEMView and Meta-configured SubscribedButtonClick events
are present; they are not duplicate storefront conversion calls.

Fresh product load before consent sends no Meta requests. Withdrawal reloads
the guest checkout and again yields zero Facebook requests. The specific CSP
path allowance resolves the observed iframe/form blocker. Source commit checks:
Jest baseline/candidate remain 65 failed suites / 179 failed tests, zero added;
TypeScript remains 1207 errors in both, zero added. Config syntax/diff checks
pass. Whole-file Prettier still flags the existing next.config.js/TASKS layout;
no unrelated formatting rewrite was made.

Guest checkout is prepared with one rocket and blank contact/delivery fields.
It shows 168 lei merchandise + 19,99 lei shipping = 187,99 lei before choosing
payment. Owner must enter real details, choose delivery/COD and complete the
real order. No paid-card transaction or COD order was submitted; Purchase
boundaries are covered by the 55 focused tests, not a live paid-order proof.
Meta Events Manager receipt is also an owner check; HTTP 200 alone does not
prove account processing. Production is unchanged.

Discovered separately: cart drawer displays shipping as Gratuit for this
168 lei cart, while checkout correctly charges 19,99 lei. Investigate that
display in the next shipping task; it is not changed in this tracking patch.

Official references consulted:
[Meta Pixel reference](https://developers.facebook.com/documentation/meta-pixel/reference)
and
[conversion tracking](https://developers.facebook.com/documentation/meta-pixel/implementation/conversion-tracking#standard-events)
(the latter shows June 30, 2026 as its update date). The current official
fbevents.js confirms the trackSingle/eventData signature used here.
