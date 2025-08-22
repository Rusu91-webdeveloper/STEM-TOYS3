import { NextRequest, NextResponse } from "next/server";
import {
  getAnalyticsData,
  getRealTimeAnalytics,
  generateAnalyticsReport,
} from "@/lib/utils/analytics";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get("test") || "all";

    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {},
    };

    // Test 1: Full analytics data
    if (testType === "all" || testType === "full") {
      try {
        console.log("Testing full analytics data...");
        const fullData = await getAnalyticsData("30d");
        results.tests.fullAnalytics = {
          success: true,
          hasOverview: !!fullData.overview,
          hasSales: !!fullData.sales,
          hasCustomers: !!fullData.customers,
          hasInventory: !!fullData.inventory,
          hasPerformance: !!fullData.performance,
          overviewMetrics: {
            totalRevenue: fullData.overview.totalRevenue,
            totalOrders: fullData.overview.totalOrders,
            revenueChange: fullData.overview.revenueChange,
          },
          salesData: {
            dailyCount: fullData.sales.daily.length,
            monthlyCount: fullData.sales.monthly.length,
            categoryCount: fullData.sales.byCategory.length,
            productCount: fullData.sales.byProduct.length,
          },
          customerData: {
            newCustomers: fullData.customers.newCustomers,
            returningCustomers: fullData.customers.returningCustomers,
            topCustomersCount: fullData.customers.topCustomers.length,
          },
          inventoryData: {
            totalStock: fullData.inventory.totalStock,
            lowStockItems: fullData.inventory.lowStockItems,
            outOfStockItems: fullData.inventory.outOfStockItems,
          },
          performanceData: {
            conversionRate: fullData.performance.conversionRate,
            pageViews: fullData.performance.pageViews,
            topPagesCount: fullData.performance.topPages.length,
          },
        };
      } catch (error) {
        results.tests.fullAnalytics = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    // Test 2: Real-time analytics
    if (testType === "all" || testType === "realtime") {
      try {
        console.log("Testing real-time analytics...");
        const realtimeData = await getRealTimeAnalytics();
        results.tests.realTimeAnalytics = {
          success: true,
          activeUsers: realtimeData.activeUsers,
          currentOrders: realtimeData.currentOrders,
          recentRevenue: realtimeData.recentRevenue,
          topProductsCount: realtimeData.topProducts.length,
        };
      } catch (error) {
        results.tests.realTimeAnalytics = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    // Test 3: Report generation
    if (testType === "all" || testType === "reports") {
      try {
        console.log("Testing report generation...");
        const reportTypes = [
          "overview",
          "sales",
          "customers",
          "inventory",
          "performance",
        ];
        const reports: any = {};

        for (const reportType of reportTypes) {
          try {
            const report = await generateAnalyticsReport(
              "30d",
              reportType as any
            );
            reports[reportType] = {
              success: true,
              type: report.type,
              timeRange: report.timeRange,
              hasData: !!report.data,
            };
          } catch (error) {
            reports[reportType] = {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        }

        results.tests.reportGeneration = {
          success: true,
          reports,
        };
      } catch (error) {
        results.tests.reportGeneration = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    // Test 4: Different time ranges
    if (testType === "all" || testType === "timeranges") {
      try {
        console.log("Testing different time ranges...");
        const timeRanges = ["7d", "30d", "90d", "1y"];
        const timeRangeResults: any = {};

        for (const timeRange of timeRanges) {
          try {
            const data = await getAnalyticsData(timeRange);
            timeRangeResults[timeRange] = {
              success: true,
              hasData: !!data.overview,
              totalRevenue: data.overview.totalRevenue,
              totalOrders: data.overview.totalOrders,
            };
          } catch (error) {
            timeRangeResults[timeRange] = {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        }

        results.tests.timeRanges = {
          success: true,
          results: timeRangeResults,
        };
      } catch (error) {
        results.tests.timeRanges = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    // Calculate overall success
    const testResults = Object.values(results.tests);
    const successfulTests = testResults.filter(
      (test: any) => test.success
    ).length;
    const totalTests = testResults.length;

    results.summary = {
      totalTests,
      successfulTests,
      failedTests: totalTests - successfulTests,
      successRate: totalTests > 0 ? (successfulTests / totalTests) * 100 : 0,
    };

    return NextResponse.json({
      success: true,
      message: "Analytics test completed",
      results,
    });
  } catch (error) {
    console.error("Error running analytics tests:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to run analytics tests",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
