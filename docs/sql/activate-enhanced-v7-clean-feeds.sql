-- Switch production supplier feeds to the shared enhanced_v7_clean.csv catalog.
-- Safe approach:
-- 1. Keep exactly one active feed per supplier.
-- 2. Filter each feed by supplierId so catalogs do not mix.
-- 3. Leave the legacy Boribon category feeds disabled.

BEGIN;

-- Deactivate every existing feed first to avoid duplicate imports.
UPDATE "SupplierFeed"
SET
  "isActive" = false,
  "updatedAt" = NOW();

-- Reactivate Kidstory with a supplierId row filter.
UPDATE "SupplierFeed"
SET
  "name" = 'Kidstory Feed (enhanced_v7_clean)',
  "sourceUrl" = 'feed_suppliers/enhanced_v7_clean.csv',
  "mapping" = jsonb_build_object(
    'sku', 'sku',
    'name', 'name',
    'description', 'description',
    'cost', 'price',
    'retailPrice', 'compareAtPrice',
    'stock', 'stockQuantity',
    'images', 'images',
    'currency', 'RON',
    'requiredFields', jsonb_build_array('sku', 'name', 'images', 'retailPrice'),
    'rowFilterField', 'supplierId',
    'rowFilterValues', jsonb_build_array('26f5418c-965d-4630-994c-b51947cdec04')
  ),
  "isActive" = true,
  "updatedAt" = NOW()
WHERE "id" = 'cmli6a22o0002jjn9dpq5pvx9';

-- Reactivate exactly one Boribon feed with the same shared file.
UPDATE "SupplierFeed"
SET
  "name" = 'Boribon General (enhanced_v7_clean)',
  "sourceUrl" = 'feed_suppliers/enhanced_v7_clean.csv',
  "mapping" = jsonb_build_object(
    'sku', 'sku',
    'name', 'name',
    'description', 'description',
    'cost', 'price',
    'retailPrice', 'compareAtPrice',
    'stock', 'stockQuantity',
    'images', 'images',
    'currency', 'RON',
    'requiredFields', jsonb_build_array('sku', 'name', 'images', 'retailPrice'),
    'rowFilterField', 'supplierId',
    'rowFilterValues', jsonb_build_array('ee75eea8-9f64-4076-96a2-52f5d6926c14')
  ),
  "isActive" = true,
  "updatedAt" = NOW()
WHERE "id" = 'cmli6854g0002jjlm8mrnr1eh';

COMMIT;

-- Verify active feeds after the switch.
SELECT
  "id",
  "supplierId",
  "name",
  "sourceUrl",
  "isActive",
  "lastSyncAt",
  "lastSyncStatus",
  "mapping"
FROM "SupplierFeed"
ORDER BY "createdAt" DESC;
