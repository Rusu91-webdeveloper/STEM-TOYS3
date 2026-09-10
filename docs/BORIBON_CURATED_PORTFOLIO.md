# Boribon curated portfolio

The reviewed September 9, 2026 portfolio is tracked in `lib/suppliers/boribon/portfolio.json`: 63 products, retaining 15 existing identities and adding 48. Products outside the selection are deactivated, not deleted. Kidstory is unchanged.

## Invariants

- Match source ID, exact model and EAN together. Boribon reuses some model codes.
- Display `price_b2c` in RON exactly. Clear misleading compare-at prices. Never infer purchase cost from B2C. Existing costs remain separate and new unknown costs are null.
- Use the live Boribon master CSV, never the hosted March catalog snapshot.
- Update stock and prices without overwriting curated content during recurring sync.
- Product stock is sellable quantity. Refresh atomically subtracts existing local reservations; checkout must not subtract those twice.
- Unavailable/invalid supplier data closes stock; stale data older than 14 hours blocks checkout and cart stock checks. Missing products are never silently treated as successfully refreshed.
- Existing reservation lifecycle remains conservative: reservations are not cleared merely because a feed refreshes. Boribon does not provide an order acknowledgement in this CSV, so an exact correspondence between supplier stock and local reservations cannot be inferred. This can understate available stock until reservations are reconciled.
- Feed snapshots are periodic, not a real-time supplier reservation API. Another retailer can buy units between refreshes.

## Cron

The existing authenticated `/api/cron/suppliers` endpoint synchronizes active supplier feeds at 06:00 and 18:00 Europe/Bucharest. Vercel schedules in UTC, so four candidate UTC hours cover winter and summer offsets; `scheduled=1` makes the route skip the two candidates outside the intended local hours. Thus supplier feeds actually run twice daily throughout daylight-saving changes. Authenticated manual calls without `scheduled=1` can force a refresh.

Stock freshness allows 14 hours: the normal 12-hour interval, the 13-hour interval across the autumn clock change, and execution grace. A known failed refresh still closes Boribon stock immediately. Prices and stock can change between the two snapshots; this is not a real-time inventory guarantee. Failed jobs return HTTP 503 and remain visible in SupplierSyncJob. Product caches are invalidated after updates and stock closure.

## Deployment and activation

1. Run targeted tests, type checking, and database safety check.
2. Preview with `pnpm exec tsx scripts/install-boribon-portfolio.ts --production`. This reads current production and the live supplier feed, with no database changes.
3. Deploy the code before switching the feed's mapping to `boribon-curated-v1`.
4. Apply with `pnpm exec tsx scripts/install-boribon-portfolio.ts --production --apply`. The command requires all 63 live identities to validate, writes a restricted recovery snapshot under `~/.codex/backups/`, then applies the catalog and feed configuration in one transaction.
5. Invoke the authenticated supplier cron for Boribon, verify job SUCCESS, active count 63, supplier B2C parity, stock net of reservations, and product API/cache results.

Never use archived CSV stock to activate production. `--fixture FILE` is restricted to local databases for testing. If the live feed is unavailable, activation must wait.

Rollback: use the generated `before.json` snapshot to restore the affected product, supplier-product and feed fields in a transaction; deactivate newly added rows. Preserve any orders/reservations made after activation. Do not replace an entire production database to roll back this catalog change.

## Verification and rollout status — September 10, 2026

Production deployment was requested on September 10. The activation command could not obtain a fresh supplier snapshot: the master feed repeatedly returned HTTP 503, including an independent Python HTTP request. No production catalog changes were applied. Do not activate from the September 9 analysis files.

Verification completed:
- 32 existing and new checkout/feed checks passed; subsequent targeted runs added and passed stale-checkout rejection and cart-stock freshness tests (34 distinct checks total).
- Isolated local PostgreSQL integration passed for all 63 identities, exact B2C pricing, preserved content and purchase cost, concurrent reservations, and fail-closed stock. The temporary schema was removed afterward.
- `next build` passed (the project's existing configuration skips TypeScript and lint checks during builds).
- Separate full and focused TypeScript runs report unrelated repository errors; no application diagnostics were reported in the changed paths. Full type checking is not green.

Resume with a fresh live-feed preview, finish production deployment/activation and verify the actual cron and website. Deployment changes the supplier cron to the twice-daily Bucharest schedule. Catalog activation remains a separate explicit command after a successful live-feed preview.

Schedule-change verification: 41 focused tests passed, including summer/winter UTC offsets and both daylight-saving transition dates. A fresh pre-deployment Boribon database snapshot was saved outside the repository, and a read-only migration audit found no pending migrations.

The repository pre-commit full suite failed: 59 suites failed and 70 passed (157 failed / 419 passed tests), including missing GDPR routes and unrelated test setup failures. The existing full typecheck also fails outside this change. For the explicitly requested deployment, hooks are bypassed for the commit/push invocation only; hook files remain unchanged. Focused tests and the actual Vercel production build are the release validation.
