# Catalog Fixes & Upsell Staging Runbook

## What It Does

Two catalog fixes + six staged upsell products for TechTots:

### Fixes

1. **MicroFlip**: Keeps MP-250 plain (139 RON), deactivates MP-250BUN bundle
2. **Aqua Dragons**: Deactivates mismatched refill AD4004

### Staged Products (Inactive, Tracked by Boribon Sync)

Six expansion products from Boribon, staged as `isActive: false` and added to `lib/suppliers/boribon/portfolio.json`:

| SKU | EAN | Name | Price | Pairs With |
|-----|-----|------|-------|------------|
| K_550202 | 814743017887 | T&K Gecko Run Trambulina | 103 RON | K_550201 |
| K_550203 | 814743017894 | T&K Gecko Run Bucla | 103 RON | K_550201 |
| K_550204 | 814743018785 | T&K Gecko Run Palnie | 103 RON | K_550201 |
| DJ05648 | 3070900056480 | Djeco Zig & Go Cultubo 7 | 80 RON | DJ05640 |
| CC-1027 | 6152121148100 | Cleverclixx mini tiles | 126 RON | CC- 1009 |
| CC-1029 | 6152121374356 | Cleverclixx glitter tiles 16 | 164 RON | CC-1004 |

**Boribon Sync Behavior:**
- The 6 products are now tracked by the Boribon sync (runs at 06:00 and 18:00)
- Sync will automatically populate **images**, update **stock**, and set retail **price** from the feed
- Sync **DOES NOT** change `isActive` — products stay hidden until manually activated
- The sync only updates `stockQuantity`, `price`, and `compareAtPrice` fields per `lib/suppliers/boribon/sync.ts`

---

## Usage

### 1. Dry-Run (Preview Changes)

```bash
pnpm tsx scripts/catalog-fixes-and-upsell-staging.ts --dry-run
```

Shows what would change without modifying the database.

### 2. Apply Changes

```bash
pnpm tsx scripts/catalog-fixes-and-upsell-staging.ts --apply
```

**Backup**: Automatic backup created in `.backups/catalog-fixes-{timestamp}/`

---

## Verify

```sql
-- Check MicroFlip (plain active, bundle inactive)
SELECT id, slug, sku, name, price, "isActive" 
FROM "Product" 
WHERE sku IN ('MP-250', 'MP-250BUN');

-- Check Aqua Dragons refill
SELECT id, slug, sku, name, "isActive" 
FROM "Product" 
WHERE sku IN ('AD4004', 'AD6102');

-- List staged products
SELECT id, slug, sku, name, price, "isActive", "stockQuantity", metadata->'staged' as staged
FROM "Product" 
WHERE sku IN ('K_550202', 'K_550203', 'K_550204', 'DJ05648', 'CC-1027', 'CC-1029');

-- Check SupplierProduct links (price should be NULL initially, filled by sync)
SELECT id, "supplierSku", name, price, stock, "lastSyncAt"
FROM "SupplierProduct"
WHERE "supplierSku" IN ('K_550202', 'K_550203', 'K_550204', 'DJ05648', 'CC-1027', 'CC-1029');
```

---

## Publishing Staged Products Later

### Via Database

```sql
-- Activate one product
UPDATE "Product"
SET "isActive" = true
WHERE sku = 'K_550202';

-- Or activate all six at once
UPDATE "Product"
SET "isActive" = true
WHERE sku IN ('K_550202', 'K_550203', 'K_550204', 'DJ05648', 'CC-1027', 'CC-1029');
```

### Via Admin Dashboard

1. Go to Admin → Products
2. Filter: `isActive: false` AND `status: APPROVED`
3. Find staged products
4. Set `isActive: true` for each

### After Publishing

1. Regenerate sitemap: `pnpm run generate:sitemap`
2. Clear Next.js cache: `rm -rf .next/cache && pnpm run build`

---

## Rollback

Restore from backup if needed:

```bash
# Find your backup directory
ls -lt .backups/

# Restore products from backup JSON
# (Requires custom restore script or manual DB import)
```

---

## Upsell Pairing

The "Completează setul" block automatically shows active upsell products on base product pages.

**How it works:**
- Upsell products have `metadata.upsellFor` = base product SKU
- Component queries products where `metadata.upsellFor` matches current product SKU
- Only shows active (`isActive: true`) upsells
- Zero upsells = nothing renders

**To wire new pairings:**

```sql
UPDATE "Product"
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{upsellFor}',
  '"BASE_PRODUCT_SKU"'
)
WHERE sku = 'UPSELL_PRODUCT_SKU';
```

---

## Root Causes (Evidence-Based)

### Fix 1: MicroFlip
**Root Cause**: Two SKUs exist for same product line - MP-250 (plain, 139 RON) vs MP-250BUN (bundle with 24 slides, 224 RON). Keeping plain version as lower-priced entry point.

**Files Changed**: `scripts/catalog-fixes-and-upsell-staging.ts`, `Product` table

**SKUs**: MP-250, MP-250BUN

### Fix 2: Aqua Dragons
**Root Cause**: Refill AD4004 belongs to "Lumea subacvatica" habitat line, not Vulcan (AD6102). Correct Vulcan refill is AD6103 (out of stock per Kidstory feed). Deactivated mismatched refill.

**Files Changed**: `scripts/catalog-fixes-and-upsell-staging.ts`, `Product` table

**SKUs**: AD4004 (deactivated), AD6102 (Vulcan habitat)

---

## Deterministic Slugs for Staged Products

- `kit-stem-trambulina-extindere-pentru-cursa-cu-obstacole-cu-bila-metalica-thames-kosmos-k550202`
- `kit-stem-bucla-extindere-pentru-cursa-cu-obstacole-cu-bila-metalica-thames-kosmos-k550203`
- `kit-stem-palnie-extindere-pentru-cursa-cu-obstacole-cu-bila-metalica-thames-kosmos-k550204`
- `set-de-constructie-trasee-zig-go-cultubo-7-piese-djeco-dj05648`
- `set-magnetic-de-construit-cu-placute-mici-cleverclixx-cc1027`
- `set-magnetic-de-construit-cu-placi-stralucitoare-cleverclixx-cc1029`

---

## Idempotency

The script is safe to re-run:
- Skips already-deactivated products
- Skips already-existing staged products
- Each run creates a new timestamped backup

---

## How Boribon Sync Works

The 6 add-on products are added to `lib/suppliers/boribon/portfolio.json`, which tells the Boribon sync to manage them.

**Sync Schedule**: Runs at 06:00 and 18:00 daily

**What the Sync Updates** (per `lib/suppliers/boribon/sync.ts`):
- `stockQuantity` — Updates available stock (preserves reservations)
- `price` — Updates retail price from feed
- `compareAtPrice` — Set to NULL
- `images` — Populated in SupplierProduct (via feed)

**What the Sync NEVER Touches**:
- `isActive` — Products stay inactive until manually activated
- `featured` — No changes
- `metadata` — No changes (upsell pairing preserved)
- Product name, slug, description — No changes

**Risk**: If a product is removed from the Boribon feed, the sync will fail for that SKU but won't delete the product. Monitor sync logs after deployment.

---

## Not Completed

**Cubologic Pricing** — NOT FIXED. Both products (DJ08576, DJ08581) stay at supplier feed prices. The Boribon sync overwrites price on every run, so manual overrides don't persist. Any price correction would need a pricing rules system that the sync respects.

**Air Toobz F4641DT** — NOT INCLUDED (explicitly deferred per user request).
