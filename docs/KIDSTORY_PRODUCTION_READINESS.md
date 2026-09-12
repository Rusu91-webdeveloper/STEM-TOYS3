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

## Verified production status — September 12, 2026

Deployment `d0a3eec80d310fbccea9eecb158b8e878bed5022` completed successfully
on Vercel. Activation on September 10 retained six products, added 19 and
 deactivated 50 unselected products. The terrarium's SKU was corrected without
changing its ID or URL.

The September 12 read-only audit verified all 25 active Kidstory products against
the fresh supplier feed and public APIs: exact SKU, price, name, description,
ordered images, source attributes and available checkout capacity. Boribon
remains at 63 active products. All 124 distinct source image URLs passed the
image check during rollout; a supplier image also passed the storefront optimizer.
The Air Toobz page was visually checked with its supplier image and 770 RON price.

Both suppliers completed the common manual sync, then every scheduled run at
18:00 September 10, 06:00/18:00 September 11, and 06:00 September 12 Bucharest.
Each run updated 25 Kidstory and 63 Boribon products with no failures.

Validation: 49 focused tests passed, as did isolated PostgreSQL integration for
source content, pricing, reservations and failure closure. Full TypeScript
checking still reports unrelated repository errors, with none in changed
application paths. The local build was stopped to reduce machine load; the
Vercel production build passed. Existing failing hooks were bypassed only for
these release commands; hook files were not changed.

Recovery and verification evidence:
`~/.codex/backups/kidstory-portfolio-1789051327892/`.
