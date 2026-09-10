# Kidstory curated portfolio — September 10, 2026

## Source and selection

The reviewed 25 identities are pinned in `lib/suppliers/kidstory/portfolio.json`.
Activation retains six products, creates 19, and deactivates 50 unselected
products without deleting order history. The terrarium retains its existing
product ID and URL; its supplier mapping uses the exact live SKU `4M-03926/EU`.

The user explicitly selected live `base_price` as the displayed RON price,
without the app markup. Missing discounted purchase costs do not block this
retail-price policy. No B2C value is written as purchase cost. Private commercial
terms stay outside Git.

Each sync copies source name, description, ordered images, brand, age text,
short description and supplier category into the product. Product descriptions
render sanitized supplier HTML. Store categories remain a mapping for navigation;
URLs and existing product IDs remain stable. Unknown ages are not invented from
broad supplier age bands. Source raw rows are retained in supplier staging.

## Availability and schedule

The source exposes only `stock_status` 0/1, not quantities. Product.stockQuantity
represents a conservative checkout capacity of one when available, minus existing
reservations. SupplierProduct.stock stays zero because the unit count is unknown;
attributes record availabilityFlag and quantityKnown=false. Low-stock badges are
suppressed for these products. Outstanding reservations are not cleared by sync;
this can keep a product unavailable until fulfillment reconciles them.

Both active feeds run from `/api/cron/suppliers?scheduled=1` at 06:00 and 18:00
Europe/Bucharest using the existing DST-aware schedule. A failed supplier does
not skip the other. Invalid or failed refreshes close availability; checkout and
cart stock checks reject data older than 14 hours. This is periodic availability,
not a real-time supplier reservation guarantee.

## Release and recovery

1. Test with `scripts/verify-kidstory-sync.ts` against a saved feed on an isolated
   local PostgreSQL schema, plus focused feed, checkout and shared cron tests.
2. Preview `pnpm exec tsx scripts/install-kidstory-portfolio.ts --production`.
3. Deploy code before enabling the new feed mapping.
4. Activate with the same command plus `--apply`; it fetches fresh data, requires
   all 25 identities and source content, saves a restricted backup, and applies
   the product/feed updates atomically.
5. Invoke the common authenticated cron without a supplier filter. Verify both
   results and exact public content, price, image and availability parity.

Recovery snapshots are under `~/.codex/backups/kidstory-portfolio-*/before.json`.
Restore affected product/link/feed fields in a transaction, deactivate newly
created products, and preserve subsequent orders and reservations. Never replace
an entire production database to roll back the portfolio. Recheck production
state before any repeat activation.
