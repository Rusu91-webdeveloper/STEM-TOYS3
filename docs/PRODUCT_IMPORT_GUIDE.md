# Product Import Guide - 40 Curated STEM Products

## Overview
Guide for importing 40 curated STEM products with supplier linking and stock sync.

## Prerequisites

1. **Supplier Setup**
   - Ensure suppliers (Boribon, KidStory) are created in the database
   - Note supplier IDs or names for linking

2. **Category Setup**
   - Categories should exist or will be auto-created:
     - Magnetic Building
     - Coding & Robotics
     - Science & Experiments

3. **Product Data**
   - Prepare CSV or JSON file with product data
   - See template below

## Import Script

**File:** `scripts/import-stem-products.ts`

**Usage:**
```bash
pnpm tsx scripts/import-stem-products.ts products.csv
# or
pnpm tsx scripts/import-stem-products.ts products.json
```

## Input Format

### CSV Format

```csv
name,description,price,costPrice,supplierSku,stockQuantity,category,images,stemDiscipline,ageGroup,supplierName
"Magnetic Building Blocks Set","Educational magnetic blocks for STEM learning",199.99,150.00,"BOR-12345",10,"Magnetic Building","[\"https://example.com/image1.jpg\"]","ENGINEERING","6-10","Boribon"
```

### JSON Format

```json
[
  {
    "name": "Magnetic Building Blocks Set",
    "description": "Educational magnetic blocks for STEM learning",
    "price": 199.99,
    "costPrice": 150.00,
    "supplierSku": "BOR-12345",
    "stockQuantity": 10,
    "category": "Magnetic Building",
    "images": ["https://example.com/image1.jpg"],
    "stemDiscipline": "ENGINEERING",
    "ageGroup": "6-10",
    "supplierName": "Boribon"
  }
]
```

## Required Fields

- `name` - Product name
- `description` - Product description
- `price` - Your selling price (RON)
- `costPrice` - Buy price from supplier (RON)
- `supplierSku` - Supplier's SKU
- `stockQuantity` - Initial stock quantity
- `category` - Category name (will be created if doesn't exist)
- `images` - Array of image URLs
- `stemDiscipline` - One of: SCIENCE, TECHNOLOGY, ENGINEERING, MATHEMATICS, GENERAL
- `ageGroup` - Optional age group (e.g., "6-10")
- `supplierName` or `supplierId` - Supplier identifier

## What the Script Does

1. **Reads product data** from CSV/JSON file
2. **Finds or creates categories** as needed
3. **Links to suppliers** by name or ID
4. **Creates Product records** with all required fields
5. **Creates SupplierProduct records** to link products to supplier SKUs
6. **Syncs stock** from supplier data

## Post-Import Steps

1. **Verify products** in admin panel
2. **Check supplier links** are correct
3. **Run supplier sync** to update stock/prices:
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" https://www.techtots.ro/api/cron/suppliers
   ```
4. **Publish products** (set `isActive: true` if not already)

## Example Product Data

See `supplier-product-template.csv` for a template.

---

**Status:** ✅ Import script ready. Prepare product data file and run import.
