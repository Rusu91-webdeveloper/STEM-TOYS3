import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getServerSession } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { sendEmailViaUnifiedSystem } from "@/lib/email/migration-helper";

// Validation schema for sending campaign emails
const SendCampaignSchema = z.object({
  recipientEmails: z
    .array(z.string().email())
    .min(1, "At least one recipient required"),
  testMode: z.boolean().default(false),
});

// POST /api/admin/email-campaigns/[id]/send - Send campaign emails
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = SendCampaignSchema.parse(body);

    // Get the campaign
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: params.id },
      include: {
        template: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (campaign.status !== "DRAFT" && campaign.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: "Campaign must be in DRAFT or SCHEDULED status to send" },
        { status: 400 }
      );
    }

    const results = [];
    const emailEvents = [];

    // Send emails to each recipient
    for (const email of validatedData.recipientEmails) {
      try {
        // Generate unique email ID for tracking
        const emailId = `campaign-${campaign.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Send the email
        const emailResult = await sendEmailViaUnifiedSystem(
          email,
          campaign.subject,
          campaign.content,
          {
            from: process.env.EMAIL_FROM || "noreply@techtots.com",
            fromName: process.env.EMAIL_FROM_NAME || "TechTots STEM Store",
          }
        );

        // Record email event
        const emailEvent = await prisma.emailEvent.create({
          data: {
            emailId,
            email,
            eventType: "SENT",
            campaignId: campaign.id,
            templateId: campaign.templateId,
            metadata: {
              campaignName: campaign.name,
              templateName: campaign.template?.name,
              sentAt: new Date().toISOString(),
              messageId: emailResult.messageId,
              testMode: validatedData.testMode,
            },
          },
        });

        emailEvents.push(emailEvent);
        results.push({
          email,
          success: true,
          messageId: emailResult.messageId,
          emailId,
        });
      } catch (error) {
        console.error(`Error sending email to ${email}:`, error);

        // Record failed email event
        const emailId = `campaign-${campaign.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await prisma.emailEvent.create({
          data: {
            emailId,
            email,
            eventType: "BOUNCED",
            campaignId: campaign.id,
            templateId: campaign.templateId,
            metadata: {
              campaignName: campaign.name,
              templateName: campaign.template?.name,
              error: error instanceof Error ? error.message : "Unknown error",
              testMode: validatedData.testMode,
            },
          },
        });

        results.push({
          email,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Update campaign status if not in test mode
    if (!validatedData.testMode && results.some(r => r.success)) {
      await prisma.emailCampaign.update({
        where: { id: params.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
      });
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Campaign sent successfully. ${successCount} emails sent, ${failureCount} failed.`,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        testMode: validatedData.testMode,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error sending campaign emails:", error);
    return NextResponse.json(
      { error: "Failed to send campaign emails" },
      { status: 500 }
    );
  }
}
