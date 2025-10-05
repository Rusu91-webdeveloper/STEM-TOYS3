const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log("Starting GDPR compliance migration...");

    // Check if tables exist and create if needed
    try {
      // Check if ConsentLog table exists
      await prisma.$executeRaw`SELECT 1 FROM "ConsentLog" LIMIT 1;`;
      console.log("ConsentLog table already exists");
    } catch (error) {
      console.log("Creating ConsentLog table...");
      await prisma.$executeRaw`
        CREATE TABLE "ConsentLog" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "userId" TEXT NOT NULL,
          "action" TEXT NOT NULL,
          "consentType" TEXT NOT NULL,
          "consentGiven" BOOLEAN NOT NULL,
          "ipAddress" TEXT,
          "userAgent" TEXT,
          "consentDetails" JSONB,
          "validUntil" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "ConsentLog_pkey" PRIMARY KEY ("id")
        );
      `;

      // Create indexes for ConsentLog
      await prisma.$executeRaw`CREATE INDEX "ConsentLog_userId_idx" ON "ConsentLog"("userId");`;
      await prisma.$executeRaw`CREATE INDEX "ConsentLog_action_idx" ON "ConsentLog"("action");`;
      await prisma.$executeRaw`CREATE INDEX "ConsentLog_consentType_idx" ON "ConsentLog"("consentType");`;
      await prisma.$executeRaw`CREATE INDEX "ConsentLog_createdAt_idx" ON "ConsentLog"("createdAt");`;
      await prisma.$executeRaw`CREATE INDEX "ConsentLog_userId_consentType_idx" ON "ConsentLog"("userId", "consentType");`;

      // Add foreign key constraint
      await prisma.$executeRaw`
        ALTER TABLE "ConsentLog"
        ADD CONSTRAINT "ConsentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
      `;
    }

    // Check if GDPR columns exist in User table and add if needed
    try {
      await prisma.$executeRaw`SELECT "consentGiven" FROM "User" LIMIT 1;`;
      console.log("GDPR columns already exist");
    } catch (error) {
      console.log("Adding GDPR compliance columns to User table...");
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "consentGiven" BOOLEAN DEFAULT false;`;
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "consentDate" TIMESTAMP(3);`;
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "dataRetention" JSONB;`;
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "anonymized" BOOLEAN DEFAULT false;`;
    }

    // Create default data retention policies for existing users
    console.log("Setting up default GDPR compliance for existing users...");

    // For Romanian users (based on email domain or other heuristics), set consent as required
    await prisma.$executeRaw`
      UPDATE "User"
      SET
        "consentGiven" = false,
        "dataRetention" = '{"retentionPeriod": "7_years", "dataCategories": ["personal", "marketing", "analytics"], "gdprCompliant": true, "lastReview": "2025-01-01T00:00:00.000Z"}'::jsonb
      WHERE "consentGiven" = false OR "consentGiven" IS NULL;
    `;

    console.log("GDPR compliance migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
