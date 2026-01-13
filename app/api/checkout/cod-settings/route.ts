import { NextRequest, NextResponse } from "next/server";

import { getCached, CacheKeys } from "@/lib/cache";
import { getCODSettings } from "@/lib/utils/store-settings";

// **PERFORMANCE**: Cache COD settings for 5 minutes since they rarely change
const COD_SETTINGS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * GET - Fetch COD settings for checkout
 */
export async function GET(_req: NextRequest) {
  try {
    // **PERFORMANCE**: Try to get COD settings from cache first
    const codSettings = await getCached(
      CacheKeys.product("cod-settings"), // Reusing cache key pattern
      async () => 
        // Use the utility function to get COD settings
         await getCODSettings()
      ,
      COD_SETTINGS_CACHE_TTL
    );

    // **PERFORMANCE**: Add cache headers for client-side caching
    const response = NextResponse.json(codSettings);
    response.headers.set("Cache-Control", "public, max-age=300, s-maxage=300"); // 5 minutes
    response.headers.set("X-Settings-Cache", "HIT");

    return response;
  } catch (error) {
    console.error("Error retrieving COD settings:", error);
    const response = NextResponse.json(
      { error: "Failed to retrieve COD settings" },
      { status: 500 }
    );
    response.headers.set("Cache-Control", "no-cache");
    return response;
  }
}
