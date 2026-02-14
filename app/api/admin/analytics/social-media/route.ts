import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const platform = searchParams.get("platform"); // facebook, instagram, tiktok, all
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build where clause for platform filtering
    const where: any = {
      timestamp: {
        gte: startDate,
      },
    };

    if (platform && platform !== "all") {
      where.customData = {
        path: ["platform"],
        equals: platform,
      };
    }

    // Get events across all platforms
    const events = await prisma.facebookPixelEvent.findMany({
      where,
      orderBy: {
        timestamp: "desc",
      },
      take: 100,
    });

    // Get viral content data with platform breakdown
    const viralContent = await prisma.romanianViralContent.findMany({
      orderBy: {
        shares: "desc",
      },
      take: 20,
    });

    // Calculate overview statistics by platform
    const totalEvents = await prisma.facebookPixelEvent.count({ where });

    const viralShares = await prisma.facebookPixelEvent.count({
      where: {
        ...where,
        eventName: {
          contains: "ViralShare",
        },
      },
    });

    const blogEngagements = await prisma.facebookPixelEvent.count({
      where: {
        ...where,
        eventName: {
          contains: "BlogEngagement",
        },
      },
    });

    const purchasesFromSocial = await prisma.facebookPixelEvent.count({
      where: {
        ...where,
        eventName: {
          contains: "Purchase",
        },
        customData: {
          path: ["source"],
          equals: "social_traffic",
        },
      },
    });

    const totalRevenue = await prisma.facebookPixelEvent.aggregate({
      where: {
        ...where,
        eventName: {
          contains: "Purchase",
        },
        value: {
          not: null,
        },
      },
      _sum: {
        value: true,
      },
    });

    // Platform-specific metrics
    const platformMetrics = {
      facebook: await calculatePlatformMetrics(where, "facebook"),
      instagram: await calculatePlatformMetrics(where, "instagram"),
      tiktok: await calculatePlatformMetrics(where, "tiktok"),
    };

    // Recent events with platform information
    const recentEvents = events.map(event => {
      const data = (event.customData ?? {}) as Record<string, any>;
      return {
        event: event.eventName.replace(/^(facebook|instagram|tiktok)_/, ""),
        platform: data.platform || "unknown",
        blogId: event.contentIds?.[0] || data.blog_id || null,
        timestamp: event.timestamp.toISOString(),
        value: event.value || null,
        customData: event.customData,
      };
    });

    // Format viral data with platform breakdown
    const formattedViralData = viralContent.map(content => ({
      blogId: content.blogId,
      shares: content.shares,
      facebookShares: content.facebookShares,
      instagramShares: content.instagramShares,
      tiktokShares: content.tiktokShares,
      viralCoefficient: content.viralCoefficient,
      reach: content.reach,
      engagement: content.engagement,
      timeSpent: content.timeSpent,
      romanianEngagement: content.romanianEngagement,
      platformBreakdown: {
        facebook: content.facebookShares,
        instagram: content.instagramShares,
        tiktok: content.tiktokShares,
        other:
          content.shares -
          (content.facebookShares +
            content.instagramShares +
            content.tiktokShares),
      },
    }));

    return NextResponse.json({
      overview: {
        totalEvents,
        viralShares,
        blogEngagements,
        purchasesFromSocial,
        totalRevenue: totalRevenue._sum.value || 0,
      },
      platformMetrics,
      viralData: formattedViralData,
      recentEvents,
    });
  } catch (error) {
    console.error("Failed to fetch social media analytics:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch social media analytics",
        overview: {
          totalEvents: 0,
          viralShares: 0,
          blogEngagements: 0,
          purchasesFromSocial: 0,
          totalRevenue: 0,
        },
        platformMetrics: {
          facebook: { events: 0, shares: 0, revenue: 0 },
          instagram: { events: 0, shares: 0, revenue: 0 },
          tiktok: { events: 0, shares: 0, revenue: 0 },
        },
        viralData: [],
        recentEvents: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      eventName,
      platform,
      eventId,
      userId,
      sessionId,
      value,
      currency = "RON",
      contentType,
      contentIds = [],
      contentName,
      contentCategory,
      searchString,
      customData = {},
      userData = {},
      pageUrl,
      referrer,
      userAgent,
      ipAddress,
    } = body;

    if (!eventName || !platform) {
      return NextResponse.json(
        { error: "Event name and platform are required" },
        { status: 400 }
      );
    }

    // Store the social media event
    const event = await prisma.facebookPixelEvent.create({
      data: {
        eventName: `${platform}_${eventName}`,
        eventId,
        pixelId: getPixelIdForPlatform(platform),
        userId,
        sessionId,
        value,
        currency,
        contentType,
        contentIds,
        contentName,
        contentCategory,
        searchString,
        customData: {
          ...customData,
          platform,
          originalEventName: eventName,
        },
        userData,
        pageUrl,
        referrer,
        userAgent,
        ipAddress,
      },
    });

    // Update viral content metrics if it's a viral share
    if (eventName === "ViralShare" && contentIds.length > 0) {
      const blogId = contentIds[0];

      const updateData: any = {
        shares: { increment: 1 },
        lastCalculatedAt: new Date(),
      };

      switch (platform) {
        case "facebook":
          updateData.facebookShares = { increment: 1 };
          break;
        case "instagram":
          updateData.instagramShares = { increment: 1 };
          break;
        case "tiktok":
          updateData.tiktokShares = { increment: 1 };
          break;
      }

      const existing = await prisma.romanianViralContent.findFirst({
        where: { blogId },
      });

      if (existing) {
        await prisma.romanianViralContent.update({
          where: { id: existing.id },
          data: updateData,
        });
      } else {
        await prisma.romanianViralContent.create({
          data: {
            blogId,
            shares: 1,
            facebookShares: platform === "facebook" ? 1 : 0,
            instagramShares: platform === "instagram" ? 1 : 0,
            tiktokShares: platform === "tiktok" ? 1 : 0,
            viralCoefficient: 1.0,
            reach: 1,
            engagement: 1,
            romanianEngagement: 1,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        eventName: event.eventName,
        platform: platform,
        timestamp: event.timestamp,
      },
    });
  } catch (error) {
    console.error("Failed to store social media event:", error);
    return NextResponse.json(
      { error: "Failed to store social media event" },
      { status: 500 }
    );
  }
}

/**
 * Calculate platform-specific metrics
 */
async function calculatePlatformMetrics(where: any, platform: string) {
  const platformWhere = {
    ...where,
    customData: {
      path: ["platform"],
      equals: platform,
    },
  };

  const events = await prisma.facebookPixelEvent.count({
    where: platformWhere,
  });

  const shares = await prisma.facebookPixelEvent.count({
    where: {
      ...platformWhere,
      eventName: {
        contains: "ViralShare",
      },
    },
  });

  const revenue = await prisma.facebookPixelEvent.aggregate({
    where: {
      ...platformWhere,
      eventName: {
        contains: "Purchase",
      },
      value: {
        not: null,
      },
    },
    _sum: {
      value: true,
    },
  });

  return {
    events,
    shares,
    revenue: revenue._sum.value || 0,
  };
}

/**
 * Get pixel ID for platform
 */
function getPixelIdForPlatform(platform: string): string {
  switch (platform) {
    case "facebook":
      return process.env.FACEBOOK_PIXEL_ID || "";
    case "instagram":
      return process.env.INSTAGRAM_PIXEL_ID || "";
    case "tiktok":
      return process.env.TIKTOK_PIXEL_ID || "";
    default:
      return "";
  }
}
