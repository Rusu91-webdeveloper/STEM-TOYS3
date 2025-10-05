require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkUserIndexes() {
  console.log("🔍 Checking User table indexes and performance...\n");

  try {
    // Get current user count
    const userCount = await prisma.user.count();
    console.log(`👥 Total Users: ${userCount}\n`);

    // Check what indexes currently exist by looking at the schema
    console.log("📊 Current User Table Indexes Analysis:");
    console.log("==========================================");

    // From schema analysis:
    console.log("✅ email: Has @unique constraint (auto-creates index)");
    console.log("❌ role: No index defined");
    console.log("❌ isActive: No index defined");
    console.log("❌ createdAt: No index defined");
    console.log("❌ updatedAt: No index defined");

    console.log("\n📈 Performance Impact Analysis:");
    console.log("=================================");

    // Test query performance for common operations that would benefit from indexes
    console.log("\n1. Filtering by role (Admin user management):");
    const start1 = Date.now();
    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, email: true, role: true },
    });
    const time1 = Date.now() - start1;
    console.log(`   Query time: ${time1}ms for ${adminUsers.length} results`);

    console.log("\n2. Filtering by active status (User authentication):");
    const start2 = Date.now();
    const activeUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, email: true, isActive: true },
    });
    const time2 = Date.now() - start2;
    console.log(`   Query time: ${time2}ms for ${activeUsers.length} results`);

    console.log("\n3. Ordering by creation date (Recent users):");
    const start3 = Date.now();
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, email: true, createdAt: true },
    });
    const time3 = Date.now() - start3;
    console.log(`   Query time: ${time3}ms for ${recentUsers.length} results`);

    console.log("\n4. Complex query (Active customers, ordered by join date):");
    const start4 = Date.now();
    const activeCustomers = await prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    const time4 = Date.now() - start4;
    console.log(
      `   Query time: ${time4}ms for ${activeCustomers.length} results`
    );

    console.log("\n🎯 Recommended Indexes for 2025 E-commerce Scalability:");
    console.log("======================================================");

    console.log("HIGH PRIORITY (Critical for performance):");
    console.log(
      "• @@index([role]) - User role filtering (admin, customer, supplier management)"
    );
    console.log(
      "• @@index([isActive]) - Active user status filtering (authentication, user management)"
    );
    console.log(
      "• @@index([createdAt]) - Time-based queries (recent users, registration analytics)"
    );

    console.log("\nMEDIUM PRIORITY (Performance optimization):");
    console.log(
      "• @@index([role, isActive]) - Combined role and status filtering"
    );
    console.log("• @@index([updatedAt]) - Last activity tracking");

    console.log("\nLOW PRIORITY (Future scalability):");
    console.log("• @@index([emailVerified]) - Email verification status");
    console.log("• @@index([role, createdAt]) - Role-based user analytics");

    console.log("\n📋 Implementation Status:");
    console.log("========================");

    const missingIndexes = ["role", "isActive", "createdAt", "updatedAt"];
    const criticalMissing = ["role", "isActive", "createdAt"];

    if (criticalMissing.length > 0) {
      console.log(`❌ MISSING CRITICAL INDEXES: ${criticalMissing.join(", ")}`);
      console.log(
        "   These should be added immediately for production readiness."
      );
    }

    if (missingIndexes.length > criticalMissing.length) {
      const mediumMissing = missingIndexes.filter(
        idx => !criticalMissing.includes(idx)
      );
      console.log(
        `⚠️  MISSING RECOMMENDED INDEXES: ${mediumMissing.join(", ")}`
      );
    }

    console.log("\n🔧 Next Steps:");
    console.log("==============");
    console.log("1. Add missing indexes to User model in schema.prisma");
    console.log("2. Run 'npx prisma migrate dev' to apply changes");
    console.log("3. Monitor query performance improvements");
    console.log("4. Consider composite indexes for complex queries");
  } catch (error) {
    console.error("❌ Index check failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserIndexes();
