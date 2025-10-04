import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const supplierId = request.nextUrl.pathname.split("/").pop();

    if (!supplierId) {
      return NextResponse.json(
        { error: "Supplier ID is required" },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "90"; // days
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Calculate date range
    const endDateObj = endDate ? new Date(endDate) : new Date();
    const startDateObj = startDate
      ? new Date(startDate)
      : new Date(endDateObj.getTime() - parseInt(period) * 24 * 60 * 60 * 1000);

    // Get supplier details
    const supplier = await db.supplier.findUnique({
      where: { id: supplierId },
      include: {
        _count: {
          select: {
            orders: true,
            products: true,
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Get detailed performance data
    const [
      orderMetrics,
      qualityMetrics,
      deliveryMetrics,
      monthlyTrends,
      recentIssues,
      topProducts,
    ] = await Promise.all([
      calculateOrderMetrics(supplierId, startDateObj, endDateObj),
      calculateQualityMetrics(supplierId, startDateObj, endDateObj),
      calculateDeliveryMetrics(supplierId, startDateObj, endDateObj),
      calculateMonthlyTrends(supplierId, startDateObj, endDateObj),
      getRecentIssues(supplierId, startDateObj, endDateObj),
      getTopProducts(supplierId, startDateObj, endDateObj),
    ]);

    // Calculate overall performance score
    const performanceScore = calculateOverallScore(
      orderMetrics,
      qualityMetrics,
      deliveryMetrics
    );

    // Generate improvement recommendations
    const recommendations = generateRecommendations(
      orderMetrics,
      qualityMetrics,
      deliveryMetrics
    );

    const response = {
      supplier: {
        id: supplier.id,
        name: supplier.companyName || supplier.name,
        email: supplier.email,
        status: supplier.status,
        commissionRate: supplier.commissionRate,
        paymentTerms: supplier.paymentTerms,
        businessCountry: supplier.businessCountry,
        createdAt: supplier.createdAt,
        totalProducts: supplier._count.products,
        totalOrders: supplier._count.orders,
      },
      period: {
        startDate: startDateObj.toISOString().split("T")[0],
        endDate: endDateObj.toISOString().split("T")[0],
        days: Math.ceil(
          (endDateObj.getTime() - startDateObj.getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      },
      performance: {
        overallScore: performanceScore,
        grade: getPerformanceGrade(performanceScore),
        orderMetrics,
        qualityMetrics,
        deliveryMetrics,
      },
      trends: monthlyTrends,
      issues: recentIssues,
      topProducts,
      recommendations,
    };

    logger.info("Supplier performance details retrieved", {
      adminId: session.user.id,
      supplierId,
      period: `${startDateObj.toISOString().split("T")[0]} to ${endDateObj.toISOString().split("T")[0]}`,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error retrieving supplier performance details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper functions for detailed calculations
async function calculateOrderMetrics(
  supplierId: string,
  startDate: Date,
  endDate: Date
) {
  const orders = await db.supplierOrder.findMany({
    where: {
      supplierId,
      createdAt: { gte: startDate, lte: endDate },
    },
    select: {
      status: true,
      totalCost: true,
      createdAt: true,
    },
  });

  const totalOrders = orders.length;
  const fulfilledOrders = orders.filter(order =>
    ["DELIVERED", "SHIPPED"].includes(order.status)
  ).length;
  const pendingOrders = orders.filter(order =>
    ["PENDING", "CONFIRMED", "IN_PRODUCTION", "READY_TO_SHIP"].includes(
      order.status
    )
  ).length;
  const cancelledOrders = orders.filter(
    order => order.status === "CANCELLED"
  ).length;

  const fulfillmentRate =
    totalOrders > 0 ? (fulfilledOrders / totalOrders) * 100 : 0;
  const cancellationRate =
    totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalCost, 0);
  const averageOrderValue =
    fulfilledOrders > 0 ? totalRevenue / fulfilledOrders : 0;

  return {
    totalOrders,
    fulfilledOrders,
    pendingOrders,
    cancelledOrders,
    fulfillmentRate: Math.round(fulfillmentRate * 100) / 100,
    cancellationRate: Math.round(cancellationRate * 100) / 100,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
  };
}

async function calculateQualityMetrics(
  supplierId: string,
  startDate: Date,
  endDate: Date
) {
  const supplierOrders = await db.supplierOrder.findMany({
    where: {
      supplierId,
      createdAt: { gte: startDate, lte: endDate },
    },
    include: {
      orderItem: {
        include: {
          reviews: {
            where: {
              createdAt: { gte: startDate, lte: endDate },
            },
            select: {
              rating: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  const allReviews = supplierOrders.flatMap(
    order => order.orderItem.reviews || []
  );

  const reviewCount = allReviews.length;
  const averageRating =
    reviewCount > 0
      ? allReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
      : 0;

  // Rating distribution
  const ratingDistribution = {
    5: allReviews.filter(r => r.rating === 5).length,
    4: allReviews.filter(r => r.rating === 4).length,
    3: allReviews.filter(r => r.rating === 3).length,
    2: allReviews.filter(r => r.rating === 2).length,
    1: allReviews.filter(r => r.rating === 1).length,
  };

  // Customer satisfaction trend (simplified)
  const satisfactionTrend = reviewCount > 5 ? "stable" : "insufficient_data";

  return {
    reviewCount,
    averageRating: Math.round(averageRating * 100) / 100,
    ratingDistribution,
    satisfactionTrend,
    qualityScore: averageRating, // 1-5 scale
  };
}

async function calculateDeliveryMetrics(
  supplierId: string,
  startDate: Date,
  endDate: Date
) {
  const ordersWithTracking = await db.supplierOrder.findMany({
    where: {
      supplierId,
      createdAt: { gte: startDate, lte: endDate },
    },
    include: {
      tracking: true,
      order: {
        select: {
          createdAt: true,
        },
      },
    },
  });

  const deliveredOrders = ordersWithTracking.filter(
    order => order.tracking?.actualDeliveryDate
  );
  const onTimeDeliveries = deliveredOrders.filter(order => {
    if (
      !order.tracking?.estimatedDeliveryDate ||
      !order.tracking?.actualDeliveryDate
    )
      return false;
    return (
      new Date(order.tracking.actualDeliveryDate) <=
      new Date(order.tracking.estimatedDeliveryDate)
    );
  });

  const onTimeDeliveryRate =
    deliveredOrders.length > 0
      ? (onTimeDeliveries.length / deliveredOrders.length) * 100
      : 0;

  // Average delivery times
  const deliveryTimes = deliveredOrders
    .filter(
      order => order.tracking?.shippedDate && order.tracking.actualDeliveryDate
    )
    .map(order => {
      const shippedDate = new Date(order.tracking!.shippedDate!);
      const deliveryDate = new Date(order.tracking!.actualDeliveryDate!);
      return Math.ceil(
        (deliveryDate.getTime() - shippedDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    });

  const averageDeliveryDays =
    deliveryTimes.length > 0
      ? deliveryTimes.reduce((sum, days) => sum + days, 0) /
        deliveryTimes.length
      : null;

  // Late deliveries
  const lateDeliveries = deliveredOrders.length - onTimeDeliveries.length;
  const lateDeliveryRate =
    deliveredOrders.length > 0
      ? (lateDeliveries / deliveredOrders.length) * 100
      : 0;

  return {
    totalTrackedOrders: ordersWithTracking.length,
    deliveredOrders: deliveredOrders.length,
    onTimeDeliveries: onTimeDeliveries.length,
    lateDeliveries,
    onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 100) / 100,
    lateDeliveryRate: Math.round(lateDeliveryRate * 100) / 100,
    averageDeliveryDays: averageDeliveryDays
      ? Math.round(averageDeliveryDays * 100) / 100
      : null,
  };
}

async function calculateMonthlyTrends(
  supplierId: string,
  startDate: Date,
  endDate: Date
) {
  // Group orders by month for trend analysis
  const monthlyData = await db.supplierOrder.groupBy({
    by: ["createdAt"],
    where: {
      supplierId,
      createdAt: { gte: startDate, lte: endDate },
    },
    _count: {
      createdAt: true,
    },
    _sum: {
      totalCost: true,
    },
  });

  // Process monthly data (simplified - would need more sophisticated grouping)
  const trends = monthlyData.slice(0, 12).map(item => ({
    month: item.createdAt.toISOString().slice(0, 7), // YYYY-MM format
    orderCount: item._count.createdAt,
    revenue: item._sum.totalCost || 0,
  }));

  return trends.reverse(); // Most recent first
}

async function getRecentIssues(
  supplierId: string,
  startDate: Date,
  endDate: Date
) {
  // Get recent supplier orders with issues
  const recentOrders = await db.supplierOrder.findMany({
    where: {
      supplierId,
      createdAt: { gte: startDate, lte: endDate },
      status: { in: ["CANCELLED"] },
    },
    include: {
      order: {
        select: {
          orderNumber: true,
          createdAt: true,
        },
      },
      orderItem: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return recentOrders.map(order => ({
    id: order.id,
    orderNumber: order.order.orderNumber,
    productName: order.orderItem.name,
    issue: order.status === "CANCELLED" ? "Order Cancelled" : "Other Issue",
    date: order.createdAt,
    impact: "negative",
  }));
}

async function getTopProducts(
  supplierId: string,
  startDate: Date,
  endDate: Date
) {
  // Get top performing products by supplier
  const topProducts = await db.supplierOrder.groupBy({
    by: ["productId"],
    where: {
      supplierId,
      createdAt: { gte: startDate, lte: endDate },
      status: { in: ["DELIVERED", "SHIPPED"] },
    },
    _count: {
      productId: true,
    },
    _sum: {
      totalCost: true,
      quantity: true,
    },
    orderBy: {
      _count: {
        productId: "desc",
      },
    },
    take: 10,
  });

  // Get product details
  const productDetails = await Promise.all(
    topProducts.map(async item => {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        select: {
          id: true,
          name: true,
          sku: true,
          images: true,
        },
      });

      return product
        ? {
            id: product.id,
            name: product.name,
            sku: product.sku,
            image: product.images[0] || null,
            orderCount: item._count.productId,
            totalQuantity: item._sum.quantity || 0,
            totalRevenue: item._sum.totalCost || 0,
          }
        : null;
    })
  );

  return productDetails.filter(Boolean);
}

function calculateOverallScore(
  orderMetrics: any,
  qualityMetrics: any,
  deliveryMetrics: any
): number {
  const fulfillmentWeight = 0.4;
  const qualityWeight = 0.3;
  const deliveryWeight = 0.3;

  const fulfillmentScore = Math.min(orderMetrics.fulfillmentRate, 100) / 100;
  const qualityScore = Math.min(qualityMetrics.qualityScore, 5) / 5;
  const deliveryScore = Math.min(deliveryMetrics.onTimeDeliveryRate, 100) / 100;

  return Math.round(
    (fulfillmentScore * fulfillmentWeight +
      qualityScore * qualityWeight +
      deliveryScore * deliveryWeight) *
      100
  );
}

function getPerformanceGrade(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "B+";
  if (score >= 80) return "B";
  if (score >= 70) return "C+";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

function generateRecommendations(
  orderMetrics: any,
  qualityMetrics: any,
  deliveryMetrics: any
) {
  const recommendations = [];

  if (orderMetrics.fulfillmentRate < 80) {
    recommendations.push({
      type: "critical",
      title: "Improve Order Fulfillment",
      description: `Fulfillment rate is ${orderMetrics.fulfillmentRate}%. Target: 95%+`,
      action: "Review production capacity and order processing workflows",
    });
  }

  if (deliveryMetrics.onTimeDeliveryRate < 85) {
    recommendations.push({
      type: "high",
      title: "Enhance Delivery Performance",
      description: `On-time delivery rate is ${deliveryMetrics.onTimeDeliveryRate}%. Target: 95%+`,
      action: "Optimize shipping processes and carrier selection",
    });
  }

  if (qualityMetrics.averageRating < 4.0) {
    recommendations.push({
      type: "medium",
      title: "Boost Product Quality",
      description: `Average rating is ${qualityMetrics.averageRating}/5. Target: 4.5+`,
      action:
        "Implement quality control checks and customer feedback integration",
    });
  }

  if (orderMetrics.cancellationRate > 5) {
    recommendations.push({
      type: "medium",
      title: "Reduce Order Cancellations",
      description: `Cancellation rate is ${orderMetrics.cancellationRate}%. Target: <3%`,
      action: "Improve order accuracy and communication with customers",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: "positive",
      title: "Excellent Performance!",
      description:
        "All key metrics are performing well. Keep up the great work!",
      action: "Monitor trends and maintain current standards",
    });
  }

  return recommendations;
}
