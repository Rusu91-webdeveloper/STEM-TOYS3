import { NextRequest, NextResponse } from "next/server";

import { publicShippingSettings } from "@/lib/shipping/settings";
import {
  getShippingSettings,
  getTaxSettings,
} from "@/lib/utils/store-settings";

export async function GET(_request: NextRequest) {
  try {
    // Public endpoint: checkout pricing (shipping, tax) is not sensitive
    const taxSettings = await getTaxSettings();
    const rawShippingSettings = await getShippingSettings();

    // Strip legacy fields and internal metadata from shipping settings
    const cleanShippingSettings = publicShippingSettings(rawShippingSettings);

    const checkoutAdminOnly = process.env.CHECKOUT_ADMIN_ONLY === "true";

    // Pricing must reflect the latest saved settings across server instances.
    const response = NextResponse.json({
      taxSettings,
      shippingSettings: cleanShippingSettings,
      checkoutAdminOnly,
    });

    // Add cache headers for better performance
    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch (error) {
    console.error("Error fetching checkout settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}
