import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { AutoDiscountService } from "@/lib/services/discount-service";

/**
 * GET /api/checkout/auto-discount
 * Check if the current user is eligible for automatic discounts (e.g., welcome discount for new users)
 * Returns the discount information if eligible, null otherwise
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get cart total from query parameter
    const searchParams = request.nextUrl.searchParams;
    const cartTotal = parseFloat(searchParams.get("cartTotal") || "0");

    if (cartTotal <= 0) {
      return NextResponse.json(
        { error: "Invalid cart total" },
        { status: 400 }
      );
    }

    // Check for welcome discount eligibility
    const welcomeDiscount = await AutoDiscountService.getNewUserDiscount(
      user.id,
      cartTotal
    );

    if (!welcomeDiscount) {
      return NextResponse.json({
        eligible: false,
        discount: null,
      });
    }

    return NextResponse.json({
      eligible: true,
      discount: {
        coupon: {
          id: welcomeDiscount.coupon.id,
          code: welcomeDiscount.coupon.code,
          name: welcomeDiscount.coupon.name,
          description: welcomeDiscount.coupon.description,
          type: welcomeDiscount.coupon.type,
          value: welcomeDiscount.coupon.value,
        },
        discountAmount: welcomeDiscount.discountAmount,
        source: "welcome",
      },
    });
  } catch (error) {
    console.error("Error checking auto discount:", error);
    return NextResponse.json(
      {
        error: "Failed to check automatic discount",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

