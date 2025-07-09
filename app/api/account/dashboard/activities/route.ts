import { NextRequest, NextResponse } from "next/server";
import { Wishlist, Product } from "@prisma/client";

import { withErrorHandler } from "@/lib/api-error-handler";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface Activity {
  id: string;
  type: "order" | "review" | "wishlist" | "account";
  title: string;
  description: string;
  date: string;
  status?: "success" | "warning" | "info";
  metadata?: Record<string, any>;
}

// Define a type for wishlist items with the nested product
type WishlistItemWithProduct = Wishlist & {
  product: Pick<Product, "name">;
};

export const GET = withErrorHandler(async (_request: NextRequest) => {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  try {
    const activities: Activity[] = [];

    // Get recent orders
    const recentOrders = await db.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Add order activities
    recentOrders.forEach(order => {
      let status: "success" | "warning" | "info" = "info";
      let title = "";
      let description = "";

      switch (order.status) {
        case "DELIVERED":
          status = "success";
          title = "Order Delivered";
          description = `Order #${order.orderNumber} was delivered successfully`;
          break;
        case "SHIPPED":
          status = "info";
          title = "Order Shipped";
          description = `Order #${order.orderNumber} is on its way`;
          break;
        case "PROCESSING":
          status = "info";
          title = "Order Processing";
          description = `Order #${order.orderNumber} is being prepared`;
          break;
        case "CANCELLED":
          status = "warning";
          title = "Order Cancelled";
          description = `Order #${order.orderNumber} was cancelled`;
          break;
        default:
          status = "info";
          title = "Order Placed";
          description = `Order #${order.orderNumber} was placed`;
      }

      activities.push({
        id: `order-${order.id}`,
        type: "order",
        title,
        description,
        date: order.updatedAt.toISOString(),
        status,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
          itemCount: order.items.length,
        },
      });
    });

    // Get recent wishlist additions
    const recentWishlistItems = await db.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    recentWishlistItems.forEach((item: WishlistItemWithProduct) => {
      activities.push({
        id: `wishlist-${item.id}`,
        type: "wishlist",
        title: "Item Added to Wishlist",
        description: `${item.product.name} was added to your wishlist`,
        date: item.createdAt.toISOString(),
        status: "info",
        metadata: {
          productId: item.productId,
          productName: item.product.name,
        },
      });
    });

    // Get recent reviews (if review system exists)
    try {
      const recentReviews = await db.review.findMany({
        where: { userId },
        include: {
          product: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      recentReviews.forEach(review => {
        activities.push({
          id: `review-${review.id}`,
          type: "review",
          title: "Review Submitted",
          description: `You reviewed ${review.product.name}`,
          date: review.createdAt.toISOString(),
          status: "info",
          metadata: {
            productId: review.productId,
            productName: review.product.name,
            rating: review.rating,
          },
        });
      });
    } catch (_error) {
      // Reviews table might not exist, skip silently
      console.log("Reviews table not found, skipping review activities");
    }

    // Add account-related activities
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { createdAt: true, updatedAt: true },
    });

    if (user) {
      // Check if account was recently updated
      const daysSinceUpdate = Math.floor(
        (Date.now() - user.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceUpdate <= 30) {
        activities.push({
          id: `account-update-${user.updatedAt.getTime()}`,
          type: "account",
          title: "Profile Updated",
          description: "Your account information was updated",
          date: user.updatedAt.toISOString(),
          status: "info",
        });
      }

      // Add account creation activity if recent
      const daysSinceCreation = Math.floor(
        (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceCreation <= 90) {
        activities.push({
          id: `account-created-${user.createdAt.getTime()}`,
          type: "account",
          title: "Welcome to STEM Toys!",
          description: "Your account was created successfully",
          date: user.createdAt.toISOString(),
          status: "success",
        });
      }
    }

    // Sort activities by date (newest first)
    activities.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Limit to most recent 20 activities
    const limitedActivities = activities.slice(0, 20);

    return NextResponse.json(limitedActivities);
  } catch (_error) {
    // console.error("Error fetching user dashboard activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard activities" },
      { status: 500 }
    );
  }
});
