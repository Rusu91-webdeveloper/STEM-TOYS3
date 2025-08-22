import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { CLS, FID, FCP, LCP, TTFB, timestamp, url, userAgent } = body;

    if (!timestamp || !url) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Store performance data in database
    const performanceData = await prisma.performanceMetric.create({
      data: {
        cls: CLS || 0,
        fid: FID || 0,
        fcp: FCP || 0,
        lcp: LCP || 0,
        ttfb: TTFB || 0,
        timestamp: new Date(timestamp),
        url,
        userAgent: userAgent || "",
        metadata: {
          ...body,
          collectedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: performanceData,
    });
  } catch (error: any) {
    console.error("Error storing performance data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to store performance data" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const limit = parseInt(searchParams.get("limit") || "100");
    const days = parseInt(searchParams.get("days") || "7");

    const where: any = {};

    if (url) {
      where.url = url;
    }

    if (days > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      where.timestamp = {
        gte: cutoffDate,
      };
    }

    const metrics = await prisma.performanceMetric.findMany({
      where,
      orderBy: {
        timestamp: "desc",
      },
      take: limit,
    });

    // Calculate averages
    const averages = metrics.reduce(
      (acc, metric) => {
        acc.cls += metric.cls;
        acc.fid += metric.fid;
        acc.fcp += metric.fcp;
        acc.lcp += metric.lcp;
        acc.ttfb += metric.ttfb;
        return acc;
      },
      { cls: 0, fid: 0, fcp: 0, lcp: 0, ttfb: 0 }
    );

    const count = metrics.length;
    if (count > 0) {
      averages.cls /= count;
      averages.fid /= count;
      averages.fcp /= count;
      averages.lcp /= count;
      averages.ttfb /= count;
    }

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        averages,
        count,
        summary: {
          totalRecords: count,
          dateRange: days > 0 ? `Last ${days} days` : "All time",
          url: url || "All URLs",
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching performance data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch performance data" },
      { status: 500 }
    );
  }
}
