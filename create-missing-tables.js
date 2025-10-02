require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createMissingTables() {
  console.log("🔧 Creating missing database tables...\n");

  try {
    // Drop existing tables if they exist with wrong structure
    await prisma.$executeRaw`DROP TABLE IF EXISTS "EmailTemplate" CASCADE;`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "ImageMetadata" CASCADE;`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "ImageProcessingLog" CASCADE;`;

    console.log("🗑️  Dropped existing tables");

    // Execute raw SQL to create missing tables with correct structure
    await prisma.$executeRaw`
      -- Create EmailTemplate table
      CREATE TABLE "EmailTemplate" (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          name TEXT NOT NULL,
          slug TEXT UNIQUE,
          subject TEXT,
          content TEXT,
          variables TEXT[] DEFAULT '{}',
          category TEXT,
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "createdBy" TEXT,
          metadata JSONB
      );
    `;

    console.log("✅ Created EmailTemplate table");

    await prisma.$executeRaw`
      -- Create ImageMetadata table
      CREATE TABLE "ImageMetadata" (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "originalUrl" TEXT NOT NULL,
          filename TEXT NOT NULL,
          "fileSize" INTEGER NOT NULL,
          width INTEGER,
          height INTEGER,
          format TEXT NOT NULL,
          "uploadedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "processedSizes" JSONB,
          "optimizationStats" JSONB,
          tags TEXT[] DEFAULT '{}',
          alt TEXT,
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "productId" TEXT,
          "blogId" TEXT,
          "blogContentId" TEXT
      );
    `;

    console.log("✅ Created ImageMetadata table");

    await prisma.$executeRaw`
      -- Create ImageProcessingLog table
      CREATE TABLE "ImageProcessingLog" (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "imageId" TEXT NOT NULL,
          operation TEXT NOT NULL,
          status TEXT NOT NULL,
          details JSONB,
          "startedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "completedAt" TIMESTAMP WITH TIME ZONE,
          "errorMessage" TEXT
      );
    `;

    console.log("✅ Created ImageProcessingLog table");

    console.log("\n🎉 All missing tables created successfully!");
    console.log("📊 Ready to seed data...");
  } catch (error) {
    console.error("❌ Error creating tables:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingTables();
