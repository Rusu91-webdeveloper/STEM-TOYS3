require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function addMissingColumns() {
  console.log("🔧 Adding missing columns to existing tables...\n");

  try {
    // Add missing columns to Product table
    console.log("📦 Adding columns to Product table...");
    await prisma.$executeRaw`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "ageGroup" TEXT;`;
    await prisma.$executeRaw`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "learningOutcomes" TEXT[] DEFAULT '{}';`;
    await prisma.$executeRaw`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "productType" TEXT;`;
    await prisma.$executeRaw`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "specialCategories" TEXT[] DEFAULT '{}';`;
    await prisma.$executeRaw`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "stemDiscipline" TEXT DEFAULT 'GENERAL';`;
    await prisma.$executeRaw`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "romanianCompetencies" TEXT[] DEFAULT '{}';`;
    await prisma.$executeRaw`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "romanianCurriculumAlignment" TEXT[] DEFAULT '{}';`;
    await prisma.$executeRaw`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "romanianEducationalLevel" TEXT;`;

    console.log("✅ Added Product table columns");

    // Add missing columns to Blog table
    console.log("📝 Adding columns to Blog table...");
    await prisma.$executeRaw`ALTER TABLE "Blog" ADD COLUMN IF NOT EXISTS "coverImageId" TEXT UNIQUE;`;
    await prisma.$executeRaw`ALTER TABLE "Blog" ADD COLUMN IF NOT EXISTS "viralScore" DECIMAL(3,2);`;
    await prisma.$executeRaw`ALTER TABLE "Blog" ADD COLUMN IF NOT EXISTS "socialShares" INTEGER DEFAULT 0;`;
    await prisma.$executeRaw`ALTER TABLE "Blog" ADD COLUMN IF NOT EXISTS "competitorRank" INTEGER;`;
    await prisma.$executeRaw`ALTER TABLE "Blog" ADD COLUMN IF NOT EXISTS "romanianMarketFit" DECIMAL(3,2);`;

    console.log("✅ Added Blog table columns");

    // Create indexes
    console.log("🔍 Creating indexes...");
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Product_ageGroup_idx" ON "Product"("ageGroup");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Product_stemDiscipline_idx" ON "Product"("stemDiscipline");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Blog_viralScore_idx" ON "Blog"("viralScore");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Blog_isPublished_updatedAt_idx" ON "Blog"("isPublished", "updatedAt");`;

    console.log("✅ Created indexes");

    console.log("\n🎉 All missing columns and indexes added successfully!");
    console.log("📊 Ready to seed products...");
  } catch (error) {
    console.error("❌ Error adding columns:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingColumns();
