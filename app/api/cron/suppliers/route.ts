import { NextRequest, NextResponse } from "next/server";

import { runSupplierFeedSync } from "@/lib/suppliers/sync";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const feedId = request.nextUrl.searchParams.get("feedId") ?? undefined;
    const supplierId =
      request.nextUrl.searchParams.get("supplierId") ?? undefined;

    const result = await runSupplierFeedSync({ feedId, supplierId });

    return NextResponse.json({
      success: true,
      feeds: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Supplier feed sync failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Supplier feed sync failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
