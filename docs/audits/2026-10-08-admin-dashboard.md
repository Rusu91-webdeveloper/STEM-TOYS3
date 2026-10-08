# Owner/admin dashboard redesign — 8 October 2026

Status: implemented on `codex/admin-owner-dashboard`, based on clean `c248cb22`,
and published on 9 October 2026 in
[PR #75](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/75). The
[production release record](2026-10-09-admin-production-release.md) records the
deployment and live verification. The implementation stages below used local
fixtures; no production database mutation or external message was performed for
verification. The owner requested a simpler dashboard with real business data
and selected Romanian for the redesigned interface.

## Findings and changes

The previous overview combined business figures with a large set of tools,
technical status blocks and duplicated navigation. Its data path could replace
failed requests with zero values. Product rankings could fall back to recently
created products instead of products actually sold. The sales report refreshed
through an endpoint with an incompatible shape.

- Nine primary sections now cover overview, orders, products, customers,
  returns, suppliers, customer assistance, reports and settings.
  Catalog/content, operations, marketing and financial tools remain in
  collapsible groups. Longest-route matching ensures a single active navigation
  item.
- The Romanian overview prioritizes four business measures, work requiring
  attention, supplier status, daily paid-order value, recent orders and actual
  physical-product rankings. Tasks precede charts/tables on narrow screens.
  Storefront headers, promotional features and cookie dialogs no longer clutter
  authenticated admin pages.
- Business and supplier-operation data load independently. Failures are
  explicit; retained data is labelled after a failed refresh. Changing the
  period hides the old period's figures. Aborted, late responses cannot
  overwrite newer data.
- The sales report uses the same validated data source and period controls as
  the overview. Daily values have an accessible table.
- Predictive analytics, competitor analysis and the old behaviour dashboard have
  been withdrawn from navigation and replaced with an explanatory notice at
  their existing URLs. Their backing services include simulated values (for
  example `app/api/admin/analytics/advanced/route.ts` uses random conversion,
  retention, confidence and margin figures; the old dashboard route labels
  traffic/performance estimates as simulated). Underlying legacy endpoints have
  **not** been comprehensively retired or audited in this change.
- The reports hub links to useful business workflows and identifies cost/margin
  output as estimates dependent on recorded costs.
- Customer pagination uses the total matching record count. Spending and global
  spending sorting now use paid, non-cancelled RON orders, including guest
  checkout records. Database selection limits the fields returned. Record links
  preserve original IDs. Inactive bulk-email/export buttons were removed; failed
  customer loads no longer claim an empty customer list.
- Order notifications are in Romanian, retain original currencies, translate
  operational actions and report failed loads/refreshes.
- Mobile navigation supports Escape, focus return and Tab/Shift+Tab cycling.
  Background header/content are inert while it is open; resizing to desktop
  closes the drawer and releases scroll locking. One main landmark remains.

At the initial overview stage, configuration remained accessible through Setări.
Source inspection confirmed the existing ADMIN-only settings API persists
`StoreSettings` and invalidates the checkout/email settings cache; shipping, tax
and COD have dedicated consumers. No settings PUT was used as a verification
step, and this does not certify all advanced metadata/security/backup options.

## Definitions shown in the interface

| Measure                   | Source and interpretation                                                                                                                                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Paid-order value          | Sum of `Order.total` for PAID/COMPLETED payment status, non-CANCELLED orders, RON currency, selected order-placement dates. Includes shipping and tax; fully refunded payments are excluded.                                |
| Placed orders             | All orders created in the selected period, including cancelled orders; cancellation count is displayed separately.                                                                                                          |
| Customers with orders     | Distinct buyer IDs with a non-cancelled order in the selected period, including guest checkout users. This is neither registered-account count nor paid-only buyers.                                                        |
| Active products/suppliers | Current records with `isActive = true`, independent of date filter. Product publication/availability can impose additional storefront gates.                                                                                |
| Stock requiring attention | Active products whose stock quantity is at or below reserved quantity.                                                                                                                                                      |
| Open returns              | Current PENDING, APPROVED or RECEIVED return requests.                                                                                                                                                                      |
| Pending payments          | Current non-cancelled orders with PENDING/PROCESSING payments, including outstanding cash on delivery.                                                                                                                      |
| Supplier tasks/health     | Existing authenticated operations-overview source and workflow classifications, loaded independently. Counts refer to supplier positions where noted.                                                                       |
| Top physical products     | Sum of actual order-item quantities in paid, non-cancelled RON orders in the selected period. Gross item value uses historical item price × quantity, before order-level discounts and returns. Digital items are excluded. |

Periods use calendar dates in `Europe/Bucharest`, including the incomplete
current day; comparison uses the preceding calendar period of equal length. DST
boundaries are covered. A positive current value with a zero previous base shows
“Fără bază de comparație”; it does not invent a percentage increase. Recent
orders always show the latest records across all dates and preserve payment
state separately from delivery state and original currency.

Paid-order value and customer spending do **not** deduct partial refunds and do
not represent accounting profit or reconciled bank receipts. These
qualifications are visible in the overview. No currency conversion or fabricated
exchange rate is introduced.

## Verification

A new, isolated local PostgreSQL database at
`localhost:55434/stemtoys_admin_dev` was used. The repository database safety
check passed before initialization. Test fixtures include paid/unpaid,
cancelled, fully refunded, foreign-currency and digital orders; guest and
registered buyers; reserved stock; a return and a supplier position. No
production records were used.

`pnpm exec tsx scripts/verify-admin-dashboard-local.ts` seeds only an empty
isolated database and fails before overwriting existing orders. `--verify-only`
repeats read-only assertions on that fixture. It also validates customer
pagination and global spending order. The script is restricted to the exact
local host, port and database above.

Verified database expectations: 420 RON from three eligible orders; seven
current orders, one cancelled; two distinct buyers; 30 RON in the preceding
period; one pending payment, one open return and one product with no unreserved
stock. An older sold robot outranks the newer unsold product, with two units /
240 RON. Daily totals sum to 420 RON. Guest lifetime paid RON spending is 330
and the other customer's is 120; one-record pages retain the global order and
total of two.

- Eight focused Jest suites / 48 tests pass: metric dates/comparisons, API role
  and period boundaries, no invented values on errors, real record links/status,
  independent operations failure, period changes, out-of-order responses, stale
  data, navigation, customer spending/pagination, customer error states, removal
  of inactive actions, notification errors/currency and admin/storefront layout
  boundaries.
- Authenticated browser checks pass for the local overview, seven-day sales
  report, original notification currency, desktop/mobile layout, keyboard drawer
  controls, customer totals/actions, report notices/hub and recovery from an
  isolated database outage. Anonymous dashboard HTTP access returns 403. During
  an outage, authentication can fail verification and subsequently clear the
  existing session, redirecting to login. Data does not turn into zero sales;
  recovery may require signing in again. Stale-refresh retention is additionally
  covered by component tests without that session loss.
- Full Jest comparison against `c248cb22`: baseline and current each have 63
  failing suites / 174 failing tests; **zero added regressions**. The complete
  suite is not clean. TypeScript comparison: **zero added errors** (1171
  baseline and current). Both comparisons were repeated after the final code
  changes.
- Focused lint has no errors in the new dashboard/data code and tests. Existing
  warnings remain; the legacy customer page retains its pre-existing native
  `confirm` lint error. Initial wide lint hit the default Node heap limit; retry
  with a 4 GB heap completed.

Screenshots use **local verification fixtures**, not the owner's live sales:

- [Desktop overview](assets/2026-10-08-admin-dashboard/desktop.jpg)
- [Mobile overview](assets/2026-10-08-admin-dashboard/mobile.jpg)
- [Unavailable-data state](assets/2026-10-08-admin-dashboard/unavailable.jpg)

## Remaining scope

Production-authenticated data and bank/provider reconciliation are not verified.
Existing inner management pages and forms remain available; this change does not
certify that every advanced setting has an active consumer or translate every
legacy page. Cost/margin reports still need complete source costs and a separate
calculation review. Legacy analytical endpoints and other report pages need a
follow-up source audit before their figures can be considered decision-ready.
Partial-refund deduction and digital-product ranking would require explicit,
consistent reporting definitions. No profit claim should be derived from the new
paid-order gross-value metric.

## Readiness follow-up — 8 October 2026

The owner's follow-up asked whether every feature works seamlessly and whether
the admin meets a premium standard. Verdict: the revised overview has verified
local behaviour, but the complete admin is not ready for that claim.

Read-only checks found these concrete gaps in the existing settings page:

- **Missing backup service:** the interface fetches and posts to
  `/api/admin/settings/backups` and restores through a nested route. No such
  route handlers exist; a local GET returned HTTP 404. The authenticated browser
  displayed Create/Restore Backup actions and “Last Backup: Never”, while its
  console reported failed backup fetching. Failure is currently presented as an
  empty backup list.
- **Fabricated activity/status:** “Recent Changes” contains hard-coded changes,
  including “Two-factor authentication enabled” and relative timestamps. Store
  Status always says Active/SUCCESS. These are not an audit trail or measured
  service health.
- **Old values sent on save:** Business Hours, Order Processing, Inventory and
  Marketing children keep their edits in local state. Their parent callbacks
  call `setSettings` with those edits and immediately invoke `handleSave`, which
  reads the previous render's `settings`. Source inspection confirms the request
  is constructed before React applies the update. No settings PUT was submitted
  during this review; persistence/reload must be verified after repairing the
  callbacks.
- **Security configuration disconnected:** the two-factor and session-timeout
  controls purport to persist `securitySettings`; repository searches found
  those options only in settings editors. `lib/server/auth.ts` instead sets a
  fixed 30-day JWT lifetime and does not consume either control. A saved toggle
  does not establish MFA enforcement or the selected timeout.
- **Incomplete Romanian interface:** the main overview/navigation use Romanian,
  but the settings and returns pages still expose English headings, tabs and
  actions. The returns page did load the expected local pending return.

Order-processing and marketing have actual consumers of metadata settings;
inventory also has metadata-reading helpers. Their presence alone does not
verify every automation, delivery or external integration. No blanket claim that
all advanced settings are unused is warranted.

This follow-up changed documentation only. The previously recorded 48 focused
tests and database/browser checks apply to the implemented overview scope, not
the entire admin. Live payment/refund execution, supplier integration,
backup/restore and production permissions have not been certified by this
review. Prioritize truthful settings, correct saves and operational verification
before further visual redesign.

Settings GET can initialize defaults when no settings record exists; this
inspection used the isolated local database. Browser navigation commands timed
out for returns and the return to overview, although subsequent DOM snapshots
confirmed both pages loaded. Production performance was not measured.

## Premium implementation follow-through — 8 October 2026

The owner authorized local implementation after the readiness review. The
historical findings above describe the earlier revision; the repairs below
supersede its missing-service and incorrect-save findings. No schema,
dependency, production environment or deployment was changed. Local fixture
settings, return notes and stock were changed for verification and restored
afterward.

### Configuration and access

The former oversized settings editor is replaced with six Romanian sections:
Magazin, Livrare, Ramburs, TVA, Acces și integrări, and Copii și istoric. Each
save submits the current section's edited values directly. Validation, a visible
server result, section-switch/full-page unload protection, timestamps, retained
failed drafts and optimistic version checks replace ambiguous saves. Concurrent
changes produce a conflict rather than silently overwriting another
administrator's edit.

Settings snapshots and history now have real authenticated route handlers and
serializable database transactions. Each change saves the previous editable
configuration; manual snapshots and confirmed restoration are supported. History
records the actor, time and section. Retention is bounded to 100 history entries
and 30 configuration snapshots. These are **configuration copies, not a complete
database backup**; products, orders, customer records and integration
credentials are outside their scope. The API exposes snapshot metadata without
snapshot values or secrets. An ignore-rule exception ensures the `backups` API
source files are tracked while database backup directories remain ignored.

The security review also found that `StoreSettings` has no `securitySettings`
column: the old editor's purported MFA/session changes were neither established
authentication behaviour nor a valid persisted security column. Those controls
and fabricated service/activity badges are withdrawn. The screen describes the
existing 30-day session limit and shows only whether Stripe, SMTP and courier
credentials are present; it does not claim provider health or transaction
success. Duplicate configuration and payment-rollout pages redirect to the
canonical settings console. The old rollout POST returned apparent success
without persisting its changes; it now reports that configuration is
unavailable.

An ADMIN server boundary now protects admin rendering before private page data
is returned. The client boundary remains in place for session changes. Touched
settings, SEO and rollout endpoints deny non-admin access, use explicit errors
and private/no-store responses, and reject foreign origins for supported writes.
SEO and Google Search Console reports with simulated backing data are withdrawn
from the menu and explain their unavailable source. Their manual collection
endpoints cannot store fabricated samples through these admin controls. Other
legacy analytical services and scheduled collection remain separate audit scope.

Checkout shipping, COD and VAT consumers read the current persisted revision;
public configuration endpoints no longer serve five-minute cached settings.
Pricing reads fail closed if the database is unavailable. VAT registration can
be saved with the tax settings and is consumed by pricing; tax cannot be
activated without registration. Existing environment registration is retained as
the fallback for old records. Invalid stored editable configuration is
identified by a warning rather than represented as verified persisted values.

### Core management

Orders retain their original currencies in the list, detail and real CSV page
export. RON page summaries explicitly describe their scope. Exports quote data
and neutralize spreadsheet formulas. Search and filters restart at page one;
opening customer history resets prior filters and includes all dates. Repeated
badges are reduced and the mobile detail header wraps without horizontal page
overflow. Refused COD deliveries use a Romanian confirmation dialog with a
required reason, retained failed drafts and disabled controls during submission.
The existing request explicitly keeps guarantee capture disabled. Customer
detail spending now uses the same paid, non-cancelled RON definition as the
list, instead of adding unpaid and mixed-currency orders. Failure and
missing-record states are distinct.

Returns use a server-side search across all matching records, including order
and current catalog item names. Invalid pagination, enum and date parameters are
rejected. Unsupported segmentation/analytics controls are withdrawn. Operational
labels and dates use Romanian; return amounts retain the order currency.
Provider actions are preserved but are not executed as part of this
verification.

Supplier lists use real server pagination, global status counts and server
search. The fabricated grade column is removed. Missing performance records are
shown as missing data. Historical name/email/phone fields remain searchable and
supply contact values when the newer contact fields are empty. CSV exports use
the same recorded delivered-order cost definition as the list. Action controls
have accessible Romanian names. Select-all now includes only pending suppliers
on the current page. Status submissions disable conflicting actions/filters and
retain records after failures. The legacy supplier suite preserves its 18
workflow checks with Romanian selectors and actual server filtering; two new
checks cover selection scope and submission guards.

The catalog previously counted PUBLISHED products without rendering a matching
status group. It now displays every stored product status, including published
and inactive records. Filters use actual Prisma status values: the former DRAFT
and PENDING_APPROVAL filter choices were invalid for this schema. Order-item
record counts are labelled “poziții în comenzi”, not sales. Existing published
products no longer present redundant approval/rejection buttons. Pending-product
reviews report save failures inside their dialog and retain the rejection draft.

### Verification of the final implementation

- The isolated PostgreSQL settings script verified save/read/restore, stale
  revisions, simultaneous writes, preservation of unrelated metadata/payment
  settings, recorded history and configuration copies. Core values were
  restored.
- The authenticated local HTTP workflow script passed role denials, server
  rendering redirects, settings/history, order currencies/details, paid customer
  totals/history filtering, legacy supplier search/contact and export, global
  return search/note persistence, stock save/read/restoration, fresh checkout
  settings and explicit failure of retired fake saves.
- The read-only fixture dashboard verification passed again: 420 RON / three
  eligible orders, correct guest spending, prior period, actual product rankings
  and attention counts were preserved.
- Browser verification confirmed settings save, reload, unsaved-change discard,
  history and restore; order/customer navigation; original EUR order detail;
  full customer-history filtering; return search; supplier data; and actual
  published products. The final resumed review on 9 October confirmed supplier
  pending-only selection and actual status filtering (zero approved, one total),
  three published catalog records without redundant approval controls, and the
  overview's fixture totals after the calendar date changed. Mobile catalog,
  settings and order detail have 390px document width at a 390px viewport.
  Escape closes the drawer and returns focus after the background header becomes
  interactive.
- The in-app browser's CSV download-event wait did not return a saved file;
  export data/format and order export invocation have automated coverage, and
  supplier CSV was additionally verified through authenticated HTTP.
- All 23 focused suites / 151 tests pass, including settings revision conflicts,
  retained failed drafts, role boundaries, checkout consistency, customer/order
  filtering, catalog visibility and approval feedback, and COD refusal dialog
  validation. The three selector-test suites passed again after their TypeScript
  selectors were corrected (7 tests). The final combined run includes the
  restored legacy supplier coverage and new selection/submission guards.
- ESLint on the 114 changed/new TypeScript paths completes with zero errors and
  326 warnings after correcting two import-order errors in the new supplier
  test. Utility scripts remain ignored by the repository configuration. All 60
  new code files respect the repository limit of 300 lines.
- The final full TypeScript comparison against `c248cb22` passes: 1,175 baseline
  errors, 1,169 current errors and zero added diagnostics. Existing type debt
  remains; this is not a clean full typecheck.
- Final full Jest comparison passes: 63 failing suites / 174 failing tests in
  the baseline, 62 / 157 currently, and zero regressions. Every changed test
  file passes. Existing failures remain; this is not a clean full test suite.
- Direct `pnpm exec next build` passes, including all 383 generated static
  pages. This avoids the package build command's migration step. Build workers
  were limited through `CIRCLE_NODE_TOTAL=2` and the Node heap to 4 GB for the
  local 8 GB machine. The repository build configuration skips type validation
  and lint; those checks were performed separately as recorded above. Missing
  local email, Redis and Google Search Console credentials and the existing
  Browserslist/workspace-root warnings remain visible. The completed `.next`
  artifact is retained in `/tmp/admin-premium-next-production-20261008-1724`;
  development preview files are regenerated independently.

Local cold compilation and running multiple heavy checks exhausted development
memory, producing navigation timeouts and a development-server restart. Heavy
checks were then serialized and the preview recovered. These observations do not
measure production response times. A temporary translation mistake in a catalog
variable was caught by the new catalog test and browser error boundary,
corrected, and the recovered product list verified.

Updated screenshots use local fixtures:

- [Premium desktop overview](assets/2026-10-08-admin-dashboard/premium-desktop.png)
- [Desktop settings after verified restore](assets/2026-10-08-admin-dashboard/settings-premium-desktop.png)
- [Compact mobile settings](assets/2026-10-08-admin-dashboard/settings-premium-mobile.png)
- [Mobile order detail](assets/2026-10-08-admin-dashboard/order-premium-mobile.png)
- [Published products on mobile](assets/2026-10-08-admin-dashboard/products-premium-mobile.png)
- [Supplier filtering and stored contacts](assets/2026-10-08-admin-dashboard/suppliers-premium.png)

Local implementation and final review completed on 9 October 2026. The
authenticated preview is left at `/admin`; temporary viewport overrides are
cleared.

Production publication is now verified separately in the release record. Live
provider acceptance, real refunds, inbox receipt/rendering and courier AWB
creation remain unverified by this change. No customer email, payment or refund
was sent for testing. Gross paid-order value still does not deduct partial
refunds or represent accounting profit. Legacy metadata consumers remain intact;
their old general-purpose editors are withdrawn from the canonical settings
surface. Advanced marketing/import/supplier forms and other legacy reports are
not comprehensively certified or translated by this work.
