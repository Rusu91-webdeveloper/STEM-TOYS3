import { NextRequest, NextResponse } from "next/server";

import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { syncCourierTrackingStatuses } from "@/lib/shipping/courier-status-sync";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!isAuthorizedCronRequest(authHeader)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get("limit") || "25", 10);
    const orderId = searchParams.get("orderId") || undefined;

    const result = await syncCourierTrackingStatuses({
      limit: Number.isFinite(limit) ? limit : 25,
      orderId,
    });

    return NextResponse.json({
      success: true,
      message: "Courier tracking sync completed",
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Courier tracking sync failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Courier tracking sync failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
