import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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

// POST /api/admin/segmentation/users/update - Update user segmentation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, forceUpdate } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    let result;

    if (forceUpdate) {
      // Force immediate segmentation update
      result = await segmentationService.updateUserSegmentation(userId);
    } else {
      // Just evaluate current segmentation
      result = await segmentationService.evaluateUserSegmentation(userId);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating user segmentation:", error);
    return NextResponse.json(
      { error: "Failed to update user segmentation" },
      { status: 500 }
    );
  }
}

// POST /api/admin/segmentation/users/bulk-update - Bulk update user segmentation
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { batchSize = 100 } = body;

    // Start bulk update process
    const updatePromise = segmentationService.bulkUpdateSegmentation(batchSize);

    // Return immediately with status
    return NextResponse.json({
      message: "Bulk segmentation update started",
      batchSize,
      status: "processing",
    });
  } catch (error) {
    console.error("Error starting bulk segmentation update:", error);
    return NextResponse.json(
      { error: "Failed to start bulk segmentation update" },
      { status: 500 }
    );
  }
}
