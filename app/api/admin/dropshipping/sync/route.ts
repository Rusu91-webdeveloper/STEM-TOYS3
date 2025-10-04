import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { runDropshippingSync } from "@/lib/dropshipping-tracker";
import { withRateLimit } from "@/lib/rate-limit";

export const POST = withRateLimit(
  async (request: NextRequest) => {
    try {
      // Check authentication
      const session = await auth();
      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }

      // Run the dropshipping sync
      const result = await runDropshippingSync();

      return NextResponse.json({
        success: result.success,
        message: "Dropshipping sync completed",
        data: {
          updatesApplied: result.updatesApplied || 0,
          overdueOrders: result.overdueOrders || 0,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error running dropshipping sync:", error);
      return NextResponse.json(
        { error: "Failed to run dropshipping sync" },
        { status: 500 }
      );
    }
  },
  { limit: 5, windowMs: 60 * 1000 } // Rate limiting for sync operations
);
