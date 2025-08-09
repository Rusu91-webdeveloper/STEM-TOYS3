import { NextRequest, NextResponse } from "next/server";

import { getCached, CacheKeys } from "@/lib/cache";
import { prisma } from "@/lib/prisma";

// **PERFORMANCE**: Cache tax settings for 5 minutes since they rarely change
const TAX_SETTINGS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// GET - Retrieve current tax settings
export async function GET(_req: NextRequest) {
  try {
    // **PERFORMANCE**: Try to get tax settings from cache first
    const taxSettingsResult = await getCached(
      CacheKeys.product("tax-settings"), // Reusing cache key pattern
      async () => {
        // Get the first settings record or create one if none exists
        let settings = await prisma.storeSettings.findFirst();

        if (!settings) {
          // Initialize default settings if none exist
          settings = await prisma.storeSettings.create({
            data: {}, // Use schema defaults
          });
        }

        // If taxSettings is not defined, provide default values
        const taxSettings = settings.taxSettings
          ? (settings.taxSettings as any)
          : {
              rate: "21",
              active: true,
              includeInPrice: true, // VAT is included in displayed prices (EU law compliance)
            };

        return { taxSettings };
      },
      TAX_SETTINGS_CACHE_TTL
    );

    // **PERFORMANCE**: Add cache headers for client-side caching
    const response = NextResponse.json(taxSettingsResult);
    response.headers.set("Cache-Control", "public, max-age=300, s-maxage=300"); // 5 minutes
    response.headers.set("X-Settings-Cache", "HIT");

    return response;
  } catch (error) {
    console.error("Error retrieving tax settings:", error);
    const response = new NextResponse(
      JSON.stringify({ error: "Failed to retrieve tax settings" }),
      { status: 500 }
    );
    response.headers.set("Cache-Control", "no-cache");
    return response;
  }
}
