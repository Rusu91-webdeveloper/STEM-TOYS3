import { NextRequest, NextResponse } from "next/server";

import {
  getShippingSettings,
  getTaxSettings,
} from "@/lib/utils/store-settings";

export async function GET(_request: NextRequest) {
  try {
    // Public endpoint: checkout pricing (shipping, tax) is not sensitive
    const taxSettings = await getTaxSettings();
    const shippingSettings = await getShippingSettings();
    const checkoutAdminOnly = process.env.CHECKOUT_ADMIN_ONLY === "true";

    // Set cache headers for static data (5 minutes)
    const response = NextResponse.json({
      taxSettings,
      shippingSettings,
      checkoutAdminOnly,
    });

    // Add cache headers for better performance
    response.headers.set("Cache-Control", "public, max-age=300, s-maxage=300"); // 5 minutes
    response.headers.set("ETag", `settings-${Date.now()}`);

    return response;
  } catch (error) {
    console.error("Error fetching checkout settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}
