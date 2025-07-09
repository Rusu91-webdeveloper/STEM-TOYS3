import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { serviceConfig } from "@/lib/config";
import { db } from "@/lib/db";
import { sendCouponEmail } from "@/lib/email/coupon-templates";

// Validation schema for sending coupon emails
const sendCouponEmailSchema = z.object({
  recipients: z.enum(["subscribers", "all_users", "custom"]),
  customEmails: z.array(z.string().email()).optional(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(1000).optional(),
});

// POST /api/admin/coupons/[id]/send-email - Send coupon via email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    if (!serviceConfig.isEmailServiceEnabled()) {
      return NextResponse.json(
        { error: "Email service is not configured" },
        { status: 503 } // 503 Service Unavailable
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const validatedData = sendCouponEmailSchema.parse(body);

    // Get coupon details
    const coupon = await db.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    if (!coupon.isActive) {
      return NextResponse.json(
        { error: "Cannot send emails for inactive coupons" },
        { status: 400 }
      );
    }

    // Determine recipients
    let recipients: string[] = [];

    switch (validatedData.recipients) {
      case "subscribers":
        const subscribers = await db.newsletter.findMany({
          where: { isActive: true },
          select: { email: true },
        });
        recipients = subscribers.map(s => s.email);
        break;

      case "all_users":
        const users = await db.user.findMany({
          where: {
            isActive: true,
            emailVerified: { not: null },
          },
          select: { email: true },
        });
        recipients = users.map(u => u.email);
        break;

      case "custom":
        if (
          !validatedData.customEmails ||
          validatedData.customEmails.length === 0
        ) {
          return NextResponse.json(
            { error: "Custom emails list cannot be empty" },
            { status: 400 }
          );
        }
        recipients = validatedData.customEmails;
        break;
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No recipients found" },
        { status: 400 }
      );
    }

    // Send emails in batches to avoid overwhelming the email service
    const batchSize = 50;
    const batches = [];
    for (let i = 0; i < recipients.length; i += batchSize) {
      batches.push(recipients.slice(i, i + batchSize));
    }

    let successCount = 0;
    let failureCount = 0;

    for (const batch of batches) {
      const emailPromises = batch.map(async email => {
        try {
          await sendCouponEmail({
            to: email,
            coupon,
            subject: validatedData.subject,
            message: validatedData.message,
          });
          return { email, success: true };
        } catch (error) {
          console.error(`Failed to send email to ${email}:`, error);
          return { email, success: false, error };
        }
      });

      const results = await Promise.allSettled(emailPromises);

      results.forEach(result => {
        if (result.status === "fulfilled" && result.value.success) {
          successCount++;
        } else {
          failureCount++;
        }
      });

      // Add delay between batches to be respectful to email service
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({
      message: "Coupon emails sent successfully",
      stats: {
        totalRecipients: recipients.length,
        successCount,
        failureCount,
        couponCode: coupon.code,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error sending coupon emails:", error);
    return NextResponse.json(
      { error: "Failed to send coupon emails" },
      { status: 500 }
    );
  }
}
