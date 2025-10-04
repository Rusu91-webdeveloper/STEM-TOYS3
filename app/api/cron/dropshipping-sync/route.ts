import { NextRequest, NextResponse } from "next/server";

import { runDropshippingSync } from "@/lib/dropshipping-tracker";

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron job request (you can add authentication here)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔄 Starting scheduled dropshipping sync...");

    const result = await runDropshippingSync();

    console.log("✅ Scheduled dropshipping sync completed:", result);

    return NextResponse.json({
      success: true,
      message: "Dropshipping sync completed",
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Scheduled dropshipping sync failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Dropshipping sync failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
