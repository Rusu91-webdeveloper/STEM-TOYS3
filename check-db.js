const { PrismaClient } = require("@prisma/client");

async function checkDatabase() {
  const prisma = new PrismaClient();

  try {
    console.log("🔍 Checking database connection...");

    // Test basic connection
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    // Check coupon count
    const couponCount = await prisma.coupon.count();
    console.log(`📊 Coupons in database: ${couponCount}`);

    // Check for popup coupons
    const popupCoupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        showAsPopup: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
        showAsPopup: true,
        startsAt: true,
        expiresAt: true,
      },
    });

    console.log(`🎯 Popup coupons found: ${popupCoupons.length}`);
    if (popupCoupons.length > 0) {
      console.log("Popup coupons:", popupCoupons);
    }
  } catch (error) {
    console.error("❌ Database error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
