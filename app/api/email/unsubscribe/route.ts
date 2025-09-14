import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { EmailComplianceManager } from "@/lib/email/compliance-manager";

const UnsubscribeSchema = z.object({
  token: z.string().min(1, "Unsubscribe token is required"),
  reason: z.string().optional(),
  preferences: z
    .object({
      marketing: z.boolean().optional(),
      newsletter: z.boolean().optional(),
      transactional: z.boolean().optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = UnsubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { token, reason, preferences } = parsed.data;

    const complianceManager = new EmailComplianceManager();
    const result = await complianceManager.processUnsubscribe({
      email: "", // Will be extracted from token
      token,
      reason,
      preferences,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        preferences: result.preferences,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("❌ Error processing unsubscribe:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process unsubscribe",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Unsubscribe token is required",
        },
        { status: 400 }
      );
    }

    const complianceManager = new EmailComplianceManager();
    const { email, valid } = complianceManager.validateUnsubscribeToken(token);

    if (!valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired unsubscribe link",
        },
        { status: 400 }
      );
    }

    // Return unsubscribe form data
    return NextResponse.json({
      success: true,
      email,
      token,
      message: "Please confirm your unsubscribe preferences below",
    });
  } catch (error) {
    console.error("❌ Error validating unsubscribe token:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to validate token",
      },
      { status: 500 }
    );
  }
}
