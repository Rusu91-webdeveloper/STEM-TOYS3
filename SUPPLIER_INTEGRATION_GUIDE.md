# Supplier Integration Guide (Dec 2025)

## What the new plumbing does
- `SupplierFeed`: stores how to reach a supplier (feed/API/app), auth info, mapping, status.
- `SupplierProduct`: raw products ingested from suppliers (SKU, price, stock, images, attributes), staged before mapping to your live `Product`.
- `SupplierSyncJob`: each sync run with counts/status/error for observability.
- Enums: feed type (CSV/XML/API/APP), auth type (NONE/API_KEY/BEARER/BASIC), sync status (IDLE/PENDING/RUNNING/SUCCESS/FAILED/SKIPPED), job type (PRODUCTS/INVENTORY/ORDERS), product status (PENDING/MAPPED/SYNCED/ERROR/DISABLED).

## How to add a supplier feed (prod)
Use your prod SQL console; replace placeholders:
```sql
INSERT INTO "SupplierFeed" (
  id, "supplierId", name, type, "sourceUrl", "authType",
  "apiKey", "authHeader", username, password, headers, mapping,
  "pollingIntervalMinutes", "isActive"
) VALUES (
  gen_random_uuid(),                       -- id
  '<SUPPLIER_ID>',                         -- must exist
  'BaseLinker CSV',                        -- name
  'CSV',                                   -- CSV | XML | API | APP
  'https://example.com/feed.csv',          -- sourceUrl
  'API_KEY',                               -- NONE | API_KEY | BEARER | BASIC
  'your-api-key-here',                     -- apiKey/token
  'X-API-Key',                             -- authHeader (opt)
  NULL,                                    -- username (BASIC)
  NULL,                                    -- password (BASIC)
  '{}'::jsonb,                             -- headers (extra per-feed)
  '{"sku":"SKU","name":"Title","price":"Price","stock":"Stock","images":"Images"}'::jsonb, -- mapping
  60,                                      -- pollingIntervalMinutes
  true                                     -- isActive
);
```

## Trigger a sync (prod)
1) Ensure `CRON_SECRET` is set in prod (can reuse your existing token).  
2) Call:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://www.techtots.ro/api/cron/suppliers
```
Optional filters: `?feedId=<id>` or `?supplierId=<id>`.

## What happens during sync
- Picks each active `SupplierFeed`, chooses adapter by type (CSV/XML/API/APP).
- Applies auth headers (API key/Bearer/Basic) as configured.
- Maps fields using `mapping` JSON (sku/name/price/stock/images/categoryPath).
- Upserts into `SupplierProduct` and logs a `SupplierSyncJob` with counts/status.

## How to verify
- `SupplierSyncJob`: check `status`, `imported`, `updated`, `failed`, `error`.
- `SupplierFeed`: check `lastSyncStatus`, `lastError`, `lastSyncAt`.
- `SupplierProduct`: row counts, spot-check price/stock/images, `status` column.

## Local dev (optional)
When a local Postgres is running, align schema:
```bash
pnpm prisma migrate dev
```
This uses your local DB; it does not touch production.

## Adapters (code)
- CSV via BaseLinker: downloads + parses CSV with the mapping.
- API (generic): fetches JSON arrays (`data` or `products` also supported).
- XML/App: stubbed; plug in parser/platform API when specs are available.

## Security notes
- Keep `CRON_SECRET` secret; only hit the cron endpoint with that Bearer token.
- Store supplier creds (API keys/passwords) only in `SupplierFeed` fields in prod; avoid copying into client-side env vars. 
