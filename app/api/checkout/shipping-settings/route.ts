import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET - Fetch shipping settings for checkout
 */
export async function GET(req: NextRequest) {
  try {
    // Get the store settings from the database
    const storeSettings = await prisma.storeSettings.findFirst();

    // If no settings exist, return default values with free shipping disabled
    if (!storeSettings || !storeSettings.shippingSettings) {
      return NextResponse.json({
        standard: { price: "5.99", active: true },
        express: { price: "12.99", active: true },
        freeThreshold: { price: "75.00", active: false }, // Free shipping disabled by default
      });
    }

    // Return the shipping settings
    return NextResponse.json(storeSettings.shippingSettings);
  } catch (error) {
    console.error("Error retrieving shipping settings:", error);
    return NextResponse.json(
      { error: "Failed to retrieve shipping settings" },
      { status: 500 }
    );
  }
}
