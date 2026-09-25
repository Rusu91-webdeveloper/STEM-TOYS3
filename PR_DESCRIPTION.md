# Stage Upsell Add-Ons Batch 2 (High/Medium Confidence)

## Summary

This PR stages **42 new upsell add-on products** as hidden (inactive) entries in the catalog, ready to be activated one by one for the `CompleteSetUpsell` component on their base products' pages. The products come from tonight's supplier feed research (high and medium confidence fits).

### Changes

1. **New staging script**: `scripts/stage-upsell-batch-2.ts`
   - Validates against live Boribon and Kidstory feeds
   - Creates products as `active=false`, `status=APPROVED`, `featured=false`
   - Includes images and descriptions from supplier feeds
   - Pairs products to their bases via `metadata.upsellFor`
   - Idempotent (skips existing SKUs)
   - Dry-run by default, `--apply` to execute
   - Takes backup before any writes

2. **Kidstory UPSELL safety** (mirrors PR #31 Boribon safety)
   - Uninstalled or invalid UPSELL entries are **skipped** with a warning
   - Does NOT trigger stock closure for the entire Kidstory catalog
   - Prevents cascade failure from staging issues

3. **Portfolio registration**
   - Adds new SKUs to `lib/suppliers/boribon/portfolio.json` (tier: `UPSELL`)
   - Adds new SKUs to `lib/suppliers/kidstory/portfolio.json` (role: `UPSELL`)
   - Supplier syncs will maintain price and stock for these products

4. **Comprehensive tests**
   - `__tests__/lib/suppliers/upsell-safety.test.ts`
   - Tests UPSELL skip logic for both suppliers
   - Tests that core products still throw if uninstalled
   - Tests cascade failure prevention

## Product List (42 SKUs)

### High Confidence (11 SKUs)

**Boribon (5):**
- `CC-1026` - Cleverclixx mini tiles (126 RON) → pairs with `CC- 1009`
- `CC-1010` - Cleverclixx wheel set 25pc (221 RON) → pairs with `CC- 1009`
- `DJ05641` - Zig & Go Bila cea mai mare 27pc (212 RON) → pairs with `DJ05640`
- `F_579435` - Fischertechnik Builder-Box (154 RON) → pairs with `F_579434`
- `K_550205` - T&K Snake extension (103 RON) → pairs with `K_550201`

**Kidstory (6):**
- `06806IS` - Logiblocs Smart Circuit (99 RON) → pairs with `06805IS`
- `06808IS` - Logiblocs Secret Recorder (99 RON) → pairs with `06805IS`
- `F4641DT` - Air Toobz extension tubes (300 RON) → pairs with `F4541ML`
- `F5311ML` - Air Toobz Toobzters 5pc (75 RON) → pairs with `F4541ML`
- `PP3828` - Plus-Plus 170pc Robots (50 RON) → pairs with `PP4105`
- `clics_NC007` - Nano Clics vehicles 250pc (119 RON) → pairs with `clics_NC002`

### Medium Confidence (31 SKUs)

**Boribon (21):**
- `B_2901` - Bakoba Discover STEM kit (181 RON)
- `B_2702` - Bakoba Adventure (238 RON)
- `CC-1023` - Cleverclixx Brick Tiles 16pc (170 RON)
- `DJ05642` - Zig & Go Dring 25pc (184 RON)
- `DJ07916` - Djeco DIY Printre stele (90 RON)
- `Egm_630679` - Egmont Tangram magnetic (103 RON)
- `F_569016` - Fischertechnik Labirint (129 RON)
- `F_576105` - Fischertechnik Camion santier (129 RON)
- `FR_17104` - Fridolin IQ puzzle Extra piesa-4 (36 RON)
- `FR_17106` - Fridolin IQ puzzle Extra piesa-6 (36 RON)
- `G_7457` - Gigo Asambleaza si construieste (191 RON)
- `G_7445` - Gigo Roboti extraterestrii (201 RON)
- `MR_712432` - Moulin Roty Harta astronomica (87 RON)
- `MR_712441` - Moulin Roty Cutie lupa insecte (89 RON)
- `MR_712030` - Moulin Roty Busola solara (89 RON)
- `N_7020X` - Navir Lupa Explora (44 RON)
- `N_3050X` - Navir Periscop Explora (52 RON)
- `N_8027X` - Navir Cutie insecte mare (50 RON)
- `clics_NC005` - Nano Clics fantasy 250pc (119 RON)
- `clics_NC006` - Nano Clics wild animals 250pc (119 RON)
- `clics_NC001` - Nano Clics smaller set (76 RON)

**Kidstory (10):**
- `06807IS` - Logiblocs Alarm/doorbell (99 RON)
- `4M-03479` - KidzLabs giant magnet (69 RON)
- `4M-03291` - KidzLabs magnetism science (97 RON)
- `4M-03463` - KidzLabs Spy flashlight 6-in-1 (102 RON)
- `4M-03462` - KidzLabs night vision monocular (102 RON)
- `4M-03295` - KidzLabs Spy science (90 RON)
- `4M-03929/EU` - Crystal grow red (69 RON)
- `4M-03930/EU` - Crystal grow blue (69 RON)
- `4M-03257` - Solar System Planetarium (91 RON)
- `PP4185` - Plus-Plus 240pc Basic (69 RON)

### Excluded (6 SKUs from PR #31)

Already in production as hidden add-ons:
- `K_550202`, `K_550203`, `K_550204` (T&K extensions)
- `DJ05648` (Zig & Go Cultubo)
- `CC-1027` (Cleverclixx mini tiles - note: different from CC-1026)
- `CC-1029` (Cleverclixx glitter tiles)

### Rejected (Low Confidence)

13 SKUs rejected as low confidence (not included in this PR).

## Commands

### Dry-run (preview only, no changes)
```bash
pnpm tsx scripts/stage-upsell-batch-2.ts --dry-run
```

### Apply (execute changes, after backup)
```bash
pnpm tsx scripts/stage-upsell-batch-2.ts --apply
```

### Custom CSV path (optional)
```bash
pnpm tsx scripts/stage-upsell-batch-2.ts --csv /path/to/upsell-candidates.csv --dry-run
pnpm tsx scripts/stage-upsell-batch-2.ts --csv /path/to/upsell-candidates.csv --apply
```

## Validation

The script performs these checks before creating each product:

1. **Live feed validation**: Re-checks against current Boribon/Kidstory feeds
   - Still in stock
   - Has images (Kidstory) or feed data (Boribon)
   - Price and stock are valid

2. **Duplicate detection**: Rejects if:
   - SKU already active in catalog
   - SKU already staged (inactive product exists)
   - Name is near-duplicate of base product

3. **Base product check**: Rejects if base product not found or has no category

4. **Content extraction** (Kidstory): Uses `kidstoryContent()` to get images and descriptions

## Risks & Mitigations

### ⚠️ Known Issue: Kidstory Stock Status Bug (Out of Scope)

The Kidstory feed uses `stock_status_string="notinstock"` for out-of-stock products, but the sync code only accepts `"outofstock"`. This causes validation to fail and triggers `closeKidstoryStock()` (zeroing all Kidstory stock).

**Current status**: All 25 Kidstory portfolio products are in stock, so this hasn't triggered yet.

**Mitigation**: This PR adds UPSELL safety, so **if a Kidstory UPSELL product goes out of stock, it will be skipped with a warning rather than closing the entire catalog**. However, if a **core** Kidstory product hits this bug, it will still close stock for all Kidstory products.

**Long-term fix**: Update `lib/suppliers/kidstory/feed.ts` to accept both `"notinstock"` and `"outofstock"`. (Deferred to a separate PR per user request.)

### ✅ UPSELL Safety (Added in This PR)

**Before this PR (Kidstory):**
- If an UPSELL product is not installed or goes out of stock → sync throws → closes ALL Kidstory stock

**After this PR:**
- UPSELL entries that are uninstalled, out of stock, or fail validation are **skipped** with a warning
- Core products continue to sync normally
- Only if a **core** product fails validation does the sync throw and close stock

This mirrors the Boribon safety added in PR #31.

### 🔒 Safety Features

1. **Dry-run by default**: Must explicitly pass `--apply`
2. **Backup before writes**: Creates timestamped backup in `.backups/`
3. **Idempotent**: Re-running skips existing SKUs
4. **No activation**: All products created as `active=false`
5. **Clear validation report**: Shows create/skip/reject with reasons
6. **Live feed re-check**: Validates against current feed data, not stale research

## Testing

### Unit Tests
```bash
pnpm test __tests__/lib/suppliers/upsell-safety.test.ts
```

Tests cover:
- Boribon UPSELL skip logic (uninstalled, invalid)
- Kidstory UPSELL skip logic (uninstalled, invalid)
- Core products still throw if uninstalled
- Cascade failure prevention (multiple UPSELL failures)

### Manual Testing (Production)

**DO NOT run against production database or environment.**

The human operator will:
1. Run dry-run on local dev database first
2. Review the validation report
3. Take manual production backup via Neon console
4. Run apply on local dev database
5. Verify created products in local admin
6. Deploy to staging for final verification
7. Run apply on production after successful staging test

## Post-Deploy Activation

After this PR merges and deploys:

1. Products remain hidden (`active=false`)
2. Supplier syncs (06:00/18:00) maintain their price and stock
3. Human activates them one by one via admin:
   - Set `active=true` for the add-on product
   - It immediately appears in `CompleteSetUpsell` on its base product's page
4. Monitor customer behavior and sales
5. Deactivate if needed (set `active=false`)

## Files Changed

- `scripts/stage-upsell-batch-2.ts` (new) - Staging script
- `lib/suppliers/kidstory/sync.ts` - Add UPSELL safety
- `lib/suppliers/kidstory/feed.ts` - Add optional `role` to type
- `__tests__/lib/suppliers/upsell-safety.test.ts` (new) - Tests
- `lib/suppliers/boribon/portfolio.json` (will be modified on apply)
- `lib/suppliers/kidstory/portfolio.json` (will be modified on apply)

## Related

- **PR #30**: Added `CompleteSetUpsell` component and `catalog-fixes-and-upsell-staging.ts`
- **PR #31**: Added 6 UPSELL products and Boribon UPSELL safety
- **Research**: `uploads/upsell-candidates_26fc.csv` (tonight's supplier feed analysis)
- **Context**: `uploads/SUMMARY_876d.md` (feed notes)

---

**Ready for review.** This PR does NOT run the script or modify production. It adds the tooling for the human operator to stage the add-ons safely in a controlled deployment.
