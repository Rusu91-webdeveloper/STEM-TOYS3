# Storefront quality review — 6 October 2026

## Scope and launch gate

The owner requested an improvement from the external C+ review. This branch
addresses its observed storefront issues. It does not certify an A+ grade or
complete the outstanding funded guest COD order. Paid acquisition must remain
gated until that real order and fulfillment path are accepted.

Bootstrapped from fetched main `2a71caee`, which includes PR #66's supplier
stock parsing and per-product sync resilience. The checkout card guarantee is an
intentional owner policy, confirmed in the
[COD release record](2026-10-04-cod-production-release.md). Every eligible COD
order still requires the outbound-shipping authorization; lockers remain
prepaid. No payment policy, shipping threshold, schema, migration, dependency,
secret or ad-account configuration changes are included.

## Findings and changes

- Default browsing now rejects every nonfinite or zero stock quantity before
  editorial low-stock exceptions. A reviewed low-stock product may remain
  visible at one unit, but never at zero. Direct product pages remain available
  for accurate stock information.
- MP-250's current zero is genuine supplier unavailability. Read-only production
  inspection found `MAPPED`, no sync error, last sync
  `2026-10-06T03:00:51.525Z`, supplier `stock_status=0`,
  `stock_status_string=notinstock`, `availabilityFlag=false`, zero stock and
  zero reservations. MP-250BUN was synced at the same time without error and is
  available (`stock_status=1`, `instock`, stock 1). Do not invent stock or
  conceal this finding by manually making the product purchasable.
- Product pictures render without waiting for a hydration-time load callback.
  Removed the opaque loading cover, initial opacity zero, staggered card fade
  and unverified `.webp` filename rewrite. The homepage hero always receives
  priority loading. Native Next image sizing and blur remain.
- All 475 supplier photo URLs observed in the public catalog are mapped to owned
  files: 472 unique optimized WebP photos, approximately 30.59 MB total. The
  original product photographs are preserved. Product pages, browsing, upsells
  and bundle contents use the same public presentation boundary.
- The default cookie banner is smaller, with equally prominent accept/refuse
  controls and separate optional categories in customization. Consent defaults,
  persistence, withdrawal and tracking gates retain their existing behavior.
- The products intro is shorter and the grid starts higher. At the same 1280×577
  desktop viewport, the cookie banner fell from 211 to 93 pixels. At 393×852
  mobile, it fell from 380 to 169 pixels and the first product image starts
  approximately 100 pixels higher. Measured horizontal overflow is zero.
- Product pages and populated physical carts show the configured COD fee before
  checkout: currently **9.90 lei**, from the same admin settings as checkout.
  They also explain the mandatory temporary card authorization, payment on
  receipt and prepaid FANbox. Invalid settings never promise a zero fee. The
  cart purchase buttons use navy.
- Checkout navigation presents three stages: delivery, payment and review.
  Address and courier selection retain their separate validated transitions.
  Previous stages can be edited; future stages cannot be skipped. The courier
  stage shows the selected address and an edit action. Optional company and
  apartment fields are collapsible; saved values remain discoverable. There is
  one Romanian country field and the coupon box is collapsed by default.
- `/cart` explicitly emits `noindex,nofollow`. Root metadata no longer inherits
  an explicit `index` that conflicts with Next's automatic 404 `noindex`.
  Removed the homepage's extra organization/website/store schema block; the root
  schema registry remains authoritative.
- Public category canonicals, sitemap entries, breadcrumbs and navigation use
  Romanian category URLs. Existing English links remain compatible through
  permanent redirects, including pagination. Database category identifiers
  retain their existing contracts.
- The header says `STEM • Joacă • Descoperă`. The age guide title is evergreen.
  Reviewed Romanian spelling and spacing corrections are applied to shopper copy
  and Romanian product SEO fields, preserving HTML attributes, source data,
  official model codes and numeric claims. Observed English attribute values
  have Romanian labels and missing translation keys are not printed. This is a
  bounded cleanup, not a claim that every supplier paragraph has received an
  editorial rewrite.
- Free shipping remains 500 lei pending an owner margin decision. Competitor
  thresholds alone do not justify changing the commercial policy.

## Category compatibility

| Existing link                                    | Canonical link                   |
| ------------------------------------------------ | -------------------------------- |
| `/categories/science`                            | `/categories/stiinta`            |
| `/categories/technology`                         | `/categories/tehnologie`         |
| `/categories/engineering`                        | `/categories/inginerie`          |
| `/categories/mathematics` and `/categories/math` | `/categories/matematica`         |
| `/categories/educational-books`                  | `/categories/carti-educationale` |

## Evidence and validation

Browser checks cover desktop and mobile products, a physical product detail, a
populated guest cart, consent and checkout presentation. Local checks use a
production database connection with PostgreSQL `default_transaction_read_only`
verified on, random local auth secret and no payment/email credentials. No order
was submitted, stock changed, migration run or card authorization attempted. The
dummy local cart and address are isolated from the owner's browser session.

HTTP checks confirm `/cart` 200 with `noindex,nofollow`, a missing route and
missing product 404 with only `noindex`, all six legacy category aliases 308
(including preserved `page=2` on science), and the Romanian science page 200.
The homepage emits exactly one top-level WebSite, Organization and OnlineStore
schema.

The full Jest baseline/candidate comparison reports 64 failed suites and 175
failed tests on both sides, with **zero new failures**. Changed test files pass;
existing repository debt remains visible. Focused storefront tests cover stock
visibility, photo rendering, admin-priced fee disclosure, locked future checkout
stages, Romanian attributes, safe copy handling and category compatibility. The
direct production build
(`NODE_OPTIONS=--max-old-space-size=6144 pnpm exec next build`) passes without
running migrations. The first attempt hit Node's default heap limit and was
rerun with more memory. Missing local email, Redis and third-party credentials
produce expected warnings; those integrations are not claimed as live
acceptance. Scoped ESLint reports zero errors; existing warnings remain. The
TypeScript comparison retains 1196 diagnostics on both sides with zero
additions. Normal commit hooks pass the final source with 64 failed suites and
175 failed tests on both sides, zero regressions. The initial push's migration
and TypeScript hooks also pass. These are regression checks, not clean full
repository checks.

[Draft PR #67](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/67) is
published. Its initial preview (`9f921f6c`, deployment
`dpl_A54fWPGgpThtBomVdVHwWPRmqzrf`) is READY. The PR description records the
final preview for the payment/cart cleanup.

The final local production build and mobile guest browser check pass. The flow
reaches COD selection, displays the 9.90 lei fee and 197.89 lei COD total for a
168 lei product plus 19.99 lei delivery, and shows the mandatory consent and
card guarantee. Payment has one heading and no stale four-step badge. Mobile
horizontal overflow is zero and cart prices remain on one line. No final order
confirmation, payment authorization or card input was attempted. These local
checks cannot accept the payment/email integrations without their credentials.

[Desktop before](assets/2026-10-06-storefront/products-desktop-before.png) ·
[Desktop after](assets/2026-10-06-storefront/products-desktop-after.png) ·
[Mobile before](assets/2026-10-06-storefront/products-mobile-before.png) ·
[Mobile after](assets/2026-10-06-storefront/products-mobile-after.png) ·
[Cart mobile](assets/2026-10-06-storefront/cart-mobile-after.png) ·
[Payment mobile](assets/2026-10-06-storefront/payment-mobile-after.png)

## Photo refresh

Run `pnpm exec tsx scripts/cache-catalog-images.ts` to mirror newly observed
supplier URLs from the complete public catalog. It skips known copies and does
not write to the database. `--refresh` also refreshes existing photographs.
Review and commit the manifest and assets together. The script restricts
supplier hosts, rejects redirects and large images, and fails on incomplete
pagination or photo download errors. New URLs retain their source until this
deliberate refresh is performed; current coverage is a dated catalog
observation.

## Outstanding acceptance

Complete one real guest COD order with sufficient card funds. Verify the
server-priced outbound-shipping authorization, consent-aware tracking, confirmed
order/receipt, stock reservation, dispatch and collected cash. Confirm the
temporary hold is handled according to the owner's policy and its expiry. The
previous owner attempt reached the card form but had insufficient funds. Do not
enable paid traffic or mark this acceptance passed based on UI tests.
