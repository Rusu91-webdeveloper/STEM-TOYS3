import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get Facebook Pixel events
    const events = await prisma.facebookPixelEvent.findMany({
      where: {
        timestamp: {
          gte: startDate,
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 100,
    });

    // Get viral content data
    const viralContent = await prisma.romanianViralContent.findMany({
      orderBy: {
        shares: "desc",
      },
      take: 20,
    });

    // Calculate overview statistics
    const totalEvents = await prisma.facebookPixelEvent.count({
      where: {
        timestamp: {
          gte: startDate,
        },
      },
    });

    const viralShares = await prisma.facebookPixelEvent.count({
      where: {
        eventName: {
          in: ["ViralShare", "Share"],
        },
        timestamp: {
          gte: startDate,
        },
      },
    });

    const blogEngagements = await prisma.facebookPixelEvent.count({
      where: {
        eventName: "BlogEngagement",
        timestamp: {
          gte: startDate,
        },
      },
    });

    const purchasesFromBlog = await prisma.facebookPixelEvent.count({
      where: {
        eventName: "Purchase",
        customData: {
          path: ["source"],
          equals: "blog_traffic",
        },
        timestamp: {
          gte: startDate,
        },
      },
    });

    const totalRevenue = await prisma.facebookPixelEvent.aggregate({
      where: {
        eventName: "Purchase",
        timestamp: {
          gte: startDate,
        },
        value: {
          not: null,
        },
      },
      _sum: {
        value: true,
      },
    });

    // Get recent events for display
    const recentEvents = await prisma.facebookPixelEvent.findMany({
      where: {
        timestamp: {
          gte: startDate,
        },
      },
      select: {
        eventName: true,
        contentIds: true,
        customData: true,
        timestamp: true,
        value: true,
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 50,
    });

    // Format recent events
    const formattedRecentEvents = recentEvents.map(event => ({
      event: event.eventName,
      blogId: event.contentIds?.[0] || event.customData?.blog_id || null,
      platform: event.customData?.platform || null,
      timestamp: event.timestamp.toISOString(),
      value: event.value || null,
    }));

    // Format viral data
    const formattedViralData = viralContent.map(content => ({
      blogId: content.blogId,
      shares: content.shares,
      facebookShares: content.facebookShares,
      viralCoefficient: content.viralCoefficient,
      reach: content.reach,
      engagement: content.engagement,
      timeSpent: content.timeSpent,
      romanianEngagement: content.romanianEngagement,
    }));

    return NextResponse.json({
      overview: {
        totalEvents,
        viralShares,
        blogEngagements,
        purchasesFromBlog,
        totalRevenue: totalRevenue._sum.value || 0,
      },
      viralData: formattedViralData,
      recentEvents: formattedRecentEvents,
    });
  } catch (error) {
    console.error("Failed to fetch Facebook Pixel analytics:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch Facebook Pixel analytics",
        overview: {
          totalEvents: 0,
          viralShares: 0,
          blogEngagements: 0,
          purchasesFromBlog: 0,
          totalRevenue: 0,
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

    if (!eventName) {
      return NextResponse.json(
        { error: "Event name is required" },
        { status: 400 }
      );
    }

    // Store the Facebook Pixel event
    const event = await prisma.facebookPixelEvent.create({
      data: {
        eventName,
        eventId,
        pixelId: process.env.FACEBOOK_PIXEL_ID,
        userId,
        sessionId,
        value,
        currency,
        contentType,
        contentIds,
        contentName,
        contentCategory,
        searchString,
        customData,
        userData,
        pageUrl,
        referrer,
        userAgent,
        ipAddress,
      },
    });

    // If it's a viral share event, update viral content metrics
    if (eventName === "ViralShare" && contentIds.length > 0) {
      const blogId = contentIds[0];
      const platform = customData?.platform || "facebook";

      await prisma.romanianViralContent.upsert({
        where: {
          blogId: blogId,
        },
        update: {
          shares: {
            increment: 1,
          },
          facebookShares:
            platform === "facebook" ? { increment: 1 } : undefined,
          instagramShares:
            platform === "instagram" ? { increment: 1 } : undefined,
          lastCalculatedAt: new Date(),
        },
        create: {
          blogId,
          shares: 1,
          facebookShares: platform === "facebook" ? 1 : 0,
          instagramShares: platform === "instagram" ? 1 : 0,
          viralCoefficient: 1.0,
          reach: 1,
          engagement: 1,
          romanianEngagement: 1,
        },
      });
    }

    // If it's a blog engagement event, update engagement metrics
    if (eventName === "BlogEngagement" && contentIds.length > 0) {
      const blogId = contentIds[0];
      const timeSpent = customData?.time_spent || 0;

      await prisma.romanianViralContent.upsert({
        where: {
          blogId: blogId,
        },
        update: {
          engagement: {
            increment: 1,
          },
          romanianEngagement: {
            increment: 1,
          },
          timeSpent: timeSpent > 0 ? timeSpent : undefined,
          lastCalculatedAt: new Date(),
        },
        create: {
          blogId,
          shares: 0,
          facebookShares: 0,
          instagramShares: 0,
          viralCoefficient: 1.0,
          reach: 1,
          engagement: 1,
          romanianEngagement: 1,
          timeSpent: timeSpent > 0 ? timeSpent : 0,
        },
      });
    }

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        eventName: event.eventName,
        timestamp: event.timestamp,
      },
    });
  } catch (error) {
    console.error("Failed to store Facebook Pixel event:", error);
    return NextResponse.json(
      { error: "Failed to store Facebook Pixel event" },
      { status: 500 }
    );
  }
}
