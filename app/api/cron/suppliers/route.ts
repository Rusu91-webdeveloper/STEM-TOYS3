import { NextRequest, NextResponse } from "next/server";

import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { isSupplierSyncHour } from "@/lib/suppliers/schedule";
import { runSupplierFeedSync } from "@/lib/suppliers/sync";

export const maxDuration = 60;

function handleSync(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!isAuthorizedCronRequest(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    request.nextUrl.searchParams.get("scheduled") === "1" &&
    !isSupplierSyncHour(new Date())
  ) {
    return NextResponse.json({
      success: true,
      skipped: "Outside 06:00/18:00 Europe/Bucharest schedule",
    });
  }

  const feedId = request.nextUrl.searchParams.get("feedId") ?? undefined;
  const supplierId =
    request.nextUrl.searchParams.get("supplierId") ?? undefined;

  return runSupplierFeedSync({
    feedId,
    supplierId,
  })
    .then(result => {
      const success = result.every(feed => feed.status !== "FAILED");
      return NextResponse.json(
        { success, feeds: result, timestamp: new Date().toISOString() },
        { status: success ? 200 : 503 }
      );
    })
    .catch(error => {
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
