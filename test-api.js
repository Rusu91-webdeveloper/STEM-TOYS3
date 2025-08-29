const { PrismaClient } = require("@prisma/client");

async function testApiDirectly() {
  const prisma = new PrismaClient();

  try {
    console.log("🔍 Testing API logic directly...");

    const now = new Date();
    console.log("🕐 Current time:", now.toISOString());

    // Find active coupons that should be shown as popup
    const promotionalCoupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        showAsPopup: true,
        AND: [
          {
            OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          },
          {
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        ],
      },
      orderBy: [{ popupPriority: "desc" }, { createdAt: "desc" }],
      take: 1, // Only return the highest priority coupon
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        type: true,
        value: true,
        image: true,
        minimumOrderValue: true,
        maxDiscountAmount: true,
        expiresAt: true,
        isInfluencer: true,
        influencerName: true,
        popupPriority: true,
      },
    });

    console.log("✅ Found popup coupons:", promotionalCoupons.length);

    if (promotionalCoupons.length > 0) {
      const coupon = promotionalCoupons[0];
      console.log("🎉 Selected coupon:", coupon.name, `(${coupon.code})`);

      // Format the response
      const formattedCoupon = {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
        image: coupon.image,
        minimumOrderValue: coupon.minimumOrderValue,
        maxDiscountAmount: coupon.maxDiscountAmount,
        expiresAt: coupon.expiresAt,
        isInfluencer: coupon.isInfluencer,
        influencerName: coupon.influencerName,
        popupPriority: coupon.popupPriority,
        discountText: {
          en:
            coupon.type === "PERCENTAGE"
              ? `${coupon.value}% OFF`
              : `${coupon.value} LEI OFF`,
          ro:
            coupon.type === "PERCENTAGE"
              ? `${coupon.value}% REDUCERE`
              : `${coupon.value} LEI REDUCERE`,
        },
        expiryText: coupon.expiresAt
          ? {
              en: `Expires: ${coupon.expiresAt.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}`,
              ro: `Expiră: ${coupon.expiresAt.toLocaleDateString("ro-RO", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}`,
            }
          : null,
        minOrderText: coupon.minimumOrderValue
          ? {
              en: `Minimum order: ${coupon.minimumOrderValue} LEI`,
              ro: `Comandă minimum: ${coupon.minimumOrderValue} LEI`,
            }
          : null,
      };

      console.log(
        "📤 Formatted coupon:",
        JSON.stringify(formattedCoupon, null, 2)
      );
    } else {
      console.log("❌ No promotional coupons found");
    }
  } catch (error) {
    console.error("❌ Error testing API:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiDirectly();
