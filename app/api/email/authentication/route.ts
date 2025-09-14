import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth/server";
import {
  checkEmailAuthentication,
  getAuthenticationHealth,
  getAuthenticationMetrics,
} from "@/lib/email/authentication-monitor";

const AuthenticationQuerySchema = z.object({
  domain: z.string().optional(),
  action: z.enum(["check", "health", "metrics"]).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const parsed = AuthenticationQuerySchema.safeParse(query);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      domain = process.env.EMAIL_DOMAIN || "techtots.ro",
      action = "health",
    } = parsed.data;

    switch (action) {
      case "check":
        const status = await checkEmailAuthentication(domain);
        return NextResponse.json({
          success: true,
          data: status,
        });

      case "health":
        const health = await getAuthenticationHealth(domain);
        return NextResponse.json({
          success: true,
          data: health,
        });

      case "metrics":
        const metrics = await getAuthenticationMetrics(domain);
        return NextResponse.json({
          success: true,
          data: metrics,
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid action. Use 'check', 'health', or 'metrics'",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("❌ Error checking email authentication:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to check authentication",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { domain = process.env.EMAIL_DOMAIN || "techtots.ro" } = body;

    // Force a fresh authentication check
    const status = await checkEmailAuthentication(domain);
    const metrics = await getAuthenticationMetrics(domain);

    return NextResponse.json({
      success: true,
      message: "Authentication check completed",
      data: {
        status,
        metrics,
        checkedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Error performing authentication check:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to perform check",
      },
      { status: 500 }
    );
  }
}
