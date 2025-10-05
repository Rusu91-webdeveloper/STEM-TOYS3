import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { UserAnalyticsService } from "@/lib/services/user-analytics-service";
import { SegmentationService } from "@/lib/services/segmentation-service";
import { getUserCache } from "@/lib/cache/user-cache";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Initialize services
    const analyticsService = new UserAnalyticsService(db);
    const segmentationService = new SegmentationService(db, analyticsService);
    const userCache = getUserCache();

    // Get date range for metrics (default to last 30 days)
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get("days") || "30");
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Fetch all metrics in parallel for better performance
    const [
      overviewMetrics,
      realtimeMetrics,
      segmentationMetrics,
      behaviorMetrics,
      performanceMetrics,
    ] = await Promise.all([
      getOverviewMetrics(startDate, endDate),
      getRealtimeMetrics(),
      getSegmentationMetrics(),
      getBehaviorMetrics(startDate, endDate),
      getPerformanceMetrics(),
    ]);

    // Combine all metrics
    const dashboardData = {
      overview: overviewMetrics,
      realtime: realtimeMetrics,
      segmentation: segmentationMetrics,
      behavior: behaviorMetrics,
      performance: performanceMetrics,
      metadata: {
        generatedAt: new Date().toISOString(),
        timeRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days,
        },
        cacheStatus: "fresh", // Could be enhanced with actual cache info
      },
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard metrics" },
      { status: 500 }
    );
  }
}

async function getOverviewMetrics(startDate: Date, endDate: Date) {
  const [
    totalUsers,
    activeUsers,
    newUsersToday,
    totalRevenue,
    avgOrderValue,
    conversionData,
  ] = await Promise.all([
    // Total users
    db.user.count(),

    // Active users (logged in within last 30 days)
    db.user.count({
      where: {
        lastLoginAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    // New users today
    db.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),

    // Total revenue from completed orders
    db.order
      .aggregate({
        where: {
          status: "COMPLETED",
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          total: true,
        },
      })
      .then(result => result._sum.total || 0),

    // Average order value
    db.order
      .aggregate({
        where: {
          status: "COMPLETED",
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _avg: {
          total: true,
        },
      })
      .then(result => result._avg.total || 0),

    // Conversion rate calculation
    getConversionRate(startDate, endDate),
  ]);

  return {
    totalUsers,
    activeUsers,
    newUsersToday,
    totalRevenue: Number(totalRevenue),
    avgOrderValue: Number(avgOrderValue),
    conversionRate: conversionData,
  };
}

async function getRealtimeMetrics() {
  // In a real implementation, these would come from Redis/cache with real-time updates
  // For now, we'll simulate with recent activity data

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const [activeUsersNow, recentPageViews, recentOrders, recentRevenue] =
    await Promise.all([
      // Active users in last 5 minutes (simulated)
      db.user.count({
        where: {
          lastActivityAt: {
            gte: new Date(now.getTime() - 5 * 60 * 1000),
          },
        },
      }),

      // Page views in last hour (this would come from analytics events)
      db.user
        .aggregate({
          where: {
            lastActivityAt: {
              gte: oneHourAgo,
            },
          },
          _sum: {
            totalPageViews: true,
          },
        })
        .then(result => result._sum.totalPageViews || 0),

      // Orders in last hour
      db.order.count({
        where: {
          createdAt: {
            gte: oneHourAgo,
          },
        },
      }),

      // Revenue in last hour
      db.order
        .aggregate({
          where: {
            status: "COMPLETED",
            createdAt: {
              gte: oneHourAgo,
            },
          },
          _sum: {
            total: true,
          },
        })
        .then(result => result._sum.total || 0),
    ]);

  return {
    activeUsersNow,
    pageViewsPerMinute: Math.round(Number(recentPageViews) / 60),
    ordersPerHour: recentOrders,
    revenuePerHour: Number(recentRevenue),
  };
}

async function getSegmentationMetrics() {
  const [segmentDistribution, lifecycleDistribution] = await Promise.all([
    // Segment distribution
    db.user.groupBy({
      by: ["segment"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    }),

    // Lifecycle stage distribution
    db.user.groupBy({
      by: ["lifecycleStage"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    }),
  ]);

  const totalUsers = await db.user.count();

  return {
    segmentDistribution: segmentDistribution.map(item => ({
      segment: item.segment,
      count: item._count.id,
      percentage: (item._count.id / totalUsers) * 100,
    })),
    lifecycleDistribution: lifecycleDistribution.map(item => ({
      stage: item.lifecycleStage,
      count: item._count.id,
      percentage: (item._count.id / totalUsers) * 100,
    })),
  };
}

async function getBehaviorMetrics(startDate: Date, endDate: Date) {
  const [topPages, userJourney, engagementMetrics] = await Promise.all([
    // Top pages (simulated - would come from analytics events)
    getTopPages(),

    // User journey metrics
    getUserJourneyMetrics(),

    // Engagement metrics
    getEngagementMetrics(),
  ]);

  return {
    topPages,
    userJourney,
    engagement: engagementMetrics,
  };
}

async function getPerformanceMetrics() {
  // In a real implementation, these would come from monitoring services
  // like DataDog, New Relic, or custom performance tracking

  const [apiResponseTime, errorRate, uptime, throughput] = await Promise.all([
    // Average API response time (simulated)
    Promise.resolve(245), // ms

    // Error rate (simulated)
    Promise.resolve(0.02), // 2%

    // Uptime percentage (simulated)
    Promise.resolve(0.995), // 99.5%

    // Throughput (requests per minute, simulated)
    Promise.resolve(1250),
  ]);

  return {
    apiResponseTime,
    errorRate,
    uptime,
    throughput,
  };
}

async function getConversionRate(startDate: Date, endDate: Date) {
  const [totalVisitors, totalCustomers] = await Promise.all([
    // Total unique users who viewed pages (simulated)
    db.user.count({
      where: {
        totalPageViews: {
          gt: 0,
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),

    // Total users who made purchases
    db.user.count({
      where: {
        orders: {
          some: {
            status: "COMPLETED",
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
    }),
  ]);

  return totalVisitors > 0 ? totalCustomers / totalVisitors : 0;
}

async function getTopPages() {
  // Simulated top pages data
  // In a real implementation, this would come from analytics events
  return [
    { page: "/products", views: 15420, bounceRate: 0.35 },
    { page: "/products/toys", views: 8920, bounceRate: 0.28 },
    { page: "/", views: 12650, bounceRate: 0.42 },
    { page: "/cart", views: 7830, bounceRate: 0.51 },
    { page: "/checkout", views: 5420, bounceRate: 0.23 },
  ];
}

async function getUserJourneyMetrics() {
  // User journey funnel data
  const [awareness, consideration, purchase, retention] = await Promise.all([
    // Awareness: Users who viewed products
    db.user.count({
      where: {
        totalPageViews: { gt: 0 },
      },
    }),

    // Consideration: Users who added to wishlist or viewed cart
    db.user.count({
      where: {
        OR: [
          { wishlistSize: { gt: 0 } },
          { totalPageViews: { gte: 5 } }, // Viewed multiple pages
        ],
      },
    }),

    // Purchase: Users who completed orders
    db.user.count({
      where: {
        orders: {
          some: {
            status: "COMPLETED",
          },
        },
      },
    }),

    // Retention: Users who made repeat purchases
    db.user.count({
      where: {
        orders: {
          some: {
            status: "COMPLETED",
          },
        },
        lifetimeValue: { gte: 200 }, // Significant repeat value
      },
    }),
  ]);

  return {
    awareness,
    consideration,
    purchase,
    retention,
  };
}

async function getEngagementMetrics() {
  const [avgSessionDuration, avgPagesPerSession, returnVisitorRate] =
    await Promise.all([
      // Average session duration
      db.user
        .aggregate({
          where: {
            avgSessionDuration: {
              not: null,
            },
          },
          _avg: {
            avgSessionDuration: true,
          },
        })
        .then(result => result._avg.avgSessionDuration || 0),

      // Average pages per session
      db.user
        .aggregate({
          where: {
            totalPageViews: { gt: 0 },
            avgSessionDuration: { gt: 0 },
          },
          _avg: {
            totalPageViews: true,
          },
        })
        .then(result => result._avg.totalPageViews || 0),

      // Return visitor rate (simulated)
      Promise.resolve(0.34), // 34%
    ]);

  return {
    avgSessionDuration: Number(avgSessionDuration),
    pagesPerSession: Number(avgPagesPerSession),
    returnVisitorRate: returnVisitorRate,
  };
}
