import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  getCODAnalytics,
  getCODRejectionReasons,
  getCODPerformanceMetrics,
} from "@/lib/analytics/cod-analytics";

/**
 * GET /api/admin/analytics/cod
 * Get COD analytics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type") || "summary"; // summary, reasons, performance

    if (type === "reasons") {
      const reasons = await getCODRejectionReasons(
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
      return NextResponse.json({ reasons });
    }

    if (type === "performance") {
      const metrics = await getCODPerformanceMetrics();
      return NextResponse.json({ metrics });
    }

    // Default: summary
    const analytics = await getCODAnalytics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error("Error fetching COD analytics:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch COD analytics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

