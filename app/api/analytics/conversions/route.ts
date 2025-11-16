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

    // Validate each conversion before storing
    const validatedConversions = conversions.map((conversion: ConversionEvent, index: number) => {
      if (!conversion.id) {
        throw new Error(`Conversion at index ${index} is missing required field: id`);
      }
      if (!conversion.type) {
        throw new Error(`Conversion at index ${index} is missing required field: type`);
      }
      if (!conversion.timestamp) {
        throw new Error(`Conversion at index ${index} is missing required field: timestamp`);
      }
      
      return {
        conversionId: conversion.id,
        type: conversion.type,
        category: conversion.category || null,
        action: conversion.action || null,
        elementData: conversion.element || null,
        pageData: conversion.page || null,
        userData: conversion.user || null,
        contextData: conversion.context || null,
        metadata: conversion.metadata || null,
        timestamp: new Date(conversion.timestamp),
      };
    });

    // Check for existing conversions in batch to avoid duplicates
    const conversionIds = validatedConversions.map((c) => c.conversionId);
    const existingConversions = await prisma.conversionLog.findMany({
      where: {
        conversionId: { in: conversionIds },
      },
      select: { conversionId: true, timestamp: true },
    });

    const existingSet = new Set(
      existingConversions.map(
        (e) => `${e.conversionId}-${e.timestamp.getTime()}`
      )
    );

    // Filter out duplicates before attempting to store
    const conversionsToStore = validatedConversions.filter((data) => {
      const key = `${data.conversionId}-${data.timestamp.getTime()}`;
      return !existingSet.has(key);
    });

    // Store conversions in database
    // Use individual creates with error handling to ensure partial success
    const storedConversions = await Promise.allSettled(
      conversionsToStore.map(async (data) => {
        try {
          return await prisma.conversionLog.create({ data });
        } catch (individualError: any) {
          // Log the error but continue with other conversions
          console.error("Failed to store individual conversion:", {
            error: individualError.message,
            code: individualError.code,
            meta: individualError.meta,
            data: {
              conversionId: data.conversionId,
              type: data.type,
            },
          });
          throw individualError; // Re-throw to be caught by Promise.allSettled
        }
      })
    );

    // Process results
    const successful = storedConversions
      .filter((result) => result.status === "fulfilled")
      .map((result) => (result as PromiseFulfilledResult<any>).value);

    const failed = storedConversions
      .filter((result) => result.status === "rejected")
      .map((result) => (result as PromiseRejectedResult).reason);

    const skippedCount = validatedConversions.length - conversionsToStore.length;

    // Log failures for debugging
    if (failed.length > 0) {
      console.warn(`Failed to store ${failed.length} conversions:`, failed);
    }

    if (skippedCount > 0) {
      console.info(`Skipped ${skippedCount} duplicate conversions`);
    }

    return NextResponse.json({
      success: true,
      data: {
        storedCount: successful.length,
        requestedCount: conversions.length,
        skippedCount: skippedCount,
        failedCount: failed.length,
        conversions: successful,
      },
    });
  } catch (error: any) {
    console.error("Error storing conversion data:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    });
    
    // Return more detailed error information in development
    const errorMessage = process.env.NODE_ENV === "development" 
      ? error.message || "Failed to store conversion data"
      : "Failed to store conversion data";
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        ...(process.env.NODE_ENV === "development" && {
          details: {
            name: error.name,
            code: error.code,
            stack: error.stack,
          },
        }),
      },
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
