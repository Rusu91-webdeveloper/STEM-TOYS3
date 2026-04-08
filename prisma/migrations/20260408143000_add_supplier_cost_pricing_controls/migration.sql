ALTER TABLE "Supplier"
ADD COLUMN "useSupplierRetailPriceAsBase" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "plannedPromoDiscountPercentage" DOUBLE PRECISION DEFAULT 0;
