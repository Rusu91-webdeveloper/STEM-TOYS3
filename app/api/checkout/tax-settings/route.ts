import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Retrieve current tax settings
export async function GET(req: NextRequest) {
  try {
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
          rate: "19",
          active: true,
          includeInPrice: false,
        };

    return NextResponse.json({ taxSettings });
  } catch (error) {
    console.error("Error retrieving tax settings:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to retrieve tax settings" }),
      { status: 500 }
    );
  }
}
