import { NextRequest, NextResponse } from "next/server";

import { getStoreSettings } from "@/lib/utils/store-settings";

// GET - Retrieve store settings for frontend use
export async function GET(_req: NextRequest) {
  try {
    const storeSettings = await getStoreSettings();

    // Get return threshold from shipping settings
    const shippingSettings = storeSettings.shippingSettings as any;
    const returnThreshold = shippingSettings?.freeThreshold?.price || "199.00";

    // Return only the fields needed for frontend display
    const frontendSettings = {
      storeName: storeSettings.storeName,
      storeDescription: storeSettings.storeDescription,
      contactEmail: storeSettings.contactEmail,
      contactPhone: storeSettings.contactPhone,
      businessAddress: storeSettings.businessAddress,
      businessCity: storeSettings.businessCity,
      businessState: storeSettings.businessState,
      businessCountry: storeSettings.businessCountry,
      businessPostalCode: storeSettings.businessPostalCode,
      returnThreshold,
    };

    // Set cache headers for static data (5 minutes).
    // ETag is based on content hash so browsers can use 304 Not Modified responses.
    const etag = `"store-settings-${Buffer.from(JSON.stringify(frontendSettings)).toString("base64").slice(0, 16)}"`;
    const response = NextResponse.json(frontendSettings);
    response.headers.set("Cache-Control", "public, max-age=300, s-maxage=300, stale-while-revalidate=600");
    response.headers.set("ETag", etag);

    return response;
  } catch (error) {
    console.error("Error retrieving store settings:", error);
    const response = new NextResponse(
      JSON.stringify({ error: "Failed to retrieve store settings" }),
      { status: 500 }
    );
    response.headers.set("Cache-Control", "no-cache");
    return response;
  }
}
