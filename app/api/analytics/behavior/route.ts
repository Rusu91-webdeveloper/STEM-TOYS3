import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { authOptions } from "@/lib/auth";
import { UserAnalyticsService } from "@/lib/services/user-analytics-service";
import { SegmentationService } from "@/lib/services/segmentation-service";
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

// POST /api/analytics/behavior - Track user behavior
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Allow anonymous tracking but prefer authenticated users
    const userId = session?.user?.id;

    const body = await request.json();
    const {
      eventType,
      eventData = {},
      sessionId,
      pageUrl,
      userAgent,
      ipAddress,
      timestamp,
    } = body;

    if (!eventType) {
      return NextResponse.json(
        { error: "Event type is required" },
        { status: 400 }
      );
    }

    // Track the activity
    if (userId) {
      await analyticsService.trackActivity({
        userId,
        eventType,
        eventData,
        sessionId,
        pageUrl,
        userAgent,
        ipAddress,
        timestamp: timestamp ? new Date(timestamp) : undefined,
      });

      // Check if we should update segmentation based on the event
      const shouldUpdateSegmentation = [
        "purchase_completed",
        "session_end",
        "wishlist_add",
        "wishlist_remove",
        "recommendation_click",
      ].includes(eventType);

      if (shouldUpdateSegmentation) {
        // Update segmentation in background (don't wait for it)
        segmentationService
          .updateUserSegmentation(userId)
          .catch(error => console.error("Error updating segmentation:", error));
      }

      // Update purchase metrics if it's a purchase event
      if (eventType === "purchase_completed") {
        analyticsService
          .updatePurchaseMetrics(userId)
          .catch(error =>
            console.error("Error updating purchase metrics:", error)
          );
      }

      // Process email triggers for behavior events
      await segmentationService.processBehaviorTriggers(
        userId,
        eventType,
        eventData
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking user behavior:", error);
    return NextResponse.json(
      { error: "Failed to track user behavior" },
      { status: 500 }
    );
  }
}

// GET /api/analytics/behavior - Get user behavior metrics (for authenticated users)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const metrics = await analyticsService.getUserBehaviorMetrics(
      session.user.id
    );

    if (!metrics) {
      return NextResponse.json(
        { error: "User metrics not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching user behavior metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch user behavior metrics" },
      { status: 500 }
    );
  }
}
