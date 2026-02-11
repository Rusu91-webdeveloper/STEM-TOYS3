import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  debugFanCourierFanboxPickupPoints,
  getFanCourierFanboxPickupPoints,
  isFanCourierConfigured,
} from "@/lib/integrations/fancourier/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isFanCourierConfigured()) {
      return NextResponse.json({
        success: true,
        configured: false,
        points: [],
        total: 0,
        reason: "FANCOURIER_NOT_CONFIGURED",
      });
    }

    const county = request.nextUrl.searchParams.get("state") || "";
    const locality = request.nextUrl.searchParams.get("city") || "";
    const postalCode = request.nextUrl.searchParams.get("postalCode") || "";
    const search = request.nextUrl.searchParams.get("search") || "";
    const debug = request.nextUrl.searchParams.get("debug") === "1";

    const filteredPoints = await getFanCourierFanboxPickupPoints({
      county,
      locality,
      // City-level FANbox selection: ignore postal code when locality is present.
      postalCode: locality ? "" : postalCode,
      search,
    });
    let points = filteredPoints;
    let fallbackUsed = false;

    if (
      points.length === 0 &&
      (county || locality || postalCode || search)
    ) {
      const unfiltered = await getFanCourierFanboxPickupPoints();
      points = unfiltered.slice(0, 500);
      fallbackUsed = points.length > 0;
    }

    const response = NextResponse.json({
      success: true,
      configured: true,
      points,
      total: points.length,
      filteredTotal: filteredPoints.length,
      fallbackUsed,
      diagnostics:
        debug || points.length === 0
          ? await debugFanCourierFanboxPickupPoints()
          : undefined,
    });
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error) {
    console.error("Error fetching FANbox pickup points:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch FANbox pickup points",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
