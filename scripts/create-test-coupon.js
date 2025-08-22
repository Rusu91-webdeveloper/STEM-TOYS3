const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createTestCoupon() {
  try {
    console.log("===== CREATING TEST COUPON FOR POPUP =====");

    // First, find an admin user to assign as the creator
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true, email: true },
    });

    if (!adminUser) {
      console.error(
        "❌ No admin user found. Please create an admin user first."
      );
      return;
    }

    console.log(`Using admin user: ${adminUser.email}`);

    // Check if test coupon already exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: "WELCOME20" },
    });

    if (existingCoupon) {
      console.log("✅ Test coupon 'WELCOME20' already exists");
      console.log(
        `Coupon details: ${existingCoupon.name} - ${existingCoupon.value}% off`
      );
      console.log(
        `Active: ${existingCoupon.isActive}, Show as popup: ${existingCoupon.showAsPopup}`
      );
      return;
    }

    // Create a test coupon that will show as popup
    const testCoupon = await prisma.coupon.create({
      data: {
        code: "WELCOME20",
        name: "Welcome Discount",
        description: "Special welcome discount for new customers",
        type: "PERCENTAGE",
        value: 20, // 20% off
        minimumOrderValue: 50, // Minimum 50 LEI order
        maxDiscountAmount: 100, // Maximum 100 LEI discount
        isActive: true,
        showAsPopup: true, // This is the key field for popup display
        popupPriority: 10, // High priority
        startsAt: new Date(), // Start immediately
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Expire in 30 days
        createdBy: adminUser.id,
      },
    });

    console.log("✅ Test coupon created successfully!");
    console.log(`Code: ${testCoupon.code}`);
    console.log(`Name: ${testCoupon.name}`);
    console.log(`Value: ${testCoupon.value}% off`);
    console.log(`Minimum order: ${testCoupon.minimumOrderValue} LEI`);
    console.log(`Expires: ${testCoupon.expiresAt.toLocaleDateString()}`);
    console.log(`Show as popup: ${testCoupon.showAsPopup}`);
    console.log(`Popup priority: ${testCoupon.popupPriority}`);

    console.log("\n🎉 The coupon popup should now appear on your home page!");
    console.log("💡 If you don't see it, try:");
    console.log("   1. Clear your browser's session storage");
    console.log("   2. Open the site in an incognito/private window");
    console.log("   3. Wait 2.5 seconds for the popup to appear");
  } catch (error) {
    console.error("❌ Error creating test coupon:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createTestCoupon();
