import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Fetch store settings
    const storeSettings = await prisma.storeSettings.findFirst({
      orderBy: { createdAt: "desc" },
    });

    // Extract tax and shipping settings from JSON fields
    const taxSettings = storeSettings?.taxSettings || {
      active: false,
      rate: "21",
      includeInPrice: true,
    };

    const shippingSettings = storeSettings?.shippingSettings || {
      standard: { price: "15.99", active: true },
      express: { price: "25.99", active: true },
      priority: { price: "39.99", active: true },
      freeThreshold: { active: false, price: "200" },
    };

    // Set cache headers for static data (5 minutes)
    const response = NextResponse.json({
      taxSettings,
      shippingSettings,
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
