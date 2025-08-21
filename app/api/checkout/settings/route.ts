import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const storeSettings = await prisma.storeSettings.findFirst({
      orderBy: { createdAt: "desc" },
    });

    const taxSettings = storeSettings?.taxSettings ?? {
      rate: "21",
      active: true,
      includeInPrice: true,
    };

    const shippingSettings = storeSettings?.shippingSettings ?? {
      standard: { price: "5.99", active: true },
      express: { price: "12.99", active: true },
      freeThreshold: { price: "250.00", active: true },
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
