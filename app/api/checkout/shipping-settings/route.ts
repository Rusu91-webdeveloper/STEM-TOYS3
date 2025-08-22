import { NextRequest, NextResponse } from "next/server";

import { getCached, CacheKeys } from "@/lib/cache";
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
      async () => {
        // Use the utility function to get shipping settings
        return await getShippingSettings();
      },
      SHIPPING_SETTINGS_CACHE_TTL
    );

    // **PERFORMANCE**: Add cache headers for client-side caching
    const response = NextResponse.json(shippingSettings);
    response.headers.set("Cache-Control", "public, max-age=300, s-maxage=300"); // 5 minutes
    response.headers.set("X-Settings-Cache", "HIT");

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
