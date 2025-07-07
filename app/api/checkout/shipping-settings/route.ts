import { NextRequest, NextResponse } from "next/server";

import { getCached, CacheKeys } from "@/lib/cache";
import { prisma } from "@/lib/prisma";

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
        // Get the store settings from the database
        const storeSettings = await prisma.storeSettings.findFirst();

        // If no settings exist, return default values with free shipping disabled
        if (!storeSettings?.shippingSettings) {
          return {
            standard: { price: "5.99", active: true },
            express: { price: "12.99", active: true },
            freeThreshold: { price: "75.00", active: false }, // Free shipping disabled by default
          };
        }

        // Return the shipping settings
        return storeSettings.shippingSettings;
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
