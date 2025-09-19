import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getCached } from "@/lib/cache";

// GET /api/coupons/popup - Get active promotional coupons for popup display
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const searchParams = new URL(request.url).searchParams;
    const excludeViewed = searchParams.get("excludeViewed");

    const now = new Date();

    // **PERFORMANCE**: Reduce logging in production
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 [COUPON POPUP] Searching for popup coupons...");
      console.log("🕐 [COUPON POPUP] Current time:", now.toISOString());
    }

    // **PERFORMANCE**: Use caching to avoid repeated database queries
    const cacheKey = "popup_coupons_active";
    const promotionalCoupons = await getCached(
      cacheKey,
      () =>
        db.coupon.findMany({
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
        }),
      5 * 60 * 1000 // Cache for 5 minutes
    );

    // **PERFORMANCE**: Reduce logging in production
    if (process.env.NODE_ENV === "development") {
      console.log(
        "✅ [COUPON POPUP] Found popup coupons:",
        promotionalCoupons.length
      );
    }

    if (promotionalCoupons.length === 0) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          "❌ [COUPON POPUP] No promotional coupons found that meet criteria"
        );
        console.log("🔍 [COUPON POPUP] Required criteria:");
        console.log("   - isActive: true");
        console.log("   - showAsPopup: true");
        console.log("   - startsAt: null OR <= now");
        console.log("   - expiresAt: null OR > now");
      }

      // **PERFORMANCE**: Add performance headers
      const response = NextResponse.json({ coupon: null });
      response.headers.set("X-Response-Time", `${Date.now() - startTime}ms`);
      return response;
    }

    const coupon = promotionalCoupons[0];

    // **PERFORMANCE**: Reduce logging in production
    if (process.env.NODE_ENV === "development") {
      console.log(
        "🎉 [COUPON POPUP] Selected coupon:",
        coupon.name,
        `(${coupon.code})`
      );
    }

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

    // **PERFORMANCE**: Reduce logging in production
    if (process.env.NODE_ENV === "development") {
      console.log(
        "📤 [COUPON POPUP] Returning formatted coupon:",
        formattedCoupon.discountText
      );
    }

    // **PERFORMANCE**: Add performance headers and cache control
    const response = NextResponse.json({ coupon: formattedCoupon });
    response.headers.set("X-Response-Time", `${Date.now() - startTime}ms`);
    response.headers.set("Cache-Control", "public, max-age=300, s-maxage=300"); // Cache for 5 minutes
    return response;
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
