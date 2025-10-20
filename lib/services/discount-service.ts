import type { Coupon, User } from "@prisma/client";

import { db } from "@/lib/db";

export type SelectedDiscount = {
  selectedCoupon: Coupon;
  discountAmount: number;
  source: "welcome" | "manual";
};

export type WelcomeDiscountResult = {
  coupon: Coupon;
  discountAmount: number;
};

/**
 * Service to compute and select automatic discounts for users.
 * - Provides a 10% welcome discount for NEW users on their first order
 * - Prevents stacking: compares manual coupon vs welcome discount and selects the best single option
 */
export class AutoDiscountService {
  static readonly WELCOME_COUPON_CODE = "WELCOME_NEW_USER_10";

  /** Get the welcome coupon record if it exists and is active */
  static async getWelcomeCoupon(): Promise<Coupon | null> {
    const coupon = await db.coupon.findUnique({
      where: { code: AutoDiscountService.WELCOME_COUPON_CODE },
    });

    if (!coupon || !coupon.isActive) return null;

    const now = new Date();
    const isValidTime =
      (!coupon.startsAt || now >= coupon.startsAt) &&
      (!coupon.expiresAt || now <= coupon.expiresAt);
    if (!isValidTime) return null;

    return coupon;
  }

  /** Calculate discount amount for a given coupon and subtotal */
  static calculateDiscountAmount(coupon: Coupon, subtotal: number): number {
    let amount = 0;
    if (coupon.type === "PERCENTAGE") {
      amount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscountAmount && amount > coupon.maxDiscountAmount) {
        amount = coupon.maxDiscountAmount;
      }
    } else {
      amount = Math.min(coupon.value, subtotal);
    }
    // Round to 2 decimals
    return Math.round(amount * 100) / 100;
  }

  /**
   * Determine if a user is eligible for the welcome discount and compute its amount.
   */
  static async getNewUserDiscount(
    userId: string,
    subtotal: number
  ): Promise<WelcomeDiscountResult | null> {
    if (!userId) return null;

    const [user, welcomeCoupon] = await Promise.all([
      db.user.findUnique({ where: { id: userId } }),
      this.getWelcomeCoupon(),
    ]);

    if (!user || !welcomeCoupon) return null;

    // Only NEW segment users are eligible
    if (user.segment !== "NEW") return null;

    // Check per-user usage
    const usageCount = await db.couponUsage.count({
      where: { userId, couponId: welcomeCoupon.id },
    });

    if (
      welcomeCoupon.maxUsesPerUser &&
      usageCount >= welcomeCoupon.maxUsesPerUser
    ) {
      return null;
    }

    // Minimum order value
    if (
      welcomeCoupon.minimumOrderValue &&
      subtotal < welcomeCoupon.minimumOrderValue
    ) {
      return null;
    }

    const discountAmount = this.calculateDiscountAmount(
      welcomeCoupon,
      subtotal
    );
    if (discountAmount <= 0) return null;

    return { coupon: welcomeCoupon, discountAmount };
  }

  /** Compare manual coupon vs welcome discount and select the better one */
  static compareDiscounts(
    welcome: WelcomeDiscountResult | null,
    manualCoupon: Coupon | null,
    subtotal: number
  ): SelectedDiscount | null {
    if (!welcome && !manualCoupon) return null;

    if (welcome && !manualCoupon) {
      return {
        selectedCoupon: welcome.coupon,
        discountAmount: welcome.discountAmount,
        source: "welcome",
      };
    }

    if (!welcome && manualCoupon) {
      const manualAmount = this.calculateDiscountAmount(manualCoupon, subtotal);
      if (manualAmount <= 0) return null;
      return {
        selectedCoupon: manualCoupon,
        discountAmount: manualAmount,
        source: "manual",
      };
    }

    // Both exist → pick higher savings
    const manualAmount = manualCoupon
      ? this.calculateDiscountAmount(manualCoupon, subtotal)
      : 0;
    const welcomeAmount = welcome ? welcome.discountAmount : 0;

    if (manualAmount > welcomeAmount) {
      return {
        selectedCoupon: manualCoupon as Coupon,
        discountAmount: manualAmount,
        source: "manual",
      };
    }

    return {
      selectedCoupon: (welcome as WelcomeDiscountResult).coupon,
      discountAmount: welcomeAmount,
      source: "welcome",
    };
  }
}
