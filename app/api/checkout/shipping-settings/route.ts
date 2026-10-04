import { NextRequest, NextResponse } from "next/server";

import { getCached, CacheKeys } from "@/lib/cache";
import { publicShippingSettings } from "@/lib/shipping/settings";
import { getShippingSettings } from "@/lib/utils/shipping-settings";

// **PERFORMANCE**: Cache shipping settings for 5 minutes since they rarely change
const SHIPPING_SETTINGS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * GET - Fetch shipping settings for checkout
 */
export async function GET(_req: NextRequest) {
  try {
    // **PERFORMANCE**: Try to get shipping settings from cache first
    const shippingSettings = await getCached(
      CacheKeys.product("shipping-settings"), // Reusing cache key pattern
      () => getShippingSettings(),
      SHIPPING_SETTINGS_CACHE_TTL
    );

    // Keep browser cache disabled so admin changes appear immediately.
    // Server-side caching above still protects the database.
    const response = NextResponse.json(
      publicShippingSettings(shippingSettings)
    );
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("X-Settings-Cache", "SERVER");

    return response;
  } catch (error) {
    console.error("Error retrieving shipping settings:", error);
    const response = NextResponse.json(
      { error: "Failed to retrieve shipping settings" },
      { status: 500 }
    );
    response.headers.set("Cache-Control", "no-cache");
    return response;
  }
}
