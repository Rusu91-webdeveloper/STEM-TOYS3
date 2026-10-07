# Storefront buying experience — 7 October 2026

The owner requested implementation of the improvements identified in the A+
storefront review, beyond testing. Work starts from clean `origin/main`
`f1b37da1` on `codex/storefront-excellence`. Existing checkout payment policy,
stock gates, supplier rows and configured prices remain authoritative.
Implementation does not certify an A+ or change the production deployment.

## Shopper changes

- All 104 individually reviewed supplier products now receive a structured
  buying summary: contents, preparation, age and safety. This uses the existing
  editorial dataset and its identity/slug gate, rather than inventing product
  facts. The three existing authored activity guides remain intact. Verified PDF
  sources are offered as manufacturer instructions where available.
- Age badges retain explicit assistance/autonomy/adult-participation wording.
  The minimum-age rule still prevents a coarse category from recommending a
  product below its reviewed minimum.
- `/alege-cadoul` recommends up to three currently browseable products by child
  age, interest and product budget. It requires reviewed age guidance, excludes
  hidden add-ons and sets requiring a base set, and never relaxes minimum age or
  budget to fill results. Empty results and data-loading failures are distinct.
  It is linked from the homepage and sitemap. Product recommendations contain
  current prices, preparation requirements and links to the real product pages.
- Product pages show a one-product shipping estimate next to purchase controls,
  using enabled services and existing service override → admin price → tariff
  precedence. FANbox requires online payment; the configured free-shipping
  threshold is displayed. Discounts, address surcharges, parcel count and final
  availability are explicitly confirmed at checkout. Digital products and
  bundles do not receive an invented parcel estimate. COD conditions are kept.
- Romanian search ignores diacritics and matches individual words in any order.
  Desktop sorting uses an accessible native select. Grid/list controls now
  change the view; list descriptions use reviewed summaries rather than showing
  HTML markup. Direct component imports avoid loading the products barrel.
- The image dialog uses the existing Radix dependency for focus containment,
  Escape and scroll locking; arrow keys change images and closing restores
  focus. Gallery, search and review controls have labels and usable touch areas.
  A skip link targets the main content. The order review form uses native radio
  buttons for ratings and connects field errors to their inputs.
- Sign-in copy now describes account functions instead of promises about child
  transformation, guaranteed outcomes or priority support. Default store copy is
  Romanian and default store URLs point to the real domain; saved owner copy is
  not overwritten.

## Genuine demonstrations

The two official video links were verified against the manufacturer's own
product-page embeds and YouTube oEmbed metadata on 7 October:

| Exact model                | Manufacturer source                          | Video                                         |
| -------------------------- | -------------------------------------------- | --------------------------------------------- |
| Gigo #7080 pneumatic glove | <https://www.gigotoys.com/en/products/7080/> | <https://www.youtube.com/watch?v=mS1YsJDfLJI> |
| Gigo #7087 wind power      | <https://www.gigotoys.com/en/products/7087/> | <https://www.youtube.com/watch?v=wlIMHqDIhLM> |

These are explicitly manufacturer demonstrations, opened on request in a new
YouTube tab. There is no automatic third-party embed or weakened CSP. Other
models need authentic owner/manufacturer footage; no synthetic demonstration or
customer testimonial was fabricated.

## Reviews and delivery email

Public review submission now also checks that the submitted product is the
product on the authenticated customer's delivered order item. Public verified
badges require matching product, buyer and delivered status. The product-page
review link routes customers through sign-in to their orders; the former
placeholder form could appear to succeed without persisting a review.

`getReviewInvitation` resolves the actual delivered order, active recipient
account and an unreviewed product from persisted records. The existing delivery
confirmation now uses this exact account review URL, including a preserved
sign-in callback, instead of an order-number URL to the legacy guest review
page. It includes no email address in the review URL. Both manual admin delivery
and courier delivery pass the internal order ID. Inactive/guest accounts,
anonymized customers, unrelated recipients and already reviewed purchases get a
support link. An unavailable review lookup does not prevent the delivery
confirmation itself. Unsupported safety-testing and extended-warranty promises
were removed from this delivery template.

The existing marketing review sender uses the same eligibility helper. Its
post-purchase caller passes the internal order ID and no longer shadows the
workflow-enabled function. This does not activate marketing, create schedules or
send any new messages during verification. Inbox delivery, customer
participation and existing provider acceptance remain external evidence.

## Search discovery and operations

- `/merchant-feed.xml` publishes RSS with the Google namespace from the same
  visible catalog gate as `/products`. It includes canonical product URLs, owned
  images, real RON prices, reviewed descriptions/brands and known shipping
  settings. GTINs are included only when their length and checksum are valid;
  missing identifiers are not fabricated. Product JSON-LD uses the same GTIN
  validator. Catalog failure returns 503 rather than a successful empty feed.
- `/admin/store-health` and its ADMIN-only no-store API show active
  supplier-feed failures/staleness, recent failed-payment orders, failed email
  logs and paid physical orders awaiting dispatch. Independent query failure is
  unavailable, not a healthy zero. Feed freshness allows the deployed daily cron
  plus 25% grace. Only aggregate counts leave this API; provider errors/customer
  details are not exposed. Links point to existing operator screens.
- Backup and restore status explicitly requires provider confirmation. This page
  is an operator dashboard, not an automatically sent alert or a guarantee that
  all incidents are detected.
- Public readiness probes use the shared database client, keep its pool open,
  have a two-second response deadline and omit raw connection errors.
- Performance observers register once across remounts; each analytics
  transmission still checks current consent. GA metric parameters use the
  supported top-level shape. Optional performance URLs and resource labels omit
  query strings/fragments.
- Redis sorted-range requests now use the locked SDK's options object. The
  former string argument silently omitted requested scores. An isolated custom
  transport verified actual SDK commands both with and without scores, without
  connecting to Redis.

## Validation and local isolation

Validation uses a separate `techtots-excellence-preview` Postgres container on
`127.0.0.1:55433`, seeded with the public product snapshot and one synthetic
administrator. Application connections are read-only. No production customer,
supplier, payment or email credentials are used. No payment or email is sent.
Locked dependencies were installed; schema, lockfile and compiler configuration
are unchanged. The build command is `pnpm exec next build`, not the package
wrapper that also deploys migrations.

The local browser verified desktop/mobile gift selections, honest empty
recommendations for age 3/robotics/budget 100, product summaries, COD/delivery
prices, review entry, dialog arrow/Escape/focus behavior, the working catalog
views, diacritic-free search and the authenticated health page. Gift finder and
PDP both fit a 390px viewport without horizontal overflow. HTTP verification
returned 97 unique products in a well-formed merchant feed, anonymous health
403/no-store, and readiness 200/no-store. Synthetic email tests verify actual
CTA output and the support fallback.

The final compiled gift page additionally verified keyboard skip-link focus and
navigation to `main-content`, a 390px empty recommendation state, and the repaired
catalog list/search output. A screenshot is saved locally at
`test-results/storefront-excellence/gift-finder-desktop.png`. The compiled preview
listens only on `127.0.0.1:3041`.

- Production build: `pnpm exec next build` passed, including all 492 generated
  pages and the new routes. Optional external provider credentials are absent in
  this isolated preview; no schema migration was run against production.
- Focused checks: 14 relevant suites / 84 tests passed. The final review display
  and observer cleanup checks passed again after their last edits. The existing
  analytics-cache suite still has four baseline failures; the actual Redis
  request serialization was verified separately with the installed SDK.
- New-code lint: all 16 new implementation modules passed. Existing changed
  modules and the wider repository retain lint debt.
- Full Jest comparison: baseline 64 failed suites / 175 failed tests; current
  63 failed suites / 174 failed tests; zero added regressions.
- TypeScript comparison: baseline 1,188 errors; current 1,172; zero added
  diagnostics, using identical locked dependencies and generated declarations.
- Migration validation reports no schema or migration changes; `git diff
  --check` passes. Normal commit/push hooks enforce the repository comparisons.

The repository already contains substantial full-suite, lint and TypeScript
debt. Passing a comparison is not a clean full check or field performance proof.

## Remaining external work

Register the deployed feed with the owner's verified Merchant Center account and
inspect its diagnostics. Collect authentic footage/customer reviews and verify
receipt/rendering of delivery messages. Confirm production database backup
retention and a separate restore exercise, plus incident-notification ownership.
Measure production Core Web Vitals with real mobile traffic. The existing Stripe
sandbox, inbox, supplier/provider and funded COD acceptance items in `TASKS.md`
remain open. Further legacy test/type cleanup is separate work; no existing
build checks were newly disabled.
