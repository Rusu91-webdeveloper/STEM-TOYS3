import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

// GET /api/admin/email-metrics - Get email metrics for campaigns and sequences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const sequenceId = searchParams.get("sequenceId");
    const templateId = searchParams.get("templateId");

    // Build where clause for email events
    const where: any = {};

    if (campaignId) {
      where.campaignId = campaignId;
    }

    if (sequenceId) {
      where.sequenceId = sequenceId;
    }

    if (templateId) {
      where.templateId = templateId;
    }

    // Get email events and calculate metrics
    const events = await prisma.emailEvent.findMany({
      where,
      select: {
        eventType: true,
        campaignId: true,
        sequenceId: true,
        templateId: true,
        emailId: true,
        createdAt: true,
      },
    });

    // Calculate metrics
    const metrics = {
      totalSent: events.filter(e => e.eventType === "SENT").length,
      totalOpened: events.filter(e => e.eventType === "OPENED").length,
      totalClicked: events.filter(e => e.eventType === "CLICKED").length,
      totalBounced: events.filter(e => e.eventType === "BOUNCED").length,
      totalUnsubscribed: events.filter(e => e.eventType === "UNSUBSCRIBED")
        .length,
      totalDelivered: events.filter(e => e.eventType === "DELIVERED").length,
    };

    // Calculate rates
    const openRate =
      metrics.totalSent > 0
        ? (metrics.totalOpened / metrics.totalSent) * 100
        : 0;
    const clickRate =
      metrics.totalSent > 0
        ? (metrics.totalClicked / metrics.totalSent) * 100
        : 0;
    const bounceRate =
      metrics.totalSent > 0
        ? (metrics.totalBounced / metrics.totalSent) * 100
        : 0;
    const unsubscribeRate =
      metrics.totalSent > 0
        ? (metrics.totalUnsubscribed / metrics.totalSent) * 100
        : 0;
    const deliveryRate =
      metrics.totalSent > 0
        ? (metrics.totalDelivered / metrics.totalSent) * 100
        : 0;

    return NextResponse.json({
      ...metrics,
      openRate: Math.round(openRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
      bounceRate: Math.round(bounceRate * 100) / 100,
      unsubscribeRate: Math.round(unsubscribeRate * 100) / 100,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
    });
  } catch (error) {
    console.error("Error fetching email metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch email metrics" },
      { status: 500 }
    );
  }
}
