# Admin order status HTTP 403 — 15 October 2026

The orders list and order details page submitted `PATCH /api/admin/orders/[id]`
with JSON but no `X-CSRF-Token`. The handler requires both an ADMIN session and
a valid session-bound CSRF token before reading an order. Consequently the
request failed with HTTP 403 and `Security validation failed`, and the screens
displayed a generic status-update error. This differs from the historical
[cache issue](ADMIN_ORDER_STATUS_CACHE_FIX.md), where the update succeeded but
the list remained stale.

Both screens now use `lib/admin/order-status-client.ts`. It requests an uncached
token immediately before each submission, includes cookies and the token in the
PATCH, and stops without a mutation if token retrieval fails. Fetching on submit
also handles a page left open past the token's one-hour lifetime. An explicit
retry fetches a new token; no mutation is automatically retried. Existing order
IDs, cancellation reasons, list refresh and database/email/payment behaviour are
preserved. Security/session failures give a Romanian recovery message and retain
the draft.

The server's ADMIN and CSRF validation are unchanged. There is no schema change
or production data operation.

## Verification

Focused checks:

```sh
pnpm exec jest --runInBand --runTestsByPath \
  __tests__/app/admin/order-status-updates.test.tsx \
  __tests__/api/admin/order-status-csrf.test.ts \
  __tests__/app/admin/orders.test.tsx \
  __tests__/api/csrf-token.test.ts
```

All 25 checks pass. Before the fix, all six new component workflow checks
failed; the nine new API boundary checks passed, isolating the missing client
token. Component tests exercise both screens, cancellation reasons, original
database IDs, failed token reads, retained drafts, retries and list refresh. API
tests use the actual token endpoint, signing and validation with mocked
authentication, persistence and notification services. Missing, expired, forged
and cross-session tokens, anonymous requests and non-ADMIN roles remain denied
before accessing orders. Valid cancellation preserves existing notes and
notification arguments.

`scripts/verify-order-status-local.ts` exercises a real Next.js server,
credentials session, browser forms and isolated PostgreSQL records. It is
restricted to `localhost:55435/stemtoys_order_status_dev` and
`http://localhost:3015`. Run `--seed-only` against an empty order database, then
run without that flag against the local server. Synthetic customers have no
email address and orders have no payment authorization, preventing provider
effects. It checks the missing-token 403, failed token retrieval followed by
retry, both cancellation forms, stored reasons and reload persistence.

The real local browser run passed: ADMIN credentials login; the original
missing-token 403; token-fetch failure with the draft retained; successful
explicit retry; cancellation from both screens; notes and status stored in
PostgreSQL and retained after reload; and mobile list rendering. No browser page
errors occurred. Desktop and mobile screenshots are retained under ignored
`test-results/order-status/`. No real email or payment was sent. The temporary
database and development server were stopped after verification. Development
logs include existing cache-invalidation errors with Redis disabled; both
updates nevertheless returned 200 and persisted correctly.

Prettier and targeted application/test ESLint passed with no errors; existing
warnings on the two pages remain. `node scripts/typecheck-regressions.js HEAD`
compared against the starting commit `f808b5b3`: baseline 1,144 errors,
candidate 1,144, added zero. This is a passing regression comparison, not a
clean full typecheck. These results describe local verification. The owner
authorized production publication on 15 October 2026. The release was prepared
on the latest `origin/main` (`a838da22`), retaining its Next.js 15.5.27 and
React 19.1.9 security updates. Publication checks, deployment IDs and live
verification evidence belong on this change's GitHub pull request. Production
order mutations are not used as release fixtures.
