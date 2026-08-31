import { NextRequest, NextResponse } from "next/server";

import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { runSupplierFeedSync } from "@/lib/suppliers/sync";
import { summarizeSupplierSyncResults } from "@/lib/suppliers/sync-summary";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function handleSync(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!isAuthorizedCronRequest(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feedId = request.nextUrl.searchParams.get("feedId") ?? undefined;
  const supplierId =
    request.nextUrl.searchParams.get("supplierId") ?? undefined;
  const startedAt = Date.now();

  console.info("[SUPPLIER CRON] start", {
    filteredByFeed: Boolean(feedId),
    filteredBySupplier: Boolean(supplierId),
  });

  try {
    const result = await runSupplierFeedSync({ feedId, supplierId });
    const { totals: summary, failedFeeds } =
      summarizeSupplierSyncResults(result);
    const durationMs = Date.now() - startedAt;

    if (result.length === 0) {
      console.error("[SUPPLIER CRON] no active feeds", { durationMs });
      return NextResponse.json(
        {
          success: false,
          error: "No active supplier feeds matched the request",
          feeds: result,
          summary,
          durationMs,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    if (failedFeeds > 0) {
      console.error("[SUPPLIER CRON] completed with failures", {
        feedCount: result.length,
        failedFeeds,
        ...summary,
        durationMs,
      });
      return NextResponse.json(
        {
          success: false,
          error: "One or more supplier feeds failed",
          feeds: result,
          summary,
          durationMs,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    console.info("[SUPPLIER CRON] completed", {
      feedCount: result.length,
      ...summary,
      durationMs,
    });
    return NextResponse.json({
      success: true,
      feeds: result,
      summary,
      durationMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[SUPPLIER CRON] failed", {
      message: error instanceof Error ? error.message : "Unknown error",
      durationMs: Date.now() - startedAt,
    });
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

/** POST preferred for manual calls; Vercel Cron invokes GET. */
export async function POST(request: NextRequest) {
  return handleSync(request);
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}
