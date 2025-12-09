-- CreateEnum
CREATE TYPE "ABTestType" AS ENUM ('TITLE', 'CONTENT', 'CALL_TO_ACTION', 'IMAGE', 'STRUCTURE', 'LAYOUT', 'PRICING', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ABTestStatus" AS ENUM ('DRAFT', 'RUNNING', 'COMPLETED', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ABTestAudience" AS ENUM ('ALL', 'ROMANIAN', 'NEW_USERS', 'RETURNING_USERS', 'MOBILE_USERS', 'DESKTOP_USERS');

-- AlterTable
ALTER TABLE "Blog" ADD COLUMN     "competitorRank" INTEGER,
ADD COLUMN     "coverImageId" TEXT,
ADD COLUMN     "romanianMarketFit" DECIMAL(3,2),
ADD COLUMN     "viralScore" DECIMAL(3,2);

-- CreateTable
CREATE TABLE "ABTest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ABTestType" NOT NULL,
    "status" "ABTestStatus" NOT NULL DEFAULT 'DRAFT',
    "targetAudience" "ABTestAudience" NOT NULL DEFAULT 'ALL',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "winner" TEXT,
    "confidence" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ABTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ABTestVariant" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "isControl" BOOLEAN NOT NULL DEFAULT false,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ABTestVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ABTestMetrics" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "socialShares" INTEGER NOT NULL DEFAULT 0,
    "timeOnPage" INTEGER NOT NULL DEFAULT 0,
    "bounceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ABTestMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ABTestResult" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "winnerVariantId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "improvement" DOUBLE PRECISION NOT NULL,
    "statisticalSignificance" BOOLEAN NOT NULL,
    "recommendations" TEXT[],
    "analysisData" JSONB,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ABTestResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ABTest_status_idx" ON "ABTest"("status");

-- CreateIndex
CREATE INDEX "ABTest_isActive_idx" ON "ABTest"("isActive");

-- CreateIndex
CREATE INDEX "ABTest_createdAt_idx" ON "ABTest"("createdAt");

-- CreateIndex
CREATE INDEX "ABTestVariant_testId_idx" ON "ABTestVariant"("testId");

-- CreateIndex
CREATE INDEX "ABTestMetrics_variantId_idx" ON "ABTestMetrics"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "ABTestMetrics_testId_variantId_key" ON "ABTestMetrics"("testId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "ABTestResult_testId_key" ON "ABTestResult"("testId");

-- CreateIndex
CREATE INDEX "ABTestResult_testId_idx" ON "ABTestResult"("testId");

-- CreateIndex
CREATE INDEX "ABTestResult_winnerVariantId_idx" ON "ABTestResult"("winnerVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "Blog_coverImageId_key" ON "Blog"("coverImageId");

-- CreateIndex
CREATE INDEX "Blog_viralScore_idx" ON "Blog"("viralScore");

-- CreateIndex
CREATE INDEX "Blog_isPublished_updatedAt_idx" ON "Blog"("isPublished", "updatedAt");

-- AddForeignKey
ALTER TABLE "ABTestVariant" ADD CONSTRAINT "ABTestVariant_testId_fkey" FOREIGN KEY ("testId") REFERENCES "ABTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ABTestMetrics" ADD CONSTRAINT "ABTestMetrics_testId_fkey" FOREIGN KEY ("testId") REFERENCES "ABTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ABTestMetrics" ADD CONSTRAINT "ABTestMetrics_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ABTestVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ABTestResult" ADD CONSTRAINT "ABTestResult_testId_fkey" FOREIGN KEY ("testId") REFERENCES "ABTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ABTestResult" ADD CONSTRAINT "ABTestResult_winnerVariantId_fkey" FOREIGN KEY ("winnerVariantId") REFERENCES "ABTestVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

