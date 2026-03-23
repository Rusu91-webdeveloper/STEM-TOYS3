#!/usr/bin/env python3
"""
Generate production SQL from enhanced_new_data_v4.csv.

Outputs INSERT ... ON CONFLICT (id) DO UPDATE for all 56 products.
- Existing products (25): updates name, metadata, compareAtPrice, categoryId
- New products (31): full insert

PostgreSQL-safe: proper array syntax, JSON casting, enum values.
"""

import csv
import json
import re
from pathlib import Path

INPUT = Path(__file__).parent / "enhanced_v7_clean.csv"
OUTPUT = Path(__file__).parent / "seed_products_v7.sql"

STATUS_MAP = {
    "APPROVED": "APPROVED",
    "DRAFT": "IN_PENDING",
    "IN_PENDING": "IN_PENDING",
    "PUBLISHED": "PUBLISHED",
}


def sql_str(val: str) -> str:
    """Escape a string for SQL."""
    if not val or val.strip() == "":
        return "NULL"
    escaped = val.replace("'", "''")
    return f"'{escaped}'"


def sql_float(val: str) -> str:
    if not val or val.strip() == "":
        return "NULL"
    try:
        return str(float(val))
    except (ValueError, TypeError):
        return "NULL"


def sql_int(val: str) -> str:
    if not val or val.strip() == "":
        return "NULL"
    try:
        return str(int(float(val)))
    except (ValueError, TypeError):
        return "NULL"


def sql_bool(val: str) -> str:
    if val.lower() in ("true", "1"):
        return "TRUE"
    return "FALSE"


def sql_text_array(val: str) -> str:
    """Convert JSON array string to PostgreSQL text[] array literal."""
    if not val or val.strip() == "" or val.strip() == "[]":
        return "ARRAY[]::text[]"
    try:
        items = json.loads(val)
        if not items:
            return "ARRAY[]::text[]"
        escaped = [item.replace("'", "''") for item in items if item]
        parts = ", ".join(f"'{e}'" for e in escaped)
        return f"ARRAY[{parts}]::text[]"
    except (json.JSONDecodeError, TypeError):
        return "ARRAY[]::text[]"


def sql_json(val: str) -> str:
    """Convert JSON string to PostgreSQL jsonb."""
    if not val or val.strip() == "" or val.strip() in ("{}", "null"):
        return "NULL"
    try:
        json.loads(val)
        escaped = val.replace("'", "''")
        return f"'{escaped}'::jsonb"
    except (json.JSONDecodeError, TypeError):
        return "NULL"


def sql_timestamp(val: str) -> str:
    if not val or val.strip() == "":
        return "NOW()"
    escaped = val.replace("'", "''")
    return f"'{escaped}'::timestamp"


def sql_enum(val: str) -> str:
    status = STATUS_MAP.get(val, "IN_PENDING")
    return f"'{status}'::\"ProductStatus\""


def generate_sql():
    rows = []
    with open(INPUT, "r", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    lines = []
    lines.append("-- ============================================================")
    lines.append("-- STEM-TOYS3 Product Seed — Generated from enhanced_new_data_v4.csv")
    lines.append(f"-- {len(rows)} products (INSERT ... ON CONFLICT DO UPDATE)")
    lines.append("-- ============================================================")
    lines.append("-- SAFETY: This is additive only. No DROP, DELETE, or TRUNCATE.")
    lines.append("-- Existing products get name/metadata/compareAtPrice/categoryId updated.")
    lines.append("-- New products get fully inserted.")
    lines.append("-- ============================================================")
    lines.append("")
    lines.append("BEGIN;")
    lines.append("")

    for i, r in enumerate(rows, 1):
        sku_label = r.get("sku", r["id"][:20])
        lines.append(f"-- [{i}/{len(rows)}] {r['name'][:60]}  (sku: {sku_label})")

        lines.append(f"""INSERT INTO "Product" (
  "id", "name", "slug", "description", "price", "compareAtPrice", "sku",
  "images", "categoryId", "tags", "attributes", "metadata",
  "isActive", "featured", "stockQuantity", "reservedQuantity",
  "reorderPoint", "weight", "dimensions", "averageRating", "reviewCount",
  "totalSold", "createdAt", "updatedAt", "barcode", "ageGroup",
  "costPrice", "importDuties", "shippingCost", "storageCost",
  "packagingCost", "laborCost", "qualityControlCost",
  "paymentProcessingFee", "customerServiceCost", "operationalOverhead",
  "status", "stemDiscipline", "supplierId",
  "isBundle", "bundleItems", "bundleDiscount"
) VALUES (
  {sql_str(r['id'])},
  {sql_str(r['name'])},
  {sql_str(r['slug'])},
  {sql_str(r.get('description', ''))},
  {sql_float(r['price'])},
  {sql_float(r.get('compareAtPrice', ''))},
  {sql_str(r.get('sku', ''))},
  {sql_text_array(r.get('images', '[]'))},
  {sql_str(r.get('categoryId', '')) if r.get('categoryId', '').strip() else 'NULL'},
  {sql_text_array(r.get('tags', '[]'))},
  {sql_json(r.get('attributes', ''))},
  {sql_json(r.get('metadata', ''))},
  {sql_bool(r.get('isActive', 'true'))},
  {sql_bool(r.get('featured', 'false'))},
  {sql_int(r.get('stockQuantity', '0'))},
  {sql_int(r.get('reservedQuantity', '0'))},
  {sql_int(r.get('reorderPoint', ''))},
  {sql_float(r.get('weight', ''))},
  {sql_json(r.get('dimensions', ''))},
  {sql_float(r.get('averageRating', ''))},
  {sql_int(r.get('reviewCount', '0'))},
  {sql_int(r.get('totalSold', '0'))},
  {sql_timestamp(r.get('createdAt', ''))},
  NOW(),
  {sql_str(r.get('barcode', '')) if r.get('barcode', '').strip() else 'NULL'},
  {sql_str(r.get('ageGroup', '')) if r.get('ageGroup', '').strip() else 'NULL'},
  {sql_float(r.get('costPrice', ''))},
  {sql_float(r.get('importDuties', ''))},
  {sql_float(r.get('shippingCost', ''))},
  {sql_float(r.get('storageCost', ''))},
  {sql_float(r.get('packagingCost', ''))},
  {sql_float(r.get('laborCost', ''))},
  {sql_float(r.get('qualityControlCost', ''))},
  {sql_float(r.get('paymentProcessingFee', ''))},
  {sql_float(r.get('customerServiceCost', ''))},
  {sql_float(r.get('operationalOverhead', ''))},
  {sql_enum(r.get('status', 'APPROVED'))},
  {sql_str(r.get('stemDiscipline', '')) if r.get('stemDiscipline', '').strip() else 'NULL'},
  {sql_str(r.get('supplierId', '')) if r.get('supplierId', '').strip() else 'NULL'},
  {sql_bool(r.get('isBundle', 'false'))},
  {sql_json(r.get('bundleItems', ''))},
  {sql_float(r.get('bundleDiscount', ''))}
)
ON CONFLICT ("id") DO UPDATE SET
  "name"             = EXCLUDED."name",
  "description"      = EXCLUDED."description",
  "compareAtPrice"   = COALESCE(EXCLUDED."compareAtPrice", "Product"."compareAtPrice"),
  "categoryId"       = COALESCE(EXCLUDED."categoryId", "Product"."categoryId"),
  "metadata"         = EXCLUDED."metadata",
  "updatedAt"        = NOW();
""")

    lines.append("")
    lines.append("COMMIT;")
    lines.append("")
    lines.append(f"-- Done. {len(rows)} products upserted.")

    sql = "\n".join(lines)

    with open(OUTPUT, "w", encoding="utf-8") as f:
        f.write(sql)

    print(f"Generated: {OUTPUT.name}")
    print(f"Products:  {len(rows)}")
    print(f"File size: {len(sql):,} bytes")
    print(f"\nSafety summary:")
    print(f"  - Wrapped in BEGIN/COMMIT transaction")
    print(f"  - Uses ON CONFLICT (id) DO UPDATE — no duplicates")
    print(f"  - Only updates: name, description, compareAtPrice, categoryId, metadata, updatedAt")
    print(f"  - Preserves all other existing data for old products")
    print(f"  - No DROP, DELETE, or TRUNCATE statements")


if __name__ == "__main__":
    generate_sql()
