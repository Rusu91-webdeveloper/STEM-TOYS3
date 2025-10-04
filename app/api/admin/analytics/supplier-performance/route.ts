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

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "30"; // days
    const supplierId = searchParams.get("supplierId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Calculate date range
    const endDateObj = endDate ? new Date(endDate) : new Date();
    const startDateObj = startDate
      ? new Date(startDate)
      : new Date(endDateObj.getTime() - parseInt(period) * 24 * 60 * 60 * 1000);

    const whereClause = supplierId ? { supplierId } : {};

    // Get all suppliers with their performance data
    const suppliers = await db.supplier.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            orders: true,
            products: true,
          },
        },
      },
    });

    // Calculate performance metrics for each supplier
    const performanceData = await Promise.all(
      suppliers.map(async supplier => {
        // Get supplier orders within the date range
        const supplierOrders = await db.supplierOrder.findMany({
          where: {
            supplierId: supplier.id,
            createdAt: {
              gte: startDateObj,
              lte: endDateObj,
            },
          },
          include: {
            order: {
              select: {
                createdAt: true,
                status: true,
              },
            },
            orderItem: {
              include: {
                reviews: {
                  select: {
                    rating: true,
                    createdAt: true,
                  },
                },
                order: {
                  select: {
                    createdAt: true,
                  },
                },
              },
            },
            tracking: true,
          },
        });

        // Calculate metrics
        const totalOrders = supplierOrders.length;
        const fulfilledOrders = supplierOrders.filter(order =>
          ["DELIVERED", "SHIPPED"].includes(order.status)
        ).length;

        const fulfillmentRate =
          totalOrders > 0 ? (fulfilledOrders / totalOrders) * 100 : 0;

        // On-time delivery calculation
        const deliveredOrders = supplierOrders.filter(
          order => order.tracking?.actualDeliveryDate
        );
        const onTimeDeliveries = deliveredOrders.filter(order => {
          if (
            !order.tracking?.estimatedDeliveryDate ||
            !order.tracking.actualDeliveryDate
          )
            return false;
          return (
            order.tracking.actualDeliveryDate <=
            order.tracking.estimatedDeliveryDate
          );
        }).length;

        const onTimeDeliveryRate =
          deliveredOrders.length > 0
            ? (onTimeDeliveries / deliveredOrders.length) * 100
            : 0;

        // Average delivery days
        const deliveryTimes = deliveredOrders
          .filter(
            order =>
              order.tracking?.shippedDate && order.tracking.actualDeliveryDate
          )
          .map(order => {
            const shippedDate = new Date(order.tracking!.shippedDate!);
            const deliveryDate = new Date(order.tracking!.actualDeliveryDate!);
            return Math.ceil(
              (deliveryDate.getTime() - shippedDate.getTime()) /
                (1000 * 60 * 60 * 24)
            );
          });

        const averageDeliveryDays =
          deliveryTimes.length > 0
            ? deliveryTimes.reduce((sum, days) => sum + days, 0) /
              deliveryTimes.length
            : null;

        // Quality score from reviews
        const allReviews = supplierOrders.flatMap(
          order => order.orderItem.reviews || []
        );

        const qualityScore =
          allReviews.length > 0
            ? allReviews.reduce((sum, review) => sum + review.rating, 0) /
              allReviews.length
            : 0;

        // Return rate calculation (simplified - would need return data)
        const returnRate = 0; // Placeholder - would calculate from return orders

        // Customer satisfaction (same as quality score for now)
        const customerSatisfaction = qualityScore;

        // Revenue calculations
        const totalRevenue = supplierOrders.reduce(
          (sum, order) => sum + order.totalCost,
          0
        );
        const commissionEarned = totalRevenue * (supplier.commissionRate / 100);

        // Response time (placeholder - would need message tracking)
        const responseTimeHours = null; // Placeholder

        // Issue resolution rate (placeholder)
        const issueResolutionRate = 0; // Placeholder

        return {
          supplierId: supplier.id,
          supplierName: supplier.companyName || supplier.name,
          supplierEmail: supplier.email,
          status: supplier.status,
          totalOrders,
          fulfilledOrders,
          fulfillmentRate: Math.round(fulfillmentRate * 100) / 100,
          onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 100) / 100,
          averageDeliveryDays,
          qualityScore: Math.round(qualityScore * 100) / 100,
          returnRate,
          customerSatisfaction: Math.round(customerSatisfaction * 100) / 100,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          commissionEarned: Math.round(commissionEarned * 100) / 100,
          responseTimeHours,
          issueResolutionRate,
          reviewCount: allReviews.length,
          activeProducts: supplier._count.products,
          performanceGrade: calculatePerformanceGrade({
            fulfillmentRate,
            onTimeDeliveryRate,
            qualityScore,
            returnRate,
          }),
        };
      })
    );

    // Sort by performance grade and fulfillment rate
    const sortedPerformanceData = performanceData.sort((a, b) => {
      const gradeOrder = {
        "A+": 7,
        A: 6,
        "B+": 5,
        B: 4,
        "C+": 3,
        C: 2,
        D: 1,
        F: 0,
      };
      const gradeDiff =
        gradeOrder[b.performanceGrade] - gradeOrder[a.performanceGrade];
      if (gradeDiff !== 0) return gradeDiff;
      return b.fulfillmentRate - a.fulfillmentRate;
    });

    logger.info("Supplier performance analytics retrieved", {
      adminId: session.user.id,
      period: `${startDateObj.toISOString().split("T")[0]} to ${endDateObj.toISOString().split("T")[0]}`,
      supplierCount: suppliers.length,
      totalOrders: sortedPerformanceData.reduce(
        (sum, s) => sum + s.totalOrders,
        0
      ),
    });

    return NextResponse.json({
      period: {
        startDate: startDateObj.toISOString().split("T")[0],
        endDate: endDateObj.toISOString().split("T")[0],
        days: Math.ceil(
          (endDateObj.getTime() - startDateObj.getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      },
      summary: {
        totalSuppliers: suppliers.length,
        activeSuppliers: suppliers.filter(s => s.status === "APPROVED").length,
        totalOrders: sortedPerformanceData.reduce(
          (sum, s) => sum + s.totalOrders,
          0
        ),
        averageFulfillmentRate:
          sortedPerformanceData.length > 0
            ? Math.round(
                (sortedPerformanceData.reduce(
                  (sum, s) => sum + s.fulfillmentRate,
                  0
                ) /
                  sortedPerformanceData.length) *
                  100
              ) / 100
            : 0,
        averageQualityScore:
          sortedPerformanceData.length > 0
            ? Math.round(
                (sortedPerformanceData.reduce(
                  (sum, s) => sum + s.qualityScore,
                  0
                ) /
                  sortedPerformanceData.length) *
                  100
              ) / 100
            : 0,
      },
      suppliers: sortedPerformanceData,
    });
  } catch (error) {
    logger.error("Error retrieving supplier performance analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to calculate performance grade
function calculatePerformanceGrade(metrics: {
  fulfillmentRate: number;
  onTimeDeliveryRate: number;
  qualityScore: number;
  returnRate: number;
}): string {
  const { fulfillmentRate, onTimeDeliveryRate, qualityScore, returnRate } =
    metrics;

  // Weighted scoring (out of 100)
  const fulfillmentScore = Math.min(fulfillmentRate, 100) * 0.4; // 40%
  const deliveryScore = Math.min(onTimeDeliveryRate, 100) * 0.3; // 30%
  const qualityScoreWeighted = Math.min((qualityScore / 5) * 100, 100) * 0.2; // 20%
  const returnScore = Math.max(0, 100 - returnRate * 10) * 0.1; // 10% (penalty for returns)

  const totalScore =
    fulfillmentScore + deliveryScore + qualityScoreWeighted + returnScore;

  if (totalScore >= 95) return "A+";
  if (totalScore >= 90) return "A";
  if (totalScore >= 85) return "B+";
  if (totalScore >= 80) return "B";
  if (totalScore >= 70) return "C+";
  if (totalScore >= 60) return "C";
  if (totalScore >= 50) return "D";
  return "F";
}
