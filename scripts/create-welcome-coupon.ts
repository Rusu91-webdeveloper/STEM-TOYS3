/**
 * Seed a system welcome coupon for NEW users (auto-applied, one-time use per user)
 * Run: pnpm tsx scripts/create-welcome-coupon.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const CODE = "WELCOME_NEW_USER_10";

  console.log(`\n🌱 Ensuring welcome coupon exists: ${CODE}\n`);

  // Find or create a system admin to attribute coupon creation
  const systemAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!systemAdmin) {
    throw new Error("No ADMIN user found. Please create an admin user first.");
  }

  const existing = await prisma.coupon.findUnique({ where: { code: CODE } });
  if (existing) {
    console.log(
      "✅ Welcome coupon already exists. Updating settings if needed..."
    );
    await prisma.coupon.update({
      where: { id: existing.id },
      data: {
        type: "PERCENTAGE",
        value: 10,
        isActive: true,
        maxUsesPerUser: 1,
        minimumOrderValue: null,
        name: "Welcome Discount 10% (Auto)",
        description: "Automatic 10% discount for first order of NEW users",
      },
    });
    console.log("🔧 Updated welcome coupon configuration.");
  } else {
    await prisma.coupon.create({
      data: {
        code: CODE,
        name: "Welcome Discount 10% (Auto)",
        description: "Automatic 10% discount for first order of NEW users",
        type: "PERCENTAGE",
        value: 10,
        isActive: true,
        maxUsesPerUser: 1,
        createdBy: systemAdmin.id,
      },
    });
    console.log("✅ Created welcome coupon.");
  }

  console.log("\n✨ Done.\n");
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
