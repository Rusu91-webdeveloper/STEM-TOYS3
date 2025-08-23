import { NextRequest, NextResponse } from "next/server";

import { getStoreSettings } from "@/lib/utils/store-settings";

// GET - Retrieve store settings for frontend use
export async function GET(_req: NextRequest) {
  try {
    const storeSettings = await getStoreSettings();

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
    };

    // Set cache headers for static data (5 minutes)
    const response = NextResponse.json(frontendSettings);
    response.headers.set("Cache-Control", "public, max-age=300, s-maxage=300"); // 5 minutes
    response.headers.set("ETag", `store-settings-${Date.now()}`);

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
