import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { authOptions } from "@/lib/auth";
import { SegmentationService } from "@/lib/services/segmentation-service";
import { UserAnalyticsService } from "@/lib/services/user-analytics-service";
import { EmailTriggerService } from "@/lib/services/email-trigger-service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const analyticsService = new UserAnalyticsService(prisma);
const emailTriggerService = new EmailTriggerService(prisma);
const segmentationService = new SegmentationService(
  prisma,
  analyticsService,
  emailTriggerService
);

// GET /api/admin/segmentation - Get segmentation analytics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    const analytics = await segmentationService.getSegmentationAnalytics(
      tenantId || undefined
    );

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching segmentation analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch segmentation analytics" },
      { status: 500 }
    );
  }
}

// POST /api/admin/segmentation/rules - Create a new segmentation rule
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const rule = await segmentationService.createSegmentationRule({
      ...body,
      createdBy: session.user.id,
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Error creating segmentation rule:", error);
    return NextResponse.json(
      { error: "Failed to create segmentation rule" },
      { status: 500 }
    );
  }
}
