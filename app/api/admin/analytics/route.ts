import { NextRequest, NextResponse } from "next/server";
import {
  getAnalyticsData,
  getRealTimeAnalytics,
  generateAnalyticsReport,
} from "@/lib/utils/analytics";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") || "30d";
    const type = searchParams.get("type") || "full";
    const reportType = searchParams.get("reportType") as any;

    let data;

    switch (type) {
      case "realtime":
        data = await getRealTimeAnalytics();
        break;
      case "report":
        if (!reportType) {
          return NextResponse.json(
            { error: "Report type is required for report generation" },
            { status: 400 }
          );
        }
        data = await generateAnalyticsReport(timeRange, reportType);
        break;
      case "full":
      default:
        data = await getAnalyticsData(timeRange);
        break;
    }

    return NextResponse.json({
      success: true,
      data,
      timeRange,
      type,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch analytics data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { timeRange = "30d", reportType } = body;

    if (!reportType) {
      return NextResponse.json(
        { error: "Report type is required" },
        { status: 400 }
      );
    }

    const report = await generateAnalyticsReport(timeRange, reportType);

    return NextResponse.json({
      success: true,
      report,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating analytics report:", error);
    return NextResponse.json(
      {
        error: "Failed to generate analytics report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
