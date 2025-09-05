/**
 * Marketing Email API
 * Endpoint for sending marketing emails using configured settings
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MarketingEmailService } from "@/lib/email/marketing-email-service";

// POST - Send marketing email
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { to, templateType, variables, subject, customContent, attachments } =
      body;

    // Validate required fields
    if (!to || !templateType) {
      return NextResponse.json(
        { error: "Missing required fields: to, templateType" },
        { status: 400 }
      );
    }

    // Send marketing email
    const result = await MarketingEmailService.sendMarketingEmail({
      to,
      templateType,
      variables,
      subject,
      customContent,
      attachments,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        provider: result.provider,
        message: "Marketing email sent successfully",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error sending marketing email:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send marketing email",
      },
      { status: 500 }
    );
  }
}

// GET - Test email marketing configuration
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Test email marketing configuration
    const testResult = await MarketingEmailService.sendMarketingEmail({
      to: session.user.email || "test@example.com",
      templateType: "welcome",
      variables: {
        customerName: session.user.name || "Test User",
        email: session.user.email || "test@example.com",
      },
    });

    return NextResponse.json({
      success: testResult.success,
      message: testResult.success
        ? "Email marketing configuration is working correctly"
        : "Email marketing configuration has issues",
      error: testResult.error,
      provider: testResult.provider,
    });
  } catch (error) {
    console.error("Error testing email marketing:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test email marketing configuration",
      },
      { status: 500 }
    );
  }
}
