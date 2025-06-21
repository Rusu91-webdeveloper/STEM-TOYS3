/*
  Warnings:

  - You are about to drop the column `bookId` on the `Language` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Language` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Language" DROP CONSTRAINT "Language_bookId_fkey";

-- DropIndex
DROP INDEX "Language_bookId_idx";

-- AlterTable
ALTER TABLE "Language" DROP COLUMN "bookId",
ADD COLUMN     "nativeName" TEXT;

-- CreateTable
CREATE TABLE "_BookToLanguage" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BookToLanguage_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_BookToLanguage_B_index" ON "_BookToLanguage"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Language_name_key" ON "Language"("name");

-- AddForeignKey
ALTER TABLE "_BookToLanguage" ADD CONSTRAINT "_BookToLanguage_A_fkey" FOREIGN KEY ("A") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BookToLanguage" ADD CONSTRAINT "_BookToLanguage_B_fkey" FOREIGN KEY ("B") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;
