-- CreateIndex
CREATE INDEX "Product_featured_createdAt_idx" ON "Product"("featured", "createdAt" DESC);
