import { NextResponse } from "next/server";
import { gscService } from "@/lib/services/google-search-console-service";

/**
 * Admin-only proxy for manually triggering SEO analytics collection.
 * Auth is enforced by the middleware (admin role required).
 * The cron secret never leaves the server.
 */
export async function POST() {
    try {
        const result = await gscService.saveDailySEOAnalytics();

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: "SEO analytics data collected successfully",
                recordsSaved: result.recordsSaved,
                timestamp: new Date().toISOString(),
            });
        }

        return NextResponse.json(
            {
                success: false,
                message: "Failed to collect SEO analytics data",
                errors: result.errors,
            },
            { status: 500 }
        );
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
