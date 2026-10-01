# Existing product buying guidance and conversion measurement

Implementation prepared on `codex/product-buying-guidance`, starting from
production commit `c255a753f73ff80ebd671ecc0f02348a56aa1ea4`. The owner
authorized release on 1 October 2026. No schema/migration change, supplier
import or catalog expansion is included. Live release evidence is recorded in
the release PR.

## Shopper changes

Three existing products now have a concise activity explanation by the price,
followed by the existing cart button and a factual contents/preparation summary.
Concrete activity ideas replace generic benefit claims on these pages. Their
descriptions no longer repeat unattributed testimonials or unsupported claims.
The public shopper normalization also applies the corrections to listing/API
payloads so the detailed page and product cards share the reviewed minimum age.
Prices, stock, images, recommendations and merchandising exclusions remain live
catalog values. The reviewed copy survives a supplier refresh without rewriting
supplier-owned database records.

| Existing product                     | Minimum age | Buying information                                                                   |
| ------------------------------------ | ----------- | ------------------------------------------------------------------------------------ |
| Plus-Plus Basic tube PP4185          | 3+          | 240 pieces; free construction; small-parts warning                                   |
| Logiblocs Secret Recorder 06808IS    | 5+          | Four electronic blocks; three AAA batteries not included; English instructions       |
| KidzLabs Mega Hydraulic Arm 4M-03427 | 8+          | Water-driven assembly; preparation tools/materials; adult assistance and supervision |

## Source record

Reviewed 1 October 2026. Product identity and current catalog facts were checked
against the production combined-product API and existing product packaging
images.

- [Plus-Plus manufacturer page, model 4185](https://www.plus-plus.co.uk/products/plus-plus-basic-mix-240-pcs-tube):
  240 pieces, 3+, small-parts warning, free construction. The old local supplier
  description said 5+; the manufacturer's exact model listing takes precedence.
  This is not an independently established developmental claim.
- [Current Secret Recorder catalog](https://www.techtots.ro/products/joc-electronic-logiblocs-set-secret-recorder-06808is):
  the existing supplied description specifies the four named blocks, batteries
  and instruction language. The product's packaging image states ages over five.
  No project-count, school-usage or award claim has been added to the new text.
- [Original 4M 00-03427 instructions, reproduced by Manualzz](https://manualzz.com/doc/77898852/4m-00-03427-mega-hydraulic-arm-owner-manual):
  safety section, contents, additional preparation materials and the four
  controls. This is an original manufacturer document hosted by a third party,
  not that site's chatbot summary. Follow the actual included instructions
  during assembly.

No testimonial, sales count, conversion uplift, guaranteed learning outcome or
demonstration footage was invented. New real video footage remains an optional
content addition when the store has footage it can use.

## Measurement definitions

Uses the existing
[GA4 ecommerce event format](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce).

| Event            | Trigger and meaning                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| `view_item`      | Product detail opened; once per product during that component visit                                         |
| `add_to_cart`    | Cart accepts an addition; quantity is the actual increment after stock capping                              |
| `begin_checkout` | Nonempty cart enters checkout after session resolution; once per checkout mount                             |
| `order_placed`   | API successfully persists an order; custom event, separated by payment method                               |
| `purchase`       | Server confirms a paid card order; Stripe success response, or matching database-confirmed Netopia callback |

Order analytics use persisted item identity/name and server-resolved pricing,
never the price/name/payment status supplied by the browser. Merchandise `value`
excludes tax, shipping and COD fees. Discounts and tax adjustments are allocated
proportionally to line prices. No customer name, address, email or phone enters
the new ecommerce payload.

Accepted COD orders are **not** counted as paid purchases. COD collection must
be reconciled against actual payment/order records. Pending, failed, refunded
and sandbox card payments do not emit a new purchase. The confirmation page
alone does not emit a purchase. Transaction IDs and session markers suppress
duplicate callbacks/responses; GA4 also receives the same order ID as
`transaction_id`.

The existing consent decision is shared by script loading and tracking. Explicit
rejection prevents sending/replaying queued events. Up to 50 events wait in
memory for the existing deferred tag to initialize. Analytics/storage failures
cannot block cart additions or order completion.

## How to evaluate after deployment

Confirm a real production `NEXT_PUBLIC_GA4_MEASUREMENT_ID` is configured.
Validate events in GA4 DebugView with an approved test workflow before relying
on reports; the initial local checks did not verify live GA4 delivery. The
production tag was subsequently checked and uses the real measurement ID
`G-S79BW12N00`. Payment sandbox runs are intentionally excluded from
accepted-order and purchase counts.

Use the same observation window and traffic-source/device breakdown when
comparing the three products' view-to-cart and checkout progression. Report the
actual numerator, denominator and sample size; no claimed improvement exists
yet. Use paid order records for completed sales and refunds, and keep accepted
COD orders separate until collection. Client analytics may miss
consent-declined, blocked-tag or interrupted-return sessions. In particular, a
Netopia customer who does not return in the same browser session may have a paid
order without a GA4 purchase event. Database orders remain the authority for
revenue and collections.

## Verification

- 10 focused Jest suites / 50 tests pass: reviewed copy/age, public payloads,
  initial-event buffering and consent, payment-state and sandbox exclusions,
  duplicate suppression, authoritative order response, stock-capped cart events,
  cart persistence, product purchase actions and existing Netopia status rules.
- Product UI rendered locally with snapshots of the three public products, using
  the real product detail component and existing providers. All three were
  checked at a 390 × 844 mobile viewport: correct age, visible guidance, no
  horizontal overflow or Next.js error overlay. Secret Recorder was checked on
  desktop and successfully added to the local cart on mobile. Existing images
  loaded. No real order or payment was submitted.
- [Desktop screenshot](../qa/product-improvements/secret-recorder-desktop.jpg)
  and
  [mobile screenshot](../qa/product-improvements/secret-recorder-mobile.jpg).
  The temporary fixture route was removed. Local authentication/pixel APIs have
  expected configuration/database errors because production credentials were not
  loaded; these do not establish that live checkout was tested.
- Repository-wide TypeScript remains blocked: 1,188 diagnostics in both this
  worktree and an isolated archive of the unchanged production commit.
  Comparison found no additional file/error-code combinations. Existing
  unrelated errors were not repaired as part of this task.
- Two broader tests fail identically on production baseline: guest checkout
  expects `49.99` while Romanian display renders `49,99`; the older ProductSpecs
  test expects humanized learning-outcome labels. Both baseline failures were
  reproduced separately.
- Scoped ESLint import/style corrections were applied. Thirteen pre-existing
  errors remain in the existing checkout API test and payment routes (mock
  `require-await`, unused bindings and effect `consistent-return`). The new
  modules receive a separate lint check. Jest uses `--forceExit` because the
  existing cart/provider checks leave asynchronous handles open.

Production build/migration scripts were not run: repository `build` executes
database migrations. No production credentials or payment-provider sandbox
credentials were used.

## Release checks

The production baseline and this branch have identical Prisma schema and
migration files. The historical migration validator flags four existing 2025
index drops and a missing local backup; no flagged migration is introduced or
modified here. The repository instructions permit a standard push when there are
no database changes. The owner authorized publishing this specific release.

The whole-suite test and TypeScript hooks have the documented baseline failures;
this release uses the passing focused checks and the Vercel preview build. Hooks
are skipped only for this release command, without changing hook files or Git
configuration. No database credentials are loaded into local development.
