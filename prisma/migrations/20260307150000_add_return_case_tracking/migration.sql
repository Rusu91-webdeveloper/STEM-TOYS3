-- CreateEnum
CREATE TYPE "ReturnLiability" AS ENUM ('UNDECIDED', 'SUPPLIER', 'COURIER', 'INTERNAL', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "ReturnResolutionStatus" AS ENUM ('OPEN', 'WAITING_SUPPLIER', 'WAITING_COURIER', 'READY_TO_REFUND', 'REFUNDED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReturnReportRecipientType" AS ENUM ('SUPPLIER', 'COURIER');

-- AlterTable
ALTER TABLE "Return"
ADD COLUMN "liability" "ReturnLiability" NOT NULL DEFAULT 'UNDECIDED',
ADD COLUMN "resolutionStatus" "ReturnResolutionStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN "externalClaimDeadline" TIMESTAMP(3),
ADD COLUMN "resolutionNotes" TEXT;

-- CreateTable
CREATE TABLE "ReturnReportLog" (
  "id" TEXT NOT NULL,
  "returnId" TEXT NOT NULL,
  "recipientType" "ReturnReportRecipientType" NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "messageId" TEXT,
  "emailSubject" TEXT,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ReturnReportLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Return_liability_idx" ON "Return"("liability");

-- CreateIndex
CREATE INDEX "Return_resolutionStatus_idx" ON "Return"("resolutionStatus");

-- CreateIndex
CREATE INDEX "Return_externalClaimDeadline_idx" ON "Return"("externalClaimDeadline");

-- CreateIndex
CREATE INDEX "ReturnReportLog_returnId_idx" ON "ReturnReportLog"("returnId");

-- CreateIndex
CREATE INDEX "ReturnReportLog_recipientType_idx" ON "ReturnReportLog"("recipientType");

-- CreateIndex
CREATE INDEX "ReturnReportLog_sentAt_idx" ON "ReturnReportLog"("sentAt");

-- AddForeignKey
ALTER TABLE "ReturnReportLog"
ADD CONSTRAINT "ReturnReportLog_returnId_fkey"
FOREIGN KEY ("returnId") REFERENCES "Return"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
