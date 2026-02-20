import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const HOMEPAGE_ACTION_GROUPS = {
  HERO_IMPRESSION: ["homepage_hero_impression"],
  HERO_PRIMARY_CTA_CLICK: [
    "hero_primary_bundle_cta_click",
    "homepage_hero_primary_cta_click",
  ],
  HERO_SECONDARY_CTA_CLICK: [
    "hero_secondary_products_cta_click",
    "homepage_hero_secondary_cta_click",
  ],
  HERO_AGE_CHIP_CLICK: ["hero_age_chip_click", "homepage_hero_age_chip_click"],
  FIVE_SECOND_STEP_CLICK: [
    "five_second_step_click",
    "homepage_five_second_step_click",
  ],
  FIVE_SECOND_PRIMARY_CTA_CLICK: [
    "five_second_primary_bundle_cta_click",
    "homepage_five_second_primary_cta_click",
  ],
  FIVE_SECOND_SECONDARY_CTA_CLICK: [
    "five_second_secondary_products_cta_click",
    "homepage_five_second_secondary_cta_click",
  ],
  BUNDLE_CARD_CLICK: ["bundle_card_click", "homepage_bundle_card_click"],
  BUNDLE_LIST_CTA_CLICK: [
    "bundle_list_cta_click",
    "homepage_bundle_list_cta_click",
  ],
  TRUST_BADGE_CLICK: ["trust_badge_click", "homepage_trust_badge_click"],
} as const;

const HOMEPAGE_TRACKED_ACTIONS = Array.from(
  new Set(
    Object.values(HOMEPAGE_ACTION_GROUPS).flatMap(actions => [...actions])
  )
);

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      homepageConversionMetrics,
    ] = await Promise.all([
      getOverviewMetrics(startDate, endDate),
      getRealtimeMetrics(),
      getSegmentationMetrics(),
      getBehaviorMetrics(),
      getPerformanceMetrics(),
      getHomepageConversionMetrics(startDate, endDate),
    ]);

    // Combine all metrics
    const dashboardData = {
      overview: overviewMetrics,
      realtime: realtimeMetrics,
      segmentation: segmentationMetrics,
      behavior: behaviorMetrics,
      performance: performanceMetrics,
      homepageConversion: homepageConversionMetrics,
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

async function getBehaviorMetrics() {
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

async function getHomepageConversionMetrics(startDate: Date, endDate: Date) {
  const where = {
    timestamp: {
      gte: startDate,
      lte: endDate,
    },
    action: {
      in: HOMEPAGE_TRACKED_ACTIONS,
    },
  };

  const [actionCountsRaw, bundleClickEvents, fiveSecondStepEvents] =
    await Promise.all([
      db.conversionLog.groupBy({
        by: ["action"],
        where,
        _count: {
          action: true,
        },
      }),
      db.conversionLog.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
          action: {
            in: HOMEPAGE_ACTION_GROUPS.BUNDLE_CARD_CLICK,
          },
        },
        select: {
          metadata: true,
        },
        orderBy: {
          timestamp: "desc",
        },
        take: 5000,
      }),
      db.conversionLog.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
          action: {
            in: HOMEPAGE_ACTION_GROUPS.FIVE_SECOND_STEP_CLICK,
          },
        },
        select: {
          metadata: true,
        },
        orderBy: {
          timestamp: "desc",
        },
        take: 5000,
      }),
    ]);

  const actionCounts = actionCountsRaw.reduce<Record<string, number>>(
    (acc, item) => {
      if (!item.action) return acc;
      acc[item.action] = item._count.action;
      return acc;
    },
    {}
  );

  const heroImpressions = sumActionCounts(
    actionCounts,
    HOMEPAGE_ACTION_GROUPS.HERO_IMPRESSION
  );
  const heroPrimaryClicks = sumActionCounts(
    actionCounts,
    HOMEPAGE_ACTION_GROUPS.HERO_PRIMARY_CTA_CLICK
  );
  const heroSecondaryClicks = sumActionCounts(
    actionCounts,
    HOMEPAGE_ACTION_GROUPS.HERO_SECONDARY_CTA_CLICK
  );
  const heroAgeChipClicks = sumActionCounts(
    actionCounts,
    HOMEPAGE_ACTION_GROUPS.HERO_AGE_CHIP_CLICK
  );
  const fiveSecondStepClicks = sumActionCounts(
    actionCounts,
    HOMEPAGE_ACTION_GROUPS.FIVE_SECOND_STEP_CLICK
  );
  const fiveSecondPrimaryClicks = sumActionCounts(
    actionCounts,
    HOMEPAGE_ACTION_GROUPS.FIVE_SECOND_PRIMARY_CTA_CLICK
  );
  const fiveSecondSecondaryClicks = sumActionCounts(
    actionCounts,
    HOMEPAGE_ACTION_GROUPS.FIVE_SECOND_SECONDARY_CTA_CLICK
  );
  const bundleCardClicks = sumActionCounts(
    actionCounts,
    HOMEPAGE_ACTION_GROUPS.BUNDLE_CARD_CLICK
  );
  const bundleListClicks = sumActionCounts(
    actionCounts,
    HOMEPAGE_ACTION_GROUPS.BUNDLE_LIST_CTA_CLICK
  );
  const trustBadgeClicks = sumActionCounts(
    actionCounts,
    HOMEPAGE_ACTION_GROUPS.TRUST_BADGE_CLICK
  );

  const totalHomepageEvents = Object.values(actionCounts).reduce(
    (sum, count) => sum + count,
    0
  );
  const totalBundleClicks = bundleCardClicks + bundleListClicks;

  const topBundlesMap = new Map<string, { slug: string; name: string; clicks: number }>();
  for (const event of bundleClickEvents) {
    const slug = readMetadataString(event.metadata, ["bundle_slug", "bundleSlug"]);
    if (!slug) continue;

    const name =
      readMetadataString(event.metadata, ["bundle_name", "bundleName"]) || slug;
    const current = topBundlesMap.get(slug);
    if (current) {
      current.clicks += 1;
    } else {
      topBundlesMap.set(slug, { slug, name, clicks: 1 });
    }
  }

  const topFiveSecondStepsMap = new Map<string, { title: string; clicks: number }>();
  for (const event of fiveSecondStepEvents) {
    const stepTitle =
      readMetadataString(event.metadata, ["step_title", "stepTitle"]) ||
      "Pas necunoscut";
    const current = topFiveSecondStepsMap.get(stepTitle);
    if (current) {
      current.clicks += 1;
    } else {
      topFiveSecondStepsMap.set(stepTitle, { title: stepTitle, clicks: 1 });
    }
  }

  return {
    summary: {
      totalHomepageEvents,
      heroImpressions,
      heroPrimaryClicks,
      heroSecondaryClicks,
      heroAgeChipClicks,
      fiveSecondStepClicks,
      fiveSecondPrimaryClicks,
      fiveSecondSecondaryClicks,
      bundleCardClicks,
      bundleListClicks,
      trustBadgeClicks,
      heroPrimaryCtr: heroImpressions > 0 ? heroPrimaryClicks / heroImpressions : 0,
      bundleEngagementRate:
        heroImpressions > 0 ? totalBundleClicks / heroImpressions : 0,
    },
    eventBreakdown: [
      { key: "hero_primary", label: "Hero CTA principal", count: heroPrimaryClicks },
      { key: "hero_secondary", label: "Hero CTA secundar", count: heroSecondaryClicks },
      { key: "hero_age", label: "Click pe grupe de vârstă", count: heroAgeChipClicks },
      { key: "five_second_steps", label: "Click pe pașii de 5 secunde", count: fiveSecondStepClicks },
      { key: "five_second_primary", label: "CTA principal 5 secunde", count: fiveSecondPrimaryClicks },
      { key: "five_second_secondary", label: "CTA secundar 5 secunde", count: fiveSecondSecondaryClicks },
      { key: "bundle_cards", label: "Click pe carduri bundle", count: bundleCardClicks },
      { key: "bundle_list", label: "CTA listă bundle-uri", count: bundleListClicks },
      { key: "trust_badges", label: "Interacțiuni trust badges", count: trustBadgeClicks },
    ],
    topBundles: Array.from(topBundlesMap.values())
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5),
    topFiveSecondSteps: Array.from(topFiveSecondStepsMap.values())
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5),
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

function getTopPages() {
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
    returnVisitorRate,
  };
}

function sumActionCounts(
  actionCounts: Record<string, number>,
  actions: readonly string[]
) {
  return actions.reduce((sum, action) => sum + (actionCounts[action] || 0), 0);
}

function readMetadataString(
  metadata: unknown,
  possibleKeys: string[]
): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const metadataRecord = metadata as Record<string, unknown>;
  for (const key of possibleKeys) {
    const value = metadataRecord[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}
