import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { UserAnalyticsService } from "@/lib/services/user-analytics-service";
import { EmailTriggerService } from "@/lib/services/email-trigger-service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const analyticsService = new UserAnalyticsService(prisma);
const emailTriggerService = new EmailTriggerService(prisma);

// GET /api/admin/analytics/behavior - Get behavioral analytics dashboard data
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const dateRange = searchParams.get("dateRange");

    let parsedDateRange;
    if (dateRange) {
      try {
        parsedDateRange = JSON.parse(dateRange);
      } catch (error) {
        console.error("Invalid date range format:", error);
      }
    }

    const [behavioralAnalytics, triggerAnalytics] = await Promise.all([
      analyticsService.getBehavioralAnalytics(
        tenantId || undefined,
        parsedDateRange
      ),
      emailTriggerService.getTriggerAnalytics(),
    ]);

    return NextResponse.json({
      ...behavioralAnalytics,
      triggerAnalytics,
    });
  } catch (error) {
    console.error("Error fetching behavioral analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch behavioral analytics" },
      { status: 500 }
    );
  }
}

// POST /api/admin/analytics/behavior/churn-risk - Calculate churn risk for all users
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { batchSize = 100 } = body;

    // Start churn risk calculation process
    const calculationPromise =
      analyticsService.calculateChurnRiskForAllUsers(batchSize);

    // Return immediately with status
    return NextResponse.json({
      message: "Churn risk calculation started",
      batchSize,
      status: "processing",
    });
  } catch (error) {
    console.error("Error starting churn risk calculation:", error);
    return NextResponse.json(
      { error: "Failed to start churn risk calculation" },
      { status: 500 }
    );
  }
}
