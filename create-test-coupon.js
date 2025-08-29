const { PrismaClient } = require("@prisma/client");

async function createTestCoupon() {
  const prisma = new PrismaClient();

  try {
    console.log("🔍 Creating test coupon...");

    // First, get an admin user to create the coupon
    const adminUser = await prisma.user.findFirst({
      where: {
        role: "ADMIN",
      },
    });

    if (!adminUser) {
      console.log("❌ No admin user found. Creating one...");
      const newAdmin = await prisma.user.create({
        data: {
          name: "Test Admin",
          email: "admin@test.com",
          password: "hashedpassword", // In real app, this would be properly hashed
          role: "ADMIN",
          isActive: true,
        },
      });
      console.log("✅ Created admin user:", newAdmin.id);
    }

    const adminId =
      adminUser?.id ||
      (await prisma.user.findFirst({ where: { role: "ADMIN" } })).id;

    // Create a test coupon
    const testCoupon = await prisma.coupon.create({
      data: {
        code: "TESTPOPUP10",
        name: "Test Popup Coupon",
        description: "A test coupon for popup functionality",
        type: "PERCENTAGE",
        value: 10,
        minimumOrderValue: 50,
        maxDiscountAmount: 20,
        isActive: true,
        showAsPopup: true,
        popupPriority: 1,
        createdBy: adminId,
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    console.log("✅ Test coupon created:", testCoupon);
    console.log("🎯 Coupon code:", testCoupon.code);
    console.log("📊 Popup enabled:", testCoupon.showAsPopup);
  } catch (error) {
    console.error("❌ Error creating test coupon:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestCoupon();
