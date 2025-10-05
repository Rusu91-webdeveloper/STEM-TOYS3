const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log("Starting multi-tenant architecture migration...");

    // Check if tables exist and create if needed
    console.log("Checking if multi-tenant tables exist...");

    try {
      // Check if Tenant table exists
      await prisma.$executeRaw`SELECT 1 FROM "Tenant" LIMIT 1;`;
      console.log("Tenant table already exists");
    } catch (error) {
      console.log("Creating Tenant table...");
      await prisma.$executeRaw`
        CREATE TABLE "Tenant" (
          "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "name" TEXT NOT NULL,
          "slug" TEXT UNIQUE NOT NULL,
          "description" TEXT,
          "logo" TEXT,
          "domain" TEXT UNIQUE,
          "isActive" BOOLEAN DEFAULT true,
          "settings" JSONB,
          "limits" JSONB,
          "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Create indexes for Tenant
      await prisma.$executeRaw`CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");`;
      await prisma.$executeRaw`CREATE INDEX "Tenant_isActive_idx" ON "Tenant"("isActive");`;
    }

    try {
      // Check if Organization table exists
      await prisma.$executeRaw`SELECT 1 FROM "Organization" LIMIT 1;`;
      console.log("Organization table already exists");
    } catch (error) {
      console.log("Creating Organization table...");
      await prisma.$executeRaw`
        CREATE TABLE "Organization" (
          "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "name" TEXT NOT NULL,
          "slug" TEXT UNIQUE NOT NULL,
          "description" TEXT,
          "logo" TEXT,
          "domain" TEXT UNIQUE,
          "tenantId" TEXT NOT NULL,
          "isActive" BOOLEAN DEFAULT true,
          "settings" JSONB,
          "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
        );
      `;

      // Create indexes for Organization
      await prisma.$executeRaw`CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");`;
      await prisma.$executeRaw`CREATE INDEX "Organization_tenantId_idx" ON "Organization"("tenantId");`;
      await prisma.$executeRaw`CREATE INDEX "Organization_isActive_idx" ON "Organization"("isActive");`;
    }

    // Check if tenantId column exists in User table
    try {
      await prisma.$executeRaw`SELECT "tenantId" FROM "User" LIMIT 1;`;
      console.log("tenantId column already exists");
    } catch (error) {
      console.log("Adding tenantId column to User table...");
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "tenantId" TEXT;`;
    }

    // Check if organizationId column exists in User table
    try {
      await prisma.$executeRaw`SELECT "organizationId" FROM "User" LIMIT 1;`;
      console.log("organizationId column already exists");
    } catch (error) {
      console.log("Adding organizationId column to User table...");
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "organizationId" TEXT;`;
    }

    // Create User multi-tenant indexes if they don't exist
    try {
      await prisma.$executeRaw`SELECT 1 FROM pg_indexes WHERE indexname = 'User_tenantId_idx';`;
    } catch (error) {
      await prisma.$executeRaw`CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");`;
      await prisma.$executeRaw`CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");`;
      await prisma.$executeRaw`CREATE INDEX "User_tenantId_isActive_idx" ON "User"("tenantId", "isActive");`;
      await prisma.$executeRaw`CREATE INDEX "User_organizationId_isActive_idx" ON "User"("organizationId", "isActive");`;
      await prisma.$executeRaw`CREATE INDEX "User_tenantId_role_idx" ON "User"("tenantId", "role");`;
      await prisma.$executeRaw`CREATE INDEX "User_organizationId_role_idx" ON "User"("organizationId", "role");`;
    }

    // Create default tenant for existing users
    console.log("Creating default tenant and migrating existing users...");
    const defaultTenant = await prisma.tenant.upsert({
      where: { slug: "default" },
      update: {},
      create: {
        name: "Default Tenant",
        slug: "default",
        description: "Default tenant for existing users",
        isActive: true,
      },
    });

    // Migrate existing users to default tenant
    await prisma.$executeRaw`
      UPDATE "User"
      SET "tenantId" = ${defaultTenant.id}
      WHERE "tenantId" IS NULL;
    `;

    console.log("Migration completed successfully!");
    console.log(`Created default tenant with ID: ${defaultTenant.id}`);
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
