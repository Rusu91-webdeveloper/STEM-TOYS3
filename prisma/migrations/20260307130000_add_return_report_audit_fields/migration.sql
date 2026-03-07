-- AlterTable
ALTER TABLE "Return"
ADD COLUMN "sentToSupplierAt" TIMESTAMP(3),
ADD COLUMN "sentToCourierAt" TIMESTAMP(3),
ADD COLUMN "supplierMessageId" TEXT,
ADD COLUMN "courierMessageId" TEXT;
