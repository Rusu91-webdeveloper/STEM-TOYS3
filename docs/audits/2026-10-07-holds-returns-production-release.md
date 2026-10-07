# Holds, supplier returns and privacy production release — 7 October 2026

## Authorization and source

The owner explicitly requested “push everything to production” and asked whether
the app can select the company or supplier destination. This authorized release
of the completed changes in
[PR #71](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/71).
Fetched origin, confirmed the existing source changes were fully published, and
verified the exact-head Vercel preview and clean PR mergeability. No local user
changes were overwritten and no merge protections were bypassed.

The reviewed head was `88f222cc7a9e7106253b026e4c6cf8ff73ece7a1`. The PR was
marked ready and squash-merged with that head constraint at 11:33:28 UTC
(14:33:28 Europe/Bucharest), as
`7c9cce078456188d16e623f15facbac93b061916`. Reviewed head and merge commit have
the identical Git tree `e9da0f9781c27b3ee908f700e9c5f9fb7f5f684f`.

No schema, migrations, dependencies or compiler configuration changed. The
standard main-branch Git integration built using the existing production
configuration. No production environment setting, database record, payment,
customer return, supplier message or manual retention cleanup was changed as a
release fixture.

## Deployment result

- Live URL: <https://www.techtots.ro>; apex <https://techtots.ro> redirects to www.
- Target: production; framework: Next.js; state: READY.
- Deployment: `dpl_Dc285ovdqKWwh58mjAGcbDV4vttB`.
- Source: `7c9cce078456188d16e623f15facbac93b061916`.
- Immutable deployment:
  <https://stem-toys-3-ihlhzvcqo-rusujobs-3774s-projects.vercel.app>.
- Both domain lookups independently resolve to that READY deployment and SHA.
- Build duration: about 3 minutes 25 seconds, from Vercel building/ready timestamps.
- Previous production rollback candidate:
  `dpl_FApXbihznnj9TwFs1ecpUoZbKLvZ`, source
  `baa18e299cbfb065f3b0d92bfab6c77603d3f99b`.

## Destination behavior for an operator

The app selects and validates a destination from recorded contract evidence.
It does not automatically obtain supplier permission or establish active
contract execution. Before approving a pending physical return:

1. Open the item in `/admin/returns`. Record actual supplier acceptance, ARP/RMA
   and the agreed arrival deadline where applicable.
2. In “Destinația returului”, choose the supplier and confirm the current
   warehouse, written approval, product condition and contract date checks.
   Save the review before approving the return. The server records the reviewer,
   evidence and destination snapshot; customers do not see internal proof.
3. If supplier evidence is missing, inconsistent or expired, use company intake
   at Mehedinți 54–56, Bl D5, sc 2, Cluj-Napoca, Cluj, România. Missing supplier
   reimbursement does not automatically remove the customer's remedy.

KidStory requires valid ARP and receipt within ten calendar days after its issue,
plus the reason-specific condition/claim checks. Its receiving warehouse must
be confirmed for that case. Boribon ordinary returns require sealed/unused
condition and physical receipt within eighteen days after delivery; confirmed
warranty remedies use their separately agreed deadline. Full requirements are
in the [contract decision table](2026-10-07-supplier-return-destinations.md).

Account instructions, SMTP emails and identification PDFs use the selected
destination. Mixed approvals name one PDF per physical item and its destination.
Digital requests require entitlement review and have no parcel or shipping PDF.
Identification PDFs are not prepaid courier AWBs. The daily operating
[returns procedure](../SOP_DAILY_OPERATIONS.md) now documents these steps.

## Live verification

From 11:38 through 11:40:36 UTC, anonymous checks passed on both domains:

| Request | Result |
| --- | --- |
| GET homepage, products, cart, checkout, terms, returns and shipping | 200 |
| GET `/api/returns/admin` | 403 |
| GET `/api/returns/user` | 401 |
| GET `/api/cron/daily-maintenance` | 401 |
| PATCH `/api/returns/acceptance-no-record/destination` | 403 |
| PATCH `/api/returns/acceptance-no-record/status` with REFUNDED | 403 |
| POST `/api/returns/bulk-approve` | 403 |

The unauthenticated mutation requests use a nonexistent identifier and are
denied before body processing or return lookup. No approval, refund, email or
maintenance execution occurs. Apex redirects preserve the method and produce
the same access-control results on www.

An isolated headless Chromium browser verified returns, terms, shipping,
products, the empty cart and login at 1440×1000 and 390×844. All pages returned
200, rendered their main content and fit the viewport without horizontal
overflow. Both contexts captured zero page errors. A verification helper's
initial strict locator matched nested main elements on shipping; the helper was
corrected and browser checks completed. The interrupted attempt is not counted
as a pass. The QA browser was closed; no customer credentials or order details
were submitted.

At 11:41:35 UTC, Vercel's deployment-scoped warning/error/fatal query from
11:33:28 UTC returned no groups, and its project runtime error query returned no
error clusters in the same window. This is a bounded post-release observation.
Vercel runtime logs remain available; the optional drain inventory query returned
404, so external-drain configuration is unverified. No monitoring configuration
was changed. Sanitized status checks and viewport screenshots are retained in
ignored `test-results/release-holds-returns-2026-10-07/`.

## Validation and remaining acceptance

The exact reviewed implementation passed 73 focused return/email tests, the
earlier 194 operations tests and 14 maintenance-log tests. Real disposable local
database/API/browser acceptance covered authenticated admin/customer separation,
CSRF, supplier review, mixed/digital instructions, expired evidence fallback,
manual partial/full repayment and account erasure. Normal source publication
hooks added zero Jest failures and zero TypeScript diagnostics: existing Jest
debt is 64 failing suites / 175 failing tests; the source TypeScript comparison
was 1,179 baseline / 1,175 current diagnostics. These are regression comparisons,
not clean global checks. This documentation follow-up also uses normal Git hooks.

Production publication does not close the following operational acceptance:

- Actual partial/full Stripe sandbox refunds and authenticated deployed admin
  review/retry evidence. No live payment is used as a substitute fixture.
- Owner confirmation of the three redesigned emails in the authorized inbox.
  SMTP accepted them; original mixed-email receipt with three PDFs was confirmed.
- Observation of the new scheduled maintenance summary and completion/reconciliation
  of the previously recorded 5,593 overdue performance records.
- Applicable accepted provider agreements, active supplier execution, current
  per-case warehouse approval and external mailbox/provider cleanup procedures.

See the [operations audit](2026-10-07-holds-refunds-privacy.md) and
[supplier/email audit](2026-10-07-supplier-return-destinations.md). No A+ grade or
complete legal/operational acceptance is claimed.
