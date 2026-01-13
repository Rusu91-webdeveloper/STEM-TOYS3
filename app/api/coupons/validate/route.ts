import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Validation schema for coupon validation
const validateCouponSchema = z.object({
  code: z.string().min(1),
  cartTotal: z.number().positive(),
});

// POST /api/coupons/validate - Validate a coupon code
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { code, cartTotal } = validateCouponSchema.parse(body);

    // Find the coupon
    const coupon = await db.coupon.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        _count: {
          select: {
            usages: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json(
        {
          isValid: false,
          error: "Invalid coupon code",
        },
        { status: 400 }
      );
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return NextResponse.json(
        {
          isValid: false,
          error: "This coupon is no longer active",
        },
        { status: 400 }
      );
    }

    // Get current time in UTC for consistent comparison
    const now = new Date();
    
    // Check if coupon has started (compare UTC timestamps)
    // Prisma DateTime fields are already Date objects in UTC
    if (coupon.startsAt) {
      const startsAt = coupon.startsAt instanceof Date 
        ? coupon.startsAt 
        : new Date(coupon.startsAt);
      
      // Debug logging for troubleshooting (remove in production if not needed)
      console.log(`[Coupon Validation] Code: ${coupon.code}`);
      console.log(`[Coupon Validation] Current time (UTC): ${now.toISOString()}`);
      console.log(`[Coupon Validation] Starts at (UTC): ${startsAt.toISOString()}`);
      console.log(`[Coupon Validation] Now < StartsAt: ${now < startsAt}`);
      
      if (now < startsAt) {
        const hoursUntilStart = Math.round((startsAt.getTime() - now.getTime()) / (1000 * 60 * 60));
        return NextResponse.json(
          {
            isValid: false,
            error: "This coupon is not yet available",
            debug: process.env.NODE_ENV === "development" ? {
              currentTime: now.toISOString(),
              startsAt: startsAt.toISOString(),
              hoursUntilStart,
              timeDiffMs: startsAt.getTime() - now.getTime(),
            } : undefined,
          },
          { status: 400 }
        );
      }
    }

    // Check if coupon has expired (compare UTC timestamps)
    if (coupon.expiresAt) {
      const expiresAt = coupon.expiresAt instanceof Date 
        ? coupon.expiresAt 
        : new Date(coupon.expiresAt);
      
      if (now > expiresAt) {
        return NextResponse.json(
          {
            isValid: false,
            error: "This coupon has expired",
          },
          { status: 400 }
        );
      }
    }

    // Check maximum uses
    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return NextResponse.json(
        {
          isValid: false,
          error: "This coupon has reached its usage limit",
        },
        { status: 400 }
      );
    }

    // Check maximum uses per user
    if (
      coupon.maxUsesPerUser &&
      coupon._count.usages >= coupon.maxUsesPerUser
    ) {
      return NextResponse.json(
        {
          isValid: false,
          error:
            "You have already used this coupon the maximum number of times",
        },
        { status: 400 }
      );
    }

    // Check minimum order value
    if (coupon.minimumOrderValue && cartTotal < coupon.minimumOrderValue) {
      return NextResponse.json(
        {
          isValid: false,
          error: `Minimum order value of ${coupon.minimumOrderValue} LEI required for this coupon`,
        },
        { status: 400 }
      );
    }

    // Calculate discount amount
    let discountAmount = 0;

    if (coupon.type === "PERCENTAGE") {
      discountAmount = (cartTotal * coupon.value) / 100;

      // Apply maximum discount limit for percentage coupons
      if (
        coupon.maxDiscountAmount &&
        discountAmount > coupon.maxDiscountAmount
      ) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      // Fixed amount discount
      discountAmount = Math.min(coupon.value, cartTotal);
    }

    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100;

    return NextResponse.json({
      isValid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
        discountAmount,
        isInfluencer: coupon.isInfluencer,
        influencerName: coupon.influencerName,
      },
      discountAmount,
      finalTotal: Math.max(0, cartTotal - discountAmount),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error validating coupon:", error);
    return NextResponse.json(
      { error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
