import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { withErrorHandler } from "@/lib/api-error-handler";

interface UserStats {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  favoriteCategory: string;
  accountLevel: {
    current: string;
    progress: number;
    nextLevel: string;
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
  } else {
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
}

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    try {
      // Get user's completed orders
      const orders = await db.order.findMany({
        where: {
          userId,
          status: {
            in: ["COMPLETED", "DELIVERED", "SHIPPED"],
          },
        },
        include: {
          orderItems: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });

      // Calculate basic statistics
      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

      // Calculate favorite category
      const categoryPurchases: Record<string, number> = {};
      orders.forEach(order => {
        order.orderItems.forEach(item => {
          if (item.product.category) {
            const categoryName = item.product.category.name;
            categoryPurchases[categoryName] =
              (categoryPurchases[categoryName] || 0) + item.quantity;
          }
        });
      });

      const favoriteCategory =
        Object.keys(categoryPurchases).length > 0
          ? Object.entries(categoryPurchases).sort(
              ([, a], [, b]) => b - a
            )[0][0]
          : "Science Kits";

      // Calculate account level
      const accountLevel = calculateAccountLevel(totalSpent);

      // Calculate loyalty points (simplified: 1 point per $1 spent)
      const loyaltyPoints = Math.floor(totalSpent);

      // Calculate savings from discounts (mock calculation)
      const savedOnDiscounts = totalSpent * 0.15; // Assume average 15% savings

      const userStats: UserStats = {
        totalOrders,
        totalSpent,
        averageOrderValue,
        favoriteCategory,
        accountLevel,
        loyaltyPoints,
        savedOnDiscounts,
      };

      return NextResponse.json(userStats);
    } catch (error) {
      console.error("Error fetching user dashboard stats:", error);
      return NextResponse.json(
        { error: "Failed to fetch dashboard statistics" },
        { status: 500 }
      );
    }
  });
}
