import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getEmailAnalytics,
  getEmailPerformanceSummary,
} from "@/lib/email/monitoring";

const AnalyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  provider: z.string().optional(),
  templateId: z.string().optional(),
  campaignId: z.string().optional(),
  userId: z.string().optional(),
  summary: z.boolean().optional(),
  days: z.number().min(1).max(365).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());

    // Convert days to number if present
    if (query.days) {
      query.days = parseInt(query.days as string);
    }

    const parsed = AnalyticsQuerySchema.safeParse(query);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      startDate,
      endDate,
      provider,
      templateId,
      campaignId,
      userId,
      summary,
      days,
    } = parsed.data;

    // Handle summary request
    if (summary) {
      const performanceSummary = await getEmailPerformanceSummary(days || 30);
      return NextResponse.json({
        success: true,
        data: performanceSummary,
      });
    }

    // Handle detailed analytics request
    const analytics = await getEmailAnalytics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      {
        provider,
        templateId,
        campaignId,
        userId,
      }
    );

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("❌ Error fetching email analytics:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch analytics",
      },
      { status: 500 }
    );
  }
}
