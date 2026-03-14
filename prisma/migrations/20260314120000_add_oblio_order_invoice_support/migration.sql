-- CreateEnum
CREATE TYPE "ExternalInvoiceProvider" AS ENUM ('OBLIO');

-- CreateEnum
CREATE TYPE "ExternalInvoiceType" AS ENUM ('INVOICE', 'CREDIT_NOTE');

-- CreateEnum
CREATE TYPE "ExternalSyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "EinvoiceSyncStatus" AS ENUM ('NOT_SENT', 'SENT', 'PROCESSING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "OrderInvoice" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "provider" "ExternalInvoiceProvider" NOT NULL DEFAULT 'OBLIO',
  "documentType" "ExternalInvoiceType" NOT NULL DEFAULT 'INVOICE',
  "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  "syncStatus" "ExternalSyncStatus" NOT NULL DEFAULT 'PENDING',
  "einvoiceStatus" "EinvoiceSyncStatus" NOT NULL DEFAULT 'NOT_SENT',
  "seriesName" TEXT,
  "number" TEXT,
  "providerInvoiceId" TEXT,
  "providerClientId" TEXT,
  "providerLink" TEXT,
  "providerEinvoiceLink" TEXT,
  "issueDate" TIMESTAMP(3),
  "dueDate" TIMESTAMP(3),
  "currency" TEXT NOT NULL DEFAULT 'RON',
  "totalAmount" DOUBLE PRECISION NOT NULL,
  "collectType" TEXT,
  "collectDocumentNumber" TEXT,
  "lastSyncAt" TIMESTAMP(3),
  "syncedAt" TIMESTAMP(3),
  "collectedAt" TIMESTAMP(3),
  "canceledAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  "requestHash" TEXT,
  "payload" JSONB,
  "response" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OrderInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderInvoice_orderId_provider_documentType_key"
ON "OrderInvoice"("orderId", "provider", "documentType");

-- CreateIndex
CREATE INDEX "OrderInvoice_orderId_idx" ON "OrderInvoice"("orderId");

-- CreateIndex
CREATE INDEX "OrderInvoice_provider_idx" ON "OrderInvoice"("provider");

-- CreateIndex
CREATE INDEX "OrderInvoice_documentType_idx" ON "OrderInvoice"("documentType");

-- CreateIndex
CREATE INDEX "OrderInvoice_status_idx" ON "OrderInvoice"("status");

-- CreateIndex
CREATE INDEX "OrderInvoice_syncStatus_idx" ON "OrderInvoice"("syncStatus");

-- CreateIndex
CREATE INDEX "OrderInvoice_providerInvoiceId_idx" ON "OrderInvoice"("providerInvoiceId");

-- CreateIndex
CREATE INDEX "OrderInvoice_seriesName_number_idx" ON "OrderInvoice"("seriesName", "number");

-- AddForeignKey
ALTER TABLE "Order"
ADD CONSTRAINT "Order_billingAddressId_fkey"
FOREIGN KEY ("billingAddressId") REFERENCES "Address"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderInvoice"
ADD CONSTRAINT "OrderInvoice_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
