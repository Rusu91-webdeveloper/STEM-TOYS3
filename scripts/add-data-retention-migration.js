const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log("Starting data retention policy migration...");

    // Check if DataRetentionPolicy table exists
    try {
      await prisma.$executeRaw`SELECT 1 FROM "DataRetentionPolicy" LIMIT 1;`;
      console.log("DataRetentionPolicy table already exists");
    } catch (error) {
      console.log("Creating DataRetentionPolicy table...");
      await prisma.$executeRaw`
        CREATE TABLE "DataRetentionPolicy" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "category" TEXT NOT NULL,
          "retentionPeriod" INTEGER NOT NULL,
          "autoDelete" BOOLEAN NOT NULL DEFAULT true,
          "description" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "DataRetentionPolicy_pkey" PRIMARY KEY ("id")
        );
      `;

      // Create indexes
      await prisma.$executeRaw`CREATE UNIQUE INDEX "DataRetentionPolicy_category_key" ON "DataRetentionPolicy"("category");`;
      await prisma.$executeRaw`CREATE INDEX "DataRetentionPolicy_category_idx" ON "DataRetentionPolicy"("category");`;
      await prisma.$executeRaw`CREATE INDEX "DataRetentionPolicy_autoDelete_idx" ON "DataRetentionPolicy"("autoDelete");`;

      console.log("DataRetentionPolicy table created successfully");
    }

    // Create default retention policies
    console.log("Creating default retention policies...");

    const defaultPolicies = [
      {
        category: "personal_data",
        retentionPeriod: 2555, // 7 years
        autoDelete: false, // Manual review required for GDPR compliance
        description:
          "Personal data retention under GDPR Article 17 - Right to erasure",
      },
      {
        category: "marketing_data",
        retentionPeriod: 1095, // 3 years
        autoDelete: true,
        description:
          "Marketing data retention for analytics and campaign optimization",
      },
      {
        category: "analytics_data",
        retentionPeriod: 730, // 2 years
        autoDelete: true,
        description: "Analytics and performance data for business intelligence",
      },
      {
        category: "logs",
        retentionPeriod: 365, // 1 year
        autoDelete: true,
        description: "System logs, audit trails, and security event logs",
      },
    ];

    for (const policy of defaultPolicies) {
      await prisma.dataRetentionPolicy.upsert({
        where: { category: policy.category },
        update: policy,
        create: policy,
      });
    }

    console.log("Default retention policies created successfully");

    console.log("Data retention policy migration completed successfully!");
    console.log(
      "Note: User data retention settings can be updated manually or through admin interface."
    );
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
