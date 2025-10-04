import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCached, CacheKeys } from "@/lib/cache";
import { withRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";

export const GET = withRateLimit(
  async (request: NextRequest) => {
    try {
      // Check authentication
      const session = await auth();
      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }

      const searchParams = request.nextUrl.searchParams;
      const timeRange = searchParams.get("timeRange") || "30d";
      const categoryId = searchParams.get("categoryId") || undefined;
      const supplierId = searchParams.get("supplierId") || undefined;
      const includeInactive = searchParams.get("includeInactive") === "true";

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case "7d":
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(endDate.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(endDate.getDate() - 90);
          break;
        case "1y":
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Caching strategy
      const cacheKey = CacheKeys.analytics(
        `cost-management:${timeRange}:${categoryId || "all"}:${supplierId || "all"}:${includeInactive}`
      );
      const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

      const costManagementData = await getCached(
        cacheKey,
        async () => {
          // Build where clause for products
          const whereClause: any = {};
          if (categoryId) whereClause.categoryId = categoryId;
          if (supplierId) whereClause.supplierOrders = { some: { supplierId } };
          if (!includeInactive) whereClause.isActive = true;

          // Fetch products with comprehensive cost data
          const products = await db.product.findMany({
            where: whereClause,
            include: {
              category: {
                select: { name: true },
              },
              orderItems: {
                where: {
                  order: {
                    createdAt: {
                      gte: startDate,
                      lte: endDate,
                    },
                    status: {
                      in: ["COMPLETED", "DELIVERED", "SHIPPED"],
                    },
                  },
                },
              },
              marketingCosts: {
                where: {
                  date: {
                    gte: startDate,
                    lte: endDate,
                  },
                },
              },
              supplierOrders: supplierId
                ? {
                    where: { supplierId },
                  }
                : true,
            },
          });

          // Calculate detailed cost analysis for each product
          const costAnalysis = products.map(product => {
            // Calculate monthly sales
            const monthlySales = product.orderItems.reduce(
              (sum, item) => sum + item.quantity,
              0
            );

            // Calculate total marketing costs
            const totalMarketingCost = product.marketingCosts.reduce(
              (sum, cost) => sum + cost.totalMarketingCost,
              0
            );

            // Calculate cost breakdown
            const costBreakdown = {
              costPrice: product.costPrice || 0,
              importDuties: product.importDuties || 0,
              shippingCost: product.shippingCost || 0,
              storageCost: product.storageCost || 0,
              packagingCost: product.packagingCost || 0,
              laborCost: product.laborCost || 0,
              qualityControlCost: product.qualityControlCost || 0,
              paymentProcessingFee: product.paymentProcessingFee || 2.9,
              customerServiceCost: product.customerServiceCost || 0,
              operationalOverhead: product.operationalOverhead || 0,
              marketingCosts: totalMarketingCost,
            };

            // Calculate total costs per sale
            const totalCostsPerSale = Object.values(costBreakdown).reduce(
              (sum, cost) => {
                if (cost === product.paymentProcessingFee) {
                  // Payment processing fee is a percentage of selling price
                  return sum + (product.price * cost) / 100;
                }
                return sum + cost;
              },
              0
            );

            // Calculate profit metrics
            const profitPerSale = product.price - totalCostsPerSale;
            const profitMargin =
              product.price > 0 ? (profitPerSale / product.price) * 100 : 0;
            const monthlyProfit = monthlySales * profitPerSale;
            const monthlyRevenue = monthlySales * product.price;

            // Determine risk level
            let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
            if (profitMargin < 5 || !monthlySales) {
              riskLevel = "HIGH";
            } else if (profitMargin < 15) {
              riskLevel = "MEDIUM";
            }

            return {
              productId: product.id,
              name: product.name,
              category: product.category?.name || "Uncategorized",
              sellingPrice: product.price,
              costBreakdown,
              totalCostsPerSale,
              profitPerSale,
              profitMargin,
              monthlySales,
              monthlyRevenue,
              monthlyProfit,
              riskLevel,
              isProfitable: profitMargin > 0,
              lastUpdated: product.updatedAt,
            };
          });

          // Calculate summary statistics
          const totalProducts = costAnalysis.length;
          const profitableProducts = costAnalysis.filter(
            p => p.isProfitable
          ).length;
          const totalMonthlyRevenue = costAnalysis.reduce(
            (sum, p) => sum + p.monthlyRevenue,
            0
          );
          const totalMonthlyProfit = costAnalysis.reduce(
            (sum, p) => sum + p.monthlyProfit,
            0
          );
          const totalMonthlyCosts = totalMonthlyRevenue - totalMonthlyProfit;
          const averageProfitMargin =
            totalProducts > 0
              ? costAnalysis.reduce((sum, p) => sum + p.profitMargin, 0) /
                totalProducts
              : 0;
          const averageCostPerProduct =
            totalProducts > 0
              ? costAnalysis.reduce((sum, p) => sum + p.totalCostsPerSale, 0) /
                totalProducts
              : 0;
          const productsAtRisk = costAnalysis.filter(
            p => p.riskLevel === "HIGH"
          ).length;

          // Cost category analysis
          const costCategories = {
            procurement: costAnalysis.reduce(
              (sum, p) =>
                sum + p.costBreakdown.costPrice + p.costBreakdown.importDuties,
              0
            ),
            logistics: costAnalysis.reduce(
              (sum, p) =>
                sum +
                p.costBreakdown.shippingCost +
                p.costBreakdown.storageCost +
                p.costBreakdown.packagingCost,
              0
            ),
            operations: costAnalysis.reduce(
              (sum, p) =>
                sum +
                p.costBreakdown.laborCost +
                p.costBreakdown.qualityControlCost +
                p.costBreakdown.operationalOverhead,
              0
            ),
            services: costAnalysis.reduce(
              (sum, p) =>
                sum +
                p.costBreakdown.customerServiceCost +
                (p.sellingPrice * p.costBreakdown.paymentProcessingFee) / 100,
              0
            ),
            marketing: costAnalysis.reduce(
              (sum, p) => sum + p.costBreakdown.marketingCosts,
              0
            ),
          };

          return {
            summary: {
              totalProducts,
              profitableProducts,
              averageProfitMargin,
              totalMonthlyRevenue,
              totalMonthlyProfit,
              totalMonthlyCosts,
              averageCostPerProduct,
              productsAtRisk,
              costCategories,
            },
            products: costAnalysis,
            timeRange,
            generatedAt: new Date().toISOString(),
          };
        },
        CACHE_TTL
      );

      return NextResponse.json({
        success: true,
        data: costManagementData,
      });
    } catch (error) {
      console.error("Error fetching cost management data:", error);
      return NextResponse.json(
        { error: "Failed to fetch cost management data" },
        { status: 500 }
      );
    }
  },
  { limit: 20, windowMs: 10 * 60 * 1000 } // Rate limiting for analytics
);
