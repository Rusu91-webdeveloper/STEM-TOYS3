# Catalog Fixes + Upsell Staging - Implementation Guide

**Date**: September 25, 2026  
**Status**: Pending Review & Execution

## Overview

This document describes the catalog fixes and upsell product staging implemented for TechTots. The script `scripts/catalog-fixes-and-upsell-staging.ts` performs three critical catalog fixes and stages six new upsell products (inactive, not visible to customers).

## Three Catalog Fixes

### 1. Carson MicroFlip Duplicate (MP-250 vs MP-250BUN)

**Problem**: The Carson MicroFlip microscope appears twice on the live site:
- `MP-250` at 139 RON (plain version)
- `MP-250BUN` at 224 RON (bundle with 24 prepared slides)

**Root Cause**: Two separate products created for what is essentially the same microscope - one plain, one as a bundle with slides.

**Solution**: 
- Keep `MP-250BUN` (bundle version with slides) as the primary product
- Deactivate `MP-250` (plain version)
- Add redirect from MP-250 slug to MP-250BUN slug
- Update MP-250BUN name to clarify it includes slides
- Product drops out of sitemap automatically via soft-404 mechanism

**Files Modified**: `Product` table (isActive, featured, stockQuantity, metadata)

**SKUs/Slugs**:
- Deactivated: `MP-250` (`microscop-portabil-cu-led-si-uv-cu-adaptor-de-smartphone-marire-100-250x-microflip-MP-250`)
- Kept: `MP-250BUN` (`microscop-portabil-cu-led-si-uv-cu-adaptor-de-smartphone-include-24-de-lamele-pregatite-marire-100-250x-microflip-MP-250BUN`)

---

### 2. Djeco Cubologic Pricing Fix (9 vs 16 pieces)

**Problem**: 
- Cubologic 9 (9-piece set, DJ08581) costs 137 RON
- Cubologic 16 (16-piece set, DJ08576) costs 130 RON
- The smaller set costs MORE than the larger set (illogical)

**Root Cause**: Supplier (Boribon) feed has this pricing inconsistency. The feed prices match the live site, but the logic is backwards. This appears to be a supplier feed issue, not a TechTots markup issue.

**Solution**: Swap prices to logical order:
- Cubologic 9 → 130 RON (lower price for smaller set)
- Cubologic 16 → 137 RON (higher price for larger set)

**Files Modified**: `Product` table (price)

**SKUs/Slugs**:
- DJ08581 (`joc-de-logica-cubologic-9-djeco-DJ08581`): 137 RON → 130 RON
- DJ08576 (`cubologic-16-joc-de-logica-DJ08576`): 130 RON → 137 RON

---

### 3. Aqua Dragons Refill Mismatch

**Problem**: The live Aqua Dragons refill (AD4004) belongs to the "Lumea subacvatica" (Underwater World) habitat line, but it's being shown alongside the Vulcan habitat (AD6102, red dragons with lava).

**Root Cause**: Mislabeled or mismatched product pairing. The correct refill for Vulcan is AD6103 (red Aqua Dragons), but it's out of stock at the supplier (Kidstory).

**Solution**: Since the correct refill (AD6103) is unavailable:
- Update AD4004 name and description to clarify it's for "Lumea subacvatica" habitats, NOT Vulcan
- Update Vulcan habitat (AD6102) description to note the dedicated refill (AD6103) is unavailable
- Add contact-customer-service note for refill needs

**Files Modified**: `Product` table (name, description)

**SKUs/Slugs**:
- AD4004 (`set-educativ-stem-aqua-dragons-lumea-subacvatica-kit-reumplere-starter-ad4004`): Updated to clarify compatibility
- AD6102 (`set-educativ-stem-aqua-dragons-habitat-vulcan-cu-lava-acvariu-cu-led-si-aqua-dragons-rosii-ad6102`): Added note about unavailable refill

---

## Six New Upsell Products (Staged, Inactive)

All six products are added from Boribon supplier feed with the following characteristics:
- **Status**: `isActive: false` (NOT visible to customers)
- **Purpose**: Upsell/add-on products paired with existing base products
- **Pricing**: As specified in the user request (based on Boribon retail prices)
- **Stock**: Initial stock set to 0 (will sync from supplier feed later)
- **Supplier Link**: Created `SupplierProduct` entries for automatic sync

### Products Added

| # | SKU | EAN | Name | Price (RON) | Pairs With (Base Product) |
|---|-----|-----|------|-------------|---------------------------|
| 1 | K_550202 | 814743017887 | Kit STEM Trambulina - extindere Gecko Run | 103 | K_550201 (Gecko Run starter set, 249 RON) |
| 2 | K_550203 | 814743017894 | Kit STEM Bucla - extindere Gecko Run | 103 | K_550201 (Gecko Run starter set, 249 RON) |
| 3 | K_550204 | 814743018785 | Kit STEM Palnie - extindere Gecko Run | 103 | K_550201 (Gecko Run starter set, 249 RON) |
| 4 | DJ05648 | 3070900056480 | Set de constructie trasee Zig & Go Cultubo 7 piese | 80 | DJ05640 (Zig & Go Roll 28, 212 RON) |
| 5 | CC-1027 | 6152121148100 | Set magnetic placute mici Cleverclixx | 126 | CC-1009 (Cleverclixx Pastel 36, 270 RON) |
| 6 | CC-1029 | 6152121374356 | Set magnetic placi stralucitoare Cleverclixx | 164 | CC-1004 (Cleverclixx ball circuit 60, 418 RON) |

**Product IDs/Slugs**: Will be generated deterministically based on name + SKU when script runs.

**Pairing Metadata**: Each product includes:
- `attributes.pairsWithSku`: The SKU of the base product
- `attributes.pairsWithName`: The name of the base product
- `metadata.staging.pairsWithProductId`: The database ID of the base product (for future upsell display)

---

## How Staging Works

Products are added with `isActive: false`, which means:
- ✅ Products exist in the database
- ✅ Products are linked to supplier (Boribon) for automatic sync
- ✅ Products have proper metadata for upsell pairing
- ❌ Products do NOT appear in product listings
- ❌ Products do NOT appear in search
- ❌ Products do NOT appear in the sitemap
- ❌ Products are NOT visible to customers

### How to Publish Later

When ready to make these products visible to customers:

1. **Via Admin Panel** (recommended):
   - Go to Admin > Products
   - Find the product by SKU (e.g., K_550202)
   - Click Edit
   - Toggle `isActive` to `true`
   - Set appropriate stock quantity
   - Save

2. **Via SQL** (if no admin panel):
   ```sql
   UPDATE "Product"
   SET "isActive" = true,
       "stockQuantity" = <actual_stock_from_supplier>
   WHERE sku IN ('K_550202', 'K_550203', 'K_550204', 'DJ05648', 'CC-1027', 'CC-1029');
   ```

3. **Via Supplier Sync Script**:
   - When `isActive` is toggled to true, the next supplier sync will update stock automatically

---

## Upsell Pairing (Future Implementation)

The script prepares metadata for upsell display, but does NOT implement the frontend display component. That would require:

### Option 1: Minimal "Completează setul" Block (Recommended)

Add a small section on the Product Detail Page that shows:
- Title: "Completează setul" or "Extinde-ți setul"
- Products where `attributes.pairsWithProductId` matches the current product ID
- Only show products that are `isActive: true`
- Display 2-4 products max, horizontal carousel

**Example location**: Below product description, above reviews

### Option 2: Related Products (Already exists)

The existing `RelatedProducts` component (`features/products/components/RelatedProducts.tsx`) can be extended to:
- Filter for products with matching `attributes.pairsWithSku`
- Show as a dedicated "Add-ons & Expansions" section

**Note**: The current `RelatedProducts` component just shows products from the same category. It would need to be enhanced to support explicit pairing.

---

## Running the Script

### Prerequisites

1. **Environment Setup**:
   - `.env` or `.env.local` with `DATABASE_URL` configured
   - Database must be accessible (localhost for local, production URL for production)

2. **Safety**:
   - **ALWAYS run with `--dry-run` first** to preview changes
   - Script creates automatic backup before making changes
   - Backup location: `~/.codex/backups/catalog-fixes-<timestamp>/`

### Commands

#### 1. Dry Run (Preview Only, No Changes)

```bash
pnpm run tsx scripts/catalog-fixes-and-upsell-staging.ts
```

Or:

```bash
npx tsx scripts/catalog-fixes-and-upsell-staging.ts --dry-run
```

This will:
- Show what WOULD be changed
- NOT make any actual changes
- Output a summary to `catalog-fixes-summary.json`

#### 2. Apply Changes (Execute)

```bash
npx tsx scripts/catalog-fixes-and-upsell-staging.ts --apply
```

This will:
- Create a backup in `~/.codex/backups/catalog-fixes-<timestamp>/`
- Execute all three fixes
- Add all six staged products
- Output results and backup location
- Generate `catalog-fixes-summary.json`

### Post-Execution

After running with `--apply`:

1. **Check the summary**:
   ```bash
   cat catalog-fixes-summary.json
   ```

2. **Verify in database** (optional):
   ```sql
   -- Check deactivated MicroFlip
   SELECT id, name, slug, sku, "isActive" FROM "Product" WHERE sku = 'MP-250';
   
   -- Check Cubologic prices
   SELECT sku, name, price FROM "Product" WHERE sku IN ('DJ08581', 'DJ08576');
   
   -- Check Aqua Dragons descriptions
   SELECT sku, name, description FROM "Product" WHERE sku IN ('AD4004', 'AD6102');
   
   -- Check new staged products
   SELECT sku, name, price, "isActive", slug FROM "Product"
   WHERE sku IN ('K_550202', 'K_550203', 'K_550204', 'DJ05648', 'CC-1027', 'CC-1029');
   ```

3. **Test on site**:
   - Visit deactivated MicroFlip URL (should redirect or 404)
   - Check Cubologic prices
   - Read Aqua Dragons descriptions
   - Confirm staged products do NOT appear in listings

---

## Rollback (If Needed)

If something goes wrong, you can restore from the backup:

```bash
# Find the backup directory (printed after running --apply)
ls ~/.codex/backups/catalog-fixes-*/

# Restore products from backup (manual SQL or script)
# Contact developer for rollback script if needed
```

---

## Idempotency

The script is designed to be idempotent:
- Running it multiple times won't create duplicate products
- If a fix is already applied, it will be skipped
- If a product already exists, it will report "exists" status
- Safe to run multiple times

---

## Testing Checklist

Before merging and deploying:

- [ ] Run dry-run locally, review output
- [ ] Run with `--apply` on local database
- [ ] Verify all three fixes applied correctly
- [ ] Verify all six products created as inactive
- [ ] Test that inactive products don't appear on site
- [ ] Test MicroFlip redirect/404
- [ ] Verify Cubologic prices are logical
- [ ] Read Aqua Dragons descriptions for clarity
- [ ] Run type-check: `pnpm run type-check`
- [ ] Run lint: `pnpm run lint`
- [ ] Run build: `pnpm run build`
- [ ] Commit and push to PR branch
- [ ] Create PR with this README and summary

---

## PR Checklist

The PR should include:

### Files Changed
- ✅ `scripts/catalog-fixes-and-upsell-staging.ts` (new script)
- ✅ `docs/CATALOG_FIXES_UPSELL_STAGING_README.md` (this file)
- ✅ Any related type definitions or utilities

### PR Description

Include:

1. **Summary**: Three catalog fixes + six staged upsell products
2. **Fixes**: List each fix with SKUs, slugs, and root cause
3. **New Products**: Table with SKUs, names, prices, and pairing
4. **How Staging Works**: Explain `isActive: false` mechanism
5. **How to Publish**: Steps to activate products later
6. **Post-Merge Steps**: Exact commands for Emanuel to run
7. **Testing**: Type-check, lint, and build all pass
8. **Backup**: Mention automatic backup creation

### Post-Merge Instructions for Emanuel

```bash
# 1. Pull latest code
git checkout main
git pull

# 2. Install dependencies (if needed)
pnpm install

# 3. DRY RUN FIRST (preview changes)
npx tsx scripts/catalog-fixes-and-upsell-staging.ts

# 4. Review the output, check catalog-fixes-summary.json

# 5. If everything looks good, APPLY changes
npx tsx scripts/catalog-fixes-and-upsell-staging.ts --apply

# 6. Verify changes in database and on site
# (See "Post-Execution" section above)

# 7. Later, when ready to publish upsell products:
# - Use admin panel to toggle isActive to true
# - OR run supplier sync to update stock
```

---

## Future Enhancements

### 1. Upsell Display Component

Create a `features/products/components/UpsellAddons.tsx` component:

```tsx
interface UpsellAddonsProps {
  currentProductId: string;
}

export function UpsellAddons({ currentProductId }: UpsellAddonsProps) {
  // Fetch products where metadata.staging.pairsWithProductId === currentProductId
  // AND isActive === true
  // Display in a clean "Completează setul" or "Extinde-ți setul" section
}
```

### 2. Bidirectional Pairing

Update the script to support bidirectional pairing:
- Base product knows about its add-ons
- Add-on products know about their base products
- Display "Works with" on add-on PDPs

### 3. Admin Panel for Pairing

Add an admin UI to:
- View all product pairings
- Add/remove pairings
- Bulk activate/deactivate staged products

---

## Contact

For questions or issues:
- Review this README
- Check `catalog-fixes-summary.json` output
- Review script output logs
- Contact developer if rollback needed

---

**Last Updated**: September 25, 2026  
**Script Version**: 1.0  
**Author**: Cursor AI Agent
