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

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/admin/segmentation/rules/[id] - Get a specific segmentation rule
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rule = await prisma.segmentationRule.findUnique({
      where: { id },
    });

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error("Error fetching segmentation rule:", error);
    return NextResponse.json(
      { error: "Failed to fetch segmentation rule" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/segmentation/rules/[id] - Update a segmentation rule
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const rule = await segmentationService.updateSegmentationRule(
      id,
      body
    );

    return NextResponse.json(rule);
  } catch (error) {
    console.error("Error updating segmentation rule:", error);
    return NextResponse.json(
      { error: "Failed to update segmentation rule" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/segmentation/rules/[id] - Delete a segmentation rule
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await segmentationService.deleteSegmentationRule(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting segmentation rule:", error);
    return NextResponse.json(
      { error: "Failed to delete segmentation rule" },
      { status: 500 }
    );
  }
}
