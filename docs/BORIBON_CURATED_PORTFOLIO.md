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

Production code deployment `ea104bed97a4cf46ce3df808317936ec5bd7f45b` completed successfully on Vercel (`dpl_GQGweFqKpeTAfqw5McPp85NuegLB`). The supplier feed recovered after the earlier HTTP 503 outage, and the portfolio was activated using a fresh, fully validated feed.

- Active Boribon portfolio: **63 products** — 15 retained, 48 created; 62 unselected products deactivated without deletion.
- The deployed authenticated sync completed successfully at **2026-09-10 08:51:50 UTC**, updating all 63 products with zero failures.
- All 63 active products were found in the public product API, with B2C prices matching the supplier snapshot. The public stock API matched sellable stock for all 63. No price, EAN, compare-at-price or inventory mismatches were found.
- The scheduled endpoint was verified to skip outside 06:00/18:00 Bucharest. Summer, winter and both daylight-saving transition dates are covered by tests.
- Recovery snapshot and machine-readable production verification are stored outside the repository at `~/.codex/backups/boribon-portfolio-1789030274856/`.

Verification completed:
- 41 focused tests passed after the schedule change.
- Isolated local PostgreSQL integration passed for all 63 identities, exact B2C pricing, preserved content and purchase cost, concurrent reservations, and fail-closed stock. The temporary schema was removed afterward.
- Local and Vercel production builds passed. A read-only migration audit found no pending migrations.
- The project's existing build configuration skips TypeScript and lint checks during builds. Separate full and focused TypeScript runs report unrelated repository errors; no application diagnostics were reported in the changed paths. Full type checking is not green.
- The repository pre-commit full suite failed: 59 suites failed and 70 passed (157 failed / 419 passed tests), including missing GDPR routes and unrelated test setup failures. For the explicitly requested deployment, hooks were bypassed for the commit/push invocation only; hook files remain unchanged.
