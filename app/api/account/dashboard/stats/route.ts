import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/api-error-handler";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface UserStats {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  favoriteCategory: string;
  accountLevel: {
    current: string;
    progress: number;
    nextLevel: string | null;
    benefitsUnlocked: string[];
  };
  loyaltyPoints: number;
  savedOnDiscounts: number;
}

// Account level thresholds (based on total spent)
const ACCOUNT_LEVELS = {
  bronze: { min: 0, max: 299.99, benefits: ["Basic Support"] },
  silver: {
    min: 300,
    max: 749.99,
    benefits: ["Free Shipping", "Early Access"],
  },
  gold: {
    min: 750,
    max: 1499.99,
    benefits: ["Free Shipping", "Early Access", "Member Discounts"],
  },
  platinum: {
    min: 1500,
    max: Infinity,
    benefits: [
      "Free Shipping",
      "Early Access",
      "Member Discounts",
      "Priority Support",
    ],
  },
};

function calculateAccountLevel(totalSpent: number) {
  if (totalSpent >= ACCOUNT_LEVELS.platinum.min) {
    return {
      current: "platinum",
      progress: 100,
      nextLevel: null,
      benefitsUnlocked: ACCOUNT_LEVELS.platinum.benefits,
    };
  } else if (totalSpent >= ACCOUNT_LEVELS.gold.min) {
    const progress = Math.min(
      100,
      ((totalSpent - ACCOUNT_LEVELS.gold.min) /
        (ACCOUNT_LEVELS.platinum.min - ACCOUNT_LEVELS.gold.min)) *
        100
    );
    return {
      current: "gold",
      progress: Math.round(progress),
      nextLevel: "platinum",
      benefitsUnlocked: ACCOUNT_LEVELS.gold.benefits,
    };
  } else if (totalSpent >= ACCOUNT_LEVELS.silver.min) {
    const progress = Math.min(
      100,
      ((totalSpent - ACCOUNT_LEVELS.silver.min) /
        (ACCOUNT_LEVELS.gold.min - ACCOUNT_LEVELS.silver.min)) *
        100
    );
    return {
      current: "silver",
      progress: Math.round(progress),
      nextLevel: "gold",
      benefitsUnlocked: ACCOUNT_LEVELS.silver.benefits,
    };
  }
  const progress = Math.min(
    100,
    (totalSpent / ACCOUNT_LEVELS.silver.min) * 100
  );
  return {
    current: "bronze",
    progress: Math.round(progress),
    nextLevel: "silver",
    benefitsUnlocked: ACCOUNT_LEVELS.bronze.benefits,
  };
}

// eslint-disable-next-line require-await
export async function GET(_request: NextRequest) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    const userId = session.user.id;
    // Use Prisma aggregates for stats
    const [orderAgg, favoriteAgg] = await Promise.all([
      db.order.aggregate({
        where: {
          userId,
          status: { in: ["COMPLETED", "DELIVERED", "SHIPPED"] },
        },
        _sum: { total: true },
        _count: { _all: true },
      }),
      db.orderItem.groupBy({
        by: ["productId"],
        where: { order: { userId } },
        _sum: { quantity: true },
      }),
    ]);
    const totalOrders = orderAgg._count._all;
    const totalSpent = orderAgg._sum.total || 0;
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    // Find favorite category by most purchased product
    let favoriteCategory = "Science Kits";
    if (favoriteAgg.length > 0) {
      const topProductId = favoriteAgg.sort(
        (a, b) => (b._sum.quantity || 0) - (a._sum.quantity || 0)
      )[0].productId;
      const topProduct = await db.product.findUnique({
        where: { id: topProductId },
        select: { category: { select: { name: true } } },
      });
      if (topProduct?.category?.name)
        favoriteCategory = topProduct.category.name;
    }
    // Loyalty points and savings (mock)
    const loyaltyPoints = Math.floor(totalSpent);
    const savedOnDiscounts = totalSpent * 0.15;
    // Account level (mock)
    const accountLevel = calculateAccountLevel(totalSpent);
    return NextResponse.json({
      totalOrders,
      totalSpent,
      averageOrderValue,
      favoriteCategory,
      accountLevel,
      loyaltyPoints,
      savedOnDiscounts,
    });
  });
}
