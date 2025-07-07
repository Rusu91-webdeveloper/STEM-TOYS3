import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

// GET /api/coupons/popup - Get active promotional coupons for popup display
export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const excludeViewed = searchParams.get("excludeViewed");

    const now = new Date();

    console.log("🔍 [COUPON POPUP] Searching for popup coupons...");
    console.log("🕐 [COUPON POPUP] Current time:", now.toISOString());

    // Find active coupons that should be shown as popup
    const promotionalCoupons = await db.coupon.findMany({
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

    console.log(
      "✅ [COUPON POPUP] Found popup coupons:",
      promotionalCoupons.length
    );

    if (promotionalCoupons.length === 0) {
      console.log(
        "❌ [COUPON POPUP] No promotional coupons found that meet criteria"
      );
      console.log("🔍 [COUPON POPUP] Required criteria:");
      console.log("   - isActive: true");
      console.log("   - showAsPopup: true");
      console.log("   - startsAt: null OR <= now");
      console.log("   - expiresAt: null OR > now");
      return NextResponse.json({ coupon: null });
    }

    const coupon = promotionalCoupons[0];
    console.log(
      "🎉 [COUPON POPUP] Selected coupon:",
      coupon.name,
      `(${coupon.code})`
    );

    // Format the response with bilingual text keys
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
      // Bilingual text will be handled by the client-side component
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
      "📤 [COUPON POPUP] Returning formatted coupon:",
      formattedCoupon.discountText
    );
    return NextResponse.json({ coupon: formattedCoupon });
  } catch (error) {
    console.error(
      "❌ [COUPON POPUP] Error fetching promotional coupon:",
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch promotional coupon" },
      { status: 500 }
    );
  }
}
