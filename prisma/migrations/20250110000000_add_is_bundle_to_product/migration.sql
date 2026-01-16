-- AlterTable: Add bundle-related columns to Product table
-- This migration is SAFE: All columns are nullable or have default values
-- No data will be deleted or modified

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isBundle" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "bundleItems" JSONB;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "bundleDiscount" DOUBLE PRECISION;
