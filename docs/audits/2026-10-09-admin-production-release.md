# Romanian admin production release — 9 October 2026

## Authorization and source

The owner requested “deploy everything”, authorizing publication of the
completed Romanian owner/admin redesign in
[PR #75](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/75). Fetched
origin, confirmed main was unchanged at `c248cb22`, and reviewed the publication
scope. No user changes were overwritten, merge protections bypassed, or
production credentials retrieved.

The reviewed head is `f9cea13f6cef9d315b1429480d17ae9410059f75`. Its Vercel
preview `dpl_hwt2oFrzbYb8GF3tjTiFNcLRhWHd` reached READY and the PR reported
CLEAN/MERGEABLE with Vercel SUCCESS. The local worktree was missing the Husky
launcher; it was restored from the installed dependency, and the complete
pre-commit checks were run against the committed head before publication. The
normal pre-push checks then passed. No hooks were disabled.

Publication Jest comparison: baseline 63 failing suites / 174 failing tests;
current 62 / 157; zero regressions and no failed changed test files. Publication
TypeScript comparison: baseline 1,173 errors, current 1,169; zero added
diagnostics. Existing debt remains. The unchanged GitHub CI workflow failed
without starting jobs on both this head and the previous main; this release does
not claim a clean repository-wide CI pipeline. The implementation audit records
23 focused suites / 151 passing tests, real isolated-database and authenticated
local HTTP/browser checks, and a successful local production build.

PR #75 was squash-merged with the expected-head constraint at 21:42:26 UTC on 8
October (00:42:26 Europe/Bucharest on 9 October), as
`22ba5e7e9751c71e355e286f0c5bc3ccc6bf3fa2`. The reviewed head and merge commit
share Git tree `ea05f5fef52993ba179296bb25f215cb16a93077`. GitHub's initial
GraphQL merge returned an error; the PR was confirmed still open before
completing the same expected-head squash merge through its REST API.

No schema, migration, dependency or compiler configuration changed. Scoped
migration validation reported no database release changes. Both Vercel builds
reported 16 existing migrations and **no pending migrations to apply**. The
existing main-branch Git integration used the configured production environment;
ignored local environment files and the isolated fixture database were not
uploaded, copied or seeded into production.

## Deployment and live verification

Project: `stem-toys-3` (`prj_ToPwZRPSjvd9qI25Vscf6CeMSrVW`), in team
`team_eCqAADZN7NQMTvnd2J9FniNU`. Framework: Next.js; target: production.
Deployment `dpl_D7oDCUwc5U7hGnCFbgvRpLjwEwQi`, source `22ba5e7e`, is READY. Its
immutable URL is
<https://stem-toys-3-6k86hz63l-rusujobs-3774s-projects.vercel.app>.
Building-to-ready duration was 3 minutes 27 seconds, using Vercel timestamps.
The remote build generated 489 static pages using its configured data sources;
the local fixture build generated 383. The existing manifest-route configuration
warning remains visible in build logs.

Independent lookups for <https://www.techtots.ro> and <https://techtots.ro>
resolved to this exact READY deployment. The apex domain redirects to www with
HTTP 308. Previous READY production rollback candidate:
`dpl_64BduKYt1LN7stkAW8bUBECBnemh`, source `c248cb22`.

All 20 anonymous HTTP assertions per domain passed, completed at 21:46:53 and
21:47:00 UTC respectively. Apex checks followed only the expected canonical
redirect to the same www path.

| Request                                                       | Result                                            |
| ------------------------------------------------------------- | ------------------------------------------------- |
| Homepage, products, cart, checkout, login                     | 200; no local fixture markers                     |
| Admin overview, settings and products                         | 307 to `/auth/login?callbackUrl=/admin`; no-store |
| Health readiness                                              | 200, no-store                                     |
| Combined checkout, shipping, COD and tax configuration        | 200, no-store                                     |
| Admin dashboard, settings, configuration copies and customers | 403, private/no-store                             |
| Admin orders                                                  | 403                                               |
| Admin suppliers                                               | 401                                               |
| Admin store health                                            | 403, no-store                                     |

The public delivery configuration retains 19.99 RON delivery and a 500 RON
free-delivery threshold. Non-VAT configuration remains rate 0, inactive, with
prices including the final amount. These values matched the pre-release reads.
No setting, stock quantity, customer, order, return, payment, email or courier
action was changed as a production test fixture.

The production browser verified the admin-to-login redirect and Romanian login
rendering at desktop and mobile dimensions. Mobile document width is 390px at a
390px viewport. Temporary viewport overrides were reset and a production admin
tab retained for the owner. The browser had no production admin session, so
authenticated production dashboard data and mutations were **not** exercised.
Local authenticated workflow evidence is separate from these live checks.

At approximately 21:47:55 UTC, the deployment-scoped warning/error/fatal query
from 21:42:26 UTC returned no groups; the project runtime-error query returned
no clusters in that window. This is a bounded observation, not continuous
monitoring. Drain inventory returned 404 and remains unverified; no monitoring
configuration was changed.

HTTP results and desktop/mobile sign-in screenshots are retained locally in
ignored `test-results/release-admin-2026-10-09/`. The protected preview was not
made public to perform a browser check.

## Remaining acceptance

The [implementation audit](2026-10-08-admin-dashboard.md) describes Romanian
navigation, source-backed reporting, core management fixes, configuration
history/restore, concurrency handling, checkout freshness and access boundaries.
Publication does not certify live payment/refund execution, inbox rendering,
courier AWBs, advanced legacy forms, all report services or reconciled financial
results. Paid-order gross values do not deduct partial refunds or represent
profit. Configuration copies do not replace complete database backups. Provider
and advanced-form acceptance items in `TASKS.md` remain open.
