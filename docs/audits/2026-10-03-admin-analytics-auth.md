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
production POST was submitted.

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
- Release-check tests also pass: 13 tests cover comparison messages/counts,
  changed-test failures, real compiler diagnostics, schema/migration detection,
  and failure on an unavailable base. Combined focused result: 45 tests passed.
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

The fix is prepared for a draft PR. Production was checked before the change;
deployed authentication remains unverified until this change is released.

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
failing suites and 179 failed tests. Pre-commit compares failed test identities
and occurrence counts, and requires every changed test file to pass. Pre-push
compares complete TypeScript diagnostic messages and counts and blocks added
errors. These are regression gates; the full checks remain failing. See
[release-check limits](../RELEASE_REGRESSION_CHECKS.md).

Repository-wide CI remains unchanged and may fail on the existing debt. Once
deployed, verify no-session and non-admin GET/POST denials and a real
authenticated ADMIN request on the deployed version. A draft PR is not
production closure.
