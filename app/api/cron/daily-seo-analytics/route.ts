import { NextRequest, NextResponse } from "next/server";
import { gscService } from "@/lib/services/google-search-console-service";

/**
 * Cron job endpoint to save daily SEO analytics data
 * Should be called daily at 2 AM via cron job or similar scheduling service
 */
export async function GET(request: NextRequest) {
  try {
    // Basic authentication check (replace with proper auth in production)
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting daily SEO analytics data collection...");

    // Save daily SEO analytics data
    const result = await gscService.saveDailySEOAnalytics();

    if (result.success) {
      console.log(
        `Successfully saved ${result.recordsSaved} SEO analytics records`
      );

      return NextResponse.json({
        success: true,
        message: "Daily SEO analytics data saved successfully",
        recordsSaved: result.recordsSaved,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.error("Failed to save daily SEO analytics:", result.errors);

      return NextResponse.json(
        {
          success: false,
          message: "Failed to save daily SEO analytics data",
          errors: result.errors,
          recordsSaved: result.recordsSaved,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Daily SEO analytics cron job failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error during SEO analytics collection",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for manual triggering of SEO analytics collection
 * Useful for testing or manual data collection
 */
export async function POST(request: NextRequest) {
  try {
    // Allow POST for manual triggering (still check auth)
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Manually triggering SEO analytics data collection...");

    const result = await gscService.saveDailySEOAnalytics();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "SEO analytics data collected successfully",
        recordsSaved: result.recordsSaved,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to collect SEO analytics data",
          errors: result.errors,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
