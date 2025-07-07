-- DropIndex
DROP INDEX "Product_featured_isActive_idx";

-- CreateIndex
CREATE INDEX "Product_isActive_featured_idx" ON "Product"("isActive", "featured");
