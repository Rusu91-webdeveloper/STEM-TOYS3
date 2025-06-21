-- CreateEnum
CREATE TYPE "StemCategory" AS ENUM ('SCIENCE', 'TECHNOLOGY', 'ENGINEERING', 'MATHEMATICS', 'GENERAL');

-- AlterTable
ALTER TABLE "Blog" ADD COLUMN     "readingTime" INTEGER,
ADD COLUMN     "stemCategory" "StemCategory" NOT NULL DEFAULT 'GENERAL';

-- CreateIndex
CREATE INDEX "Blog_stemCategory_idx" ON "Blog"("stemCategory");
