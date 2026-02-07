import { NextRequest, NextResponse } from "next/server";

import { runSupplierFeedSync } from "@/lib/suppliers/sync";

function handleSync(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feedId = request.nextUrl.searchParams.get("feedId") ?? undefined;
  const supplierId =
    request.nextUrl.searchParams.get("supplierId") ?? undefined;

  return runSupplierFeedSync({ feedId, supplierId }).then(result =>
    NextResponse.json({
      success: true,
      feeds: result,
      timestamp: new Date().toISOString(),
    })
  ).catch(error => {
    console.error("❌ Supplier feed sync failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Supplier feed sync failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  });
}

/** POST preferred for cron (mutating action); GET kept for backward compatibility. */
export async function POST(request: NextRequest) {
  return handleSync(request);
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}
