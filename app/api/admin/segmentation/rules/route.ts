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

// GET /api/admin/segmentation/rules - Get all email triggers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const isActive = searchParams.get("isActive");
    const type = searchParams.get("type"); // email-triggers or segmentation-rules

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (isActive !== null) where.isActive = isActive === "true";

    // Get email triggers with execution counts
    const triggers = await prisma.emailTrigger.findMany({
      where,
      include: {
        _count: {
          select: {
            executions: true,
          },
        },
      },
      orderBy: { priority: "desc" },
    });

    return NextResponse.json(triggers);
  } catch (error) {
    console.error("Error fetching email triggers:", error);
    return NextResponse.json(
      { error: "Failed to fetch email triggers" },
      { status: 500 }
    );
  }
}
