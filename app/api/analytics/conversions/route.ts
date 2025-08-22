import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ConversionEvent } from "@/lib/utils/conversion-tracking";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversions } = body;

    if (!conversions || !Array.isArray(conversions)) {
      return NextResponse.json(
        { success: false, error: "Invalid conversion data format" },
        { status: 400 }
      );
    }

    // Store conversions in database
    const storedConversions = await Promise.all(
      conversions.map(async (conversion: ConversionEvent) => {
        return await prisma.conversionLog.create({
          data: {
            conversionId: conversion.id,
            type: conversion.type,
            category: conversion.category,
            action: conversion.action,
            elementData: conversion.element,
            pageData: conversion.page,
            userData: conversion.user,
            contextData: conversion.context,
            metadata: conversion.metadata,
            timestamp: new Date(conversion.timestamp),
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        storedCount: storedConversions.length,
        conversions: storedConversions,
      },
    });
  } catch (error: any) {
    console.error("Error storing conversion data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to store conversion data" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const action = searchParams.get("action");
    const limit = parseInt(searchParams.get("limit") || "100");
    const days = parseInt(searchParams.get("days") || "7");
    const userId = searchParams.get("userId");

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    if (action) {
      where.action = action;
    }

    if (userId) {
      where.userData = {
        path: ["id"],
        equals: userId,
      };
    }

    if (days > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      where.timestamp = {
        gte: cutoffDate,
      };
    }

    const conversions = await prisma.conversionLog.findMany({
      where,
      orderBy: {
        timestamp: "desc",
      },
      take: limit,
    });

    // Calculate statistics
    const totalConversions = await prisma.conversionLog.count({ where });

    const conversionsByType = await prisma.conversionLog.groupBy({
      by: ["type"],
      where,
      _count: {
        type: true,
      },
    });

    const conversionsByCategory = await prisma.conversionLog.groupBy({
      by: ["category"],
      where,
      _count: {
        category: true,
      },
    });

    const conversionsByAction = await prisma.conversionLog.groupBy({
      by: ["action"],
      where,
      _count: {
        action: true,
      },
    });

    // Calculate top performing elements
    const elementPerformance = await prisma.conversionLog.groupBy({
      by: ["elementData"],
      where,
      _count: {
        elementData: true,
      },
    });

    // Calculate user journey
    const userJourney = await calculateUserJourney(where);

    // Time-based analysis
    const timeBasedAnalysis = await calculateTimeBasedAnalysis(where);

    // Calculate conversion rate (simplified)
    const totalPageViews = totalConversions + conversions.length; // This would need actual page view count
    const conversionRate =
      totalPageViews > 0 ? (totalConversions / totalPageViews) * 100 : 0;

    // Calculate revenue impact for ecommerce conversions
    const ecommerceConversions = await prisma.conversionLog.findMany({
      where: {
        ...where,
        category: "ecommerce",
      },
    });

    const revenueImpact = calculateRevenueImpact(ecommerceConversions);

    return NextResponse.json({
      success: true,
      data: {
        conversions,
        statistics: {
          totalConversions,
          conversionRate,
          conversionsByType: conversionsByType.reduce(
            (acc, item) => {
              acc[item.type] = item._count.type;
              return acc;
            },
            {} as Record<string, number>
          ),
          conversionsByCategory: conversionsByCategory.reduce(
            (acc, item) => {
              acc[item.category] = item._count.category;
              return acc;
            },
            {} as Record<string, number>
          ),
          conversionsByAction: conversionsByAction.reduce(
            (acc, item) => {
              acc[item.action] = item._count.action;
              return acc;
            },
            {} as Record<string, number>
          ),
          topPerformingElements: elementPerformance
            .sort((a, b) => b._count.elementData - a._count.elementData)
            .slice(0, 10)
            .map(item => ({
              element: item.elementData,
              conversions: item._count.elementData,
              conversionRate:
                (item._count.elementData / totalConversions) * 100,
            })),
          userJourney,
          timeBasedAnalysis,
          revenueImpact,
        },
        summary: {
          dateRange: days > 0 ? `Last ${days} days` : "All time",
          type: type || "All types",
          category: category || "All categories",
          action: action || "All actions",
          userId: userId || "All users",
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching conversion data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch conversion data" },
      { status: 500 }
    );
  }
}

// Helper methods for calculating analytics
async function calculateUserJourney(where: any) {
  const journeySteps = [
    "page_view",
    "scroll_25%",
    "scroll_50%",
    "cta_click",
    "form_submit",
    "purchase",
  ];
  const journey: Array<{
    step: string;
    conversions: number;
    dropoffRate: number;
  }> = [];

  for (let i = 0; i < journeySteps.length; i++) {
    const step = journeySteps[i];
    const stepConversions = await prisma.conversionLog.count({
      where: {
        ...where,
        action: step,
      },
    });

    const previousStep = i > 0 ? journeySteps[i - 1] : null;
    const previousConversions = previousStep
      ? await prisma.conversionLog.count({
          where: {
            ...where,
            action: previousStep,
          },
        })
      : await prisma.conversionLog.count({ where });

    const dropoffRate =
      previousConversions > 0
        ? ((previousConversions - stepConversions) / previousConversions) * 100
        : 0;

    journey.push({
      step,
      conversions: stepConversions,
      dropoffRate,
    });
  }

  return journey;
}

async function calculateTimeBasedAnalysis(where: any) {
  const conversions = await prisma.conversionLog.findMany({
    where,
    select: {
      timestamp: true,
    },
  });

  const hourly: Record<string, number> = {};
  const daily: Record<string, number> = {};
  const weekly: Record<string, number> = {};

  conversions.forEach(conversion => {
    const date = new Date(conversion.timestamp);
    const hour = date.getHours().toString().padStart(2, "0");
    const day = date.toLocaleDateString();
    const week = getWeekNumber(date);

    hourly[hour] = (hourly[hour] || 0) + 1;
    daily[day] = (daily[day] || 0) + 1;
    weekly[week] = (weekly[week] || 0) + 1;
  });

  return { hourly, daily, weekly };
}

function calculateRevenueImpact(ecommerceConversions: any[]) {
  const totalRevenue = ecommerceConversions.reduce((sum, conv) => {
    const amount = conv.metadata?.amount || 0;
    return sum + amount;
  }, 0);

  const conversionCount = ecommerceConversions.length;
  const averageOrderValue =
    conversionCount > 0 ? totalRevenue / conversionCount : 0;
  const revenuePerConversion =
    conversionCount > 0 ? totalRevenue / conversionCount : 0;

  return {
    totalRevenue,
    averageOrderValue,
    revenuePerConversion,
  };
}

function getWeekNumber(date: Date): string {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor(
    (date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
  );
  const weekNumber = Math.ceil(days / 7);
  return `${date.getFullYear()}-W${weekNumber}`;
}
