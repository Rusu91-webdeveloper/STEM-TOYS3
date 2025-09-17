import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth/admin";
import { applyStandardHeaders } from "@/lib/response-headers";
import { AIConfig } from "@/lib/ai/config";
import { aiDashboard } from "@/lib/ai/monitoring-dashboard";
import { aiMonitoring } from "@/lib/ai/monitoring";

// GET - AI Monitoring Dashboard API
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || !isAdmin(session.user)) {
      return NextResponse.json(
        {
          error: "Not authorized",
          message:
            "You must be logged in as an admin to access monitoring data",
        },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const period =
      (searchParams.get("period") as "daily" | "weekly" | "monthly" | "all") ||
      "all";

    // Generate usage report
    const report = await aiDashboard.generateUsageReport(period);

    // Get health status
    const health = await aiMonitoring.getPerformanceSummary();

    // Check for cost alerts
    const alerts = await aiDashboard.checkCostAlerts();

    return applyStandardHeaders(
      NextResponse.json({
        success: true,
        report,
        health,
        alerts,
        provider: AIConfig.getProvider(),
        model: AIConfig.getModel(),
        enhancementEnabled: AIConfig.isEnhancementEnabled(),
      }),
      { cache: "private" }
    );
  } catch (error) {
    console.error("AI Monitoring dashboard error:", error);

    return applyStandardHeaders(
      NextResponse.json(
        {
          error: "Failed to retrieve monitoring data",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      ),
      { cache: "private" }
    );
  }
}

// POST - Export monitoring data
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || !isAdmin(session.user)) {
      return NextResponse.json(
        {
          error: "Not authorized",
          message:
            "You must be logged in as an admin to export monitoring data",
        },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { format = "csv" } = body;

    let exportData: string;
    let contentType: string;

    if (format === "csv") {
      exportData = await aiDashboard.exportUsageDataCSV();
      contentType = "text/csv";
    } else {
      return NextResponse.json(
        {
          error: "Invalid format",
          message: "Supported formats: csv",
        },
        { status: 400 }
      );
    }

    // Create response with the exported data
    return new NextResponse(exportData, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="ai-usage-${new Date().toISOString().split("T")[0]}.${format}"`,
      },
    });
  } catch (error) {
    console.error("AI Monitoring export error:", error);

    return NextResponse.json(
      {
        error: "Failed to export monitoring data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
