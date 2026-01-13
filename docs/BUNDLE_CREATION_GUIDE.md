# Bundle Creation Guide - 10 Product Bundles

## Overview
Guide for creating 10 product bundles as separate bundle products to raise AOV (Average Order Value).

## Bundle Structure

Bundles are created as separate `Product` records with:
- `isBundle: true`
- `bundleItems: ["product-id-1", "product-id-2", ...]` (JSON array of product IDs)
- `bundleDiscount: 15` (discount percentage)
- `compareAtPrice`: Sum of individual product prices
- `price`: Bundle price after discount

## Bundle Creation Script

**File:** `scripts/create-bundles.ts`

**Usage:**
```bash
pnpm tsx scripts/create-bundles.ts
```

## Bundle Strategy

### 1. Magnetic Building Bundles (3-4 bundles)
- Starter Bundle (2-3 products)
- Advanced Builder Bundle (3-4 products)
- Complete Collection Bundle (4-5 products)

### 2. Coding & Robotics Bundles (3-4 bundles)
- Beginner Coding Bundle
- Robotics Starter Kit
- Advanced Programming Bundle

### 3. Science & Experiments Bundles (3-4 bundles)
- Chemistry Lab Bundle
- Physics Experiments Bundle
- Biology Discovery Bundle

## Bundle Pricing

**Formula:**
```
Items Total = sum of individual product prices
Discount = Items Total × (discountPercent / 100)
Bundle Price = Items Total - Discount
```

**Discount Strategy:**
- 15-20% discount on bundles
- Show savings clearly: "Save X lei when buying together"
- Display `compareAtPrice` (original total) vs `price` (bundle price)

## Post-Creation Steps

1. **Verify bundles** in admin panel
2. **Check bundle items** are linked correctly
3. **Update product pages** to show bundle options
4. **Feature bundles** on category pages
5. **Test bundle purchase flow**

## Display on Product Pages

Bundles should:
- Show as separate products in catalog
- Display "Bundle" badge
- List included items
- Show savings amount
- Allow direct bundle purchase

---

**Status:** ✅ Bundle creation script ready. Update bundle definitions with actual product IDs after importing products.
