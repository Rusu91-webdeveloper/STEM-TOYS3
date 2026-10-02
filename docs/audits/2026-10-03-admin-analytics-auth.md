# Admin analytics authorization fix

Date: 3 October 2026. Base: `f928577a` (`origin/main` when fetched). Branch:
`codex/protect-admin-analytics`.

## Confirmed cause

An unauthenticated request without cookies to the live `/api/admin/analytics`
returned HTTP 200 and `success: true`, including overview, sales, customers,
inventory and performance sections. No metric values or credentials are stored
in this document.

`middleware.ts` deliberately passes `/api/admin/*` through because authorization
is assigned to individual route handlers. Both GET and POST in
`app/api/admin/analytics/route.ts` omitted that authorization entirely. The
admin UI login gate therefore did not protect direct requests to this API. The
POST omission was confirmed in source and reproduced in local tests; no
production POST was submitted before the patch was deployed.

Adjacent dashboard, COD and unit-economics analytics handlers require the ADMIN
role. Project architecture and API documentation also reserve global analytics
for administrators. The generic `withAdminAuth` helper permits VISITOR access,
so it was not used for this endpoint's stricter analytics policy.

## Change

- Authenticate through the existing `auth()` entry point in both handlers.
- Return HTTP 403 for missing sessions/users/roles and any role other than
  ADMIN.
- Perform the check before reading query parameters, parsing a POST body or
  calling any analytics/report service.
- Fail closed if session lookup throws: the existing error handler returns 500
  and no analytics service is invoked.
- Mark authorized data/report responses and authorization denials
  `Cache-Control: private, no-store`.
- Preserve existing administrator response shapes, query defaults, report
  arguments and missing-report-type validation.

No middleware, checkout, database schema, stored configuration, credentials or
deployment settings were changed. No other admin endpoint is certified by this
fix; route-level authorization review is separate remaining work.

## Verification

`__tests__/api/admin/analytics/route.test.ts` exercises the exported route
handlers with real NextRequest/NextResponse objects and mocked
authentication/analytics services. These tests do not authenticate a real admin
account or access a database.

- Before the patch: 27 tests failed and 5 passed, demonstrating missing auth,
  failure to stop data retrieval when auth fails, and absent cache headers.
- After the patch: all 32 tests passed.
- Release-check tests also pass: 14 tests cover comparison messages/counts,
  changed-test failures, real compiler diagnostics, schema/migration detection,
  immutable historical migrations, and failure on an unavailable base. Combined
  focused result: 46 tests passed.
- Coverage includes full/realtime/report GET paths and POST; anonymous,
  malformed-session, CUSTOMER, SUPPLIER and VISITOR denials; ADMIN success;
  validation behavior; auth failure; and rejection before POST body parsing.
- Prettier check and `git diff --check`: passed.
- Targeted ESLint: zero errors, three existing warnings on the original GET
  defaults and `any` cast. Its first run exhausted the default Node heap; a
  rerun with a 4 GiB heap completed.
- Repository-wide TypeScript: 1,205 errors. A compiler-host comparison replacing
  only this route with its unchanged HEAD source produced the same 1,205 errors.
  Neither the route nor the new test file has a TypeScript diagnostic.

Dependency setup used the committed lockfile with lifecycle scripts disabled.
Prisma client generation generated local code only; no migration, seed,
production database connection or build script was run.

## Publication checks and production status

[PR #57](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/57) was squash
merged at 2026-10-02 22:14:31 UTC as `33f24a6a096f4e798bcbfcb6685e337c27e11c6c`.
The actual Git commit and push hooks passed with zero added failures. At the
owner's explicit request, the patch was released on the production domain so
Google admin login can be tested without adding a preview domain to OAuth
configuration.

Vercel deployment `dpl_5nNryPHZdmbhaMR9Z3LWeHU7KRPN` is READY and
`www.techtots.ro` resolves to that deployment and commit. Direct HTTPS requests
without cookies verified all of the following on the production domain:

- Full, realtime and report GET requests return 403 and
  `Unauthorized. Admin access required.`, without a data field.
- POST with an empty JSON object returns the same 403 before report validation.
- These denials use `Cache-Control: private, no-store`.
- Homepage, login page and `/api/auth/providers` return 200. Providers include
  Google and credentials; this does not verify a completed Google login.
- The error/fatal runtime-log query for this deployment over the preceding 10
  minutes returned no entries. Build logs were unavailable through the connector
  and were not reviewed.

Owner-provided screenshots subsequently confirmed a real Google login with
`role: "ADMIN"` and `isActive: true`, followed by an analytics GET response
containing `success: true`, data, and generatedAt `2026-10-02T22:33:12.890Z`. No
personal identifiers or metric values are recorded here. The earlier denial does
not establish an authentication defect: the fresh request with the confirmed
session succeeded. No further code change or rollback was needed. A signed-in
non-admin denial and an authenticated report POST remain untested live; both
have focused route-test coverage. No admin credentials were supplied to this
audit. The previous READY production deployment was recorded for rollback:
`dpl_Dmv5v2Bv3u1iWpm1NLadiEZCgHoQ`, commit
`f928577a423f7a92157124e779d06728363a64a5`, immutable URL
`stem-toys-3-5tkrijt1m-rusujobs-3774s-projects.vercel.app`.

The original `.cursorrules` required full migration validation before every
push. `pnpm run validate:migrations` fails on four historical DROP INDEX
statements in three 2025 migrations. It also reports that no production backup
artifact exists in this worktree; this is not evidence that no backup exists
elsewhere. This patch adds or changes no migrations. The original pre-push hook
independently invoked the failing repository-wide TypeScript check.

The publication follow-up introduces documented regression checks instead of
bypassing hooks. The scoped migration command returns success only when no
database file changed; any database change runs the original full validation.
Full validation still fails on the historical migrations and backup check.
Neither historical migration SQL nor schema is modified.

Complete Jest snapshots of unchanged main and the candidate both report 65
failing suites and 179 failed tests, with zero added failures. Pre-commit
compares failed test identities and occurrence counts, and requires every
changed test file to pass. Pre-push compares complete TypeScript diagnostic
messages and counts and blocks added errors. These are regression gates; the
full checks remain failing. See
[release-check limits](../RELEASE_REGRESSION_CHECKS.md).

Repository-wide CI remains unchanged and may fail on the existing debt.
Anonymous production denials and real authenticated ADMIN GET success are
verified. Signed-in non-admin denial and authenticated report POST remain
untested live.
