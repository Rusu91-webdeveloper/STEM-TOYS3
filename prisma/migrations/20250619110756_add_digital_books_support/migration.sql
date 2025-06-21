-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";

-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "isDigital" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "bookId" TEXT,
ADD COLUMN     "downloadCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "downloadExpiresAt" TIMESTAMP(3),
ADD COLUMN     "isDigital" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxDownloads" INTEGER NOT NULL DEFAULT 5,
ALTER COLUMN "productId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "DigitalFile" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "format" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalDownload" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "digitalFileId" TEXT NOT NULL,
    "downloadToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "downloadedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigitalDownload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DigitalFile_bookId_idx" ON "DigitalFile"("bookId");

-- CreateIndex
CREATE INDEX "DigitalFile_format_idx" ON "DigitalFile"("format");

-- CreateIndex
CREATE INDEX "DigitalFile_language_idx" ON "DigitalFile"("language");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalFile_bookId_format_language_key" ON "DigitalFile"("bookId", "format", "language");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalDownload_downloadToken_key" ON "DigitalDownload"("downloadToken");

-- CreateIndex
CREATE INDEX "DigitalDownload_orderItemId_idx" ON "DigitalDownload"("orderItemId");

-- CreateIndex
CREATE INDEX "DigitalDownload_userId_idx" ON "DigitalDownload"("userId");

-- CreateIndex
CREATE INDEX "DigitalDownload_digitalFileId_idx" ON "DigitalDownload"("digitalFileId");

-- CreateIndex
CREATE INDEX "DigitalDownload_downloadToken_idx" ON "DigitalDownload"("downloadToken");

-- CreateIndex
CREATE INDEX "DigitalDownload_expiresAt_idx" ON "DigitalDownload"("expiresAt");

-- CreateIndex
CREATE INDEX "OrderItem_bookId_idx" ON "OrderItem"("bookId");

-- AddForeignKey
ALTER TABLE "DigitalFile" ADD CONSTRAINT "DigitalFile_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalDownload" ADD CONSTRAINT "DigitalDownload_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalDownload" ADD CONSTRAINT "DigitalDownload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalDownload" ADD CONSTRAINT "DigitalDownload_digitalFileId_fkey" FOREIGN KEY ("digitalFileId") REFERENCES "DigitalFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
