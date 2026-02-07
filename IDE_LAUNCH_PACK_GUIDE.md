# STEM Store – LAUNCH PACK (20 HERO + 30 TEST) – Next.js Implementation Guide

This pack is ready to import into your database and deploy.

## Files
- `seed_products.json` → normalized seed data used by your app (recommended)
- `seed_products.csv` → human-readable sheet for review

## What’s inside each product
Each product includes everything needed to launch:
- **SKU** (`sku`) – unique key
- **Title** (`title`)
- **Vendor/Brand** (`vendor`)
- **Product type** (`productType`) – STEM category
- **Age range** (`ageRange`)
- **Description** (`description`) – supplier description
- **Skills** (`skills`) – learning outcomes (used for filters/badges)
- **Images** (`images[]`) + `mainImage`
- **Pricing** (`pricing.supplierPriceB2C/B2B`) – supplier costs
- **Inventory** (`inventory.supplierQty`) – supplier stock
- **Bundle** (`bundle`) – theme, discount, recommended bundle items

## 1) HERO vs TEST (simple rules)
- **HERO (launchRole = `HERO`)**
  - Put on homepage + top of categories.
  - Eligible for ads.
  - Show a "Recomandat" badge.
  - Always show bundle block.

- **TEST (launchRole = `TEST`)**
  - Visible on site, but lower priority.
  - Mostly sell via bundles + SEO/internal links.
  - Minimal ad spend until proven.
  - Promote to HERO only after good conversion + low returns.

## 2) How to import and deploy (recommended flow)
1) Create a `Product` table (or collection) with fields matching the JSON.
2) Write a seed script that upserts products by `sku`.
3) Build pages:
   - `/` homepage shows HERO items first.
   - `/products` list page filters by `productType`, `skills`, `ageRange`.
   - `/products/[sku]` detail page: carousel from `images` + bundle CTA.

## 3) Bundles (virtual bundles)
Use **virtual bundles**: when user clicks "Adaugă pachet", add all `bundle.items[].sku` to cart and apply `bundle.discount`.
Implementation tips:
- Bundle must include 1 HERO + 1–2 add-ons.
- If an item is TEST, it should appear more often as an add-on than as the main hero.

## 4) Testing playbook (how to validate TEST items)
Do not scale ads on TEST items until:
- Conversion ≥ 1.5–2% from relevant traffic OR strong add-to-cart rate.
- Returns/defects < 7% after first 20–30 orders.
- Support load manageable (FAQ solves most questions).

Suggested method:
1) Put TEST items inside bundles on HERO pages.
2) Let them collect organic/bundle sales first.
3) If one TEST sells well, promote it to HERO and add ads.

## 5) Minimal Prisma schema (example)
```prisma
model Product {
  id          String   @id @default(cuid())
  sku         String   @unique
  title       String
  vendor      String?
  productType String?
  ageRange    String?
  status      String   @default("active")
  launchRole  String   // HERO | TEST
  tier        String   // P0-Hero | P1-Test
  tags        String[]
  skills      String[]
  description String?
  shortAngleRO String?
  keyBenefits String[]
  images      String[]
  mainImage   String?
  supplierUrl String?
  supplierPriceB2C Float?
  supplierPriceB2B Float?
  supplierQty Int?
  weightKg    Float?
  lengthCm    Float?
  widthCm     Float?
  bundleTheme String?
  bundleDiscount String?
  bundleItems Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## 6) Seed script hint
Read `seed_products.json` and `upsert` by `sku`.
