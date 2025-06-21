/**
 * API endpoint for client-side error tracking
 * POST /api/errors - Log client-side errors
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

interface ErrorReport {
  message: string;
  stack?: string;
  errorInfo?: string;
  level: "component" | "page" | "critical";
  timestamp: string;
  userAgent: string;
  url: string;
  errorId: string;
  userId?: string;
  sessionId?: string;
  additional?: Record<string, any>;
}

/**
 * POST handler - Log client-side errors
 */
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const body: ErrorReport = await request.json();

    // Validate required fields
    if (!body.message || !body.errorId || !body.timestamp) {
      return NextResponse.json(
        { error: "Missing required fields: message, errorId, timestamp" },
        { status: 400 }
      );
    }

    // Rate limiting check (simple in-memory, should use Redis in production)
    const clientIP =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      "unknown";

    // Enhanced error details
    const errorReport = {
      ...body,
      clientIP,
      receivedAt: new Date().toISOString(),
      userAgent: headersList.get("user-agent") || body.userAgent || "Unknown",
      referer: headersList.get("referer") || "",
      environment: process.env.NODE_ENV,
    };

    // Log error based on level
    if (body.level === "critical") {
      console.error(
        "🚨 CRITICAL CLIENT ERROR:",
        JSON.stringify(errorReport, null, 2)
      );
    } else if (body.level === "page") {
      console.error("📄 PAGE ERROR:", JSON.stringify(errorReport, null, 2));
    } else {
      console.warn(
        "⚠️  COMPONENT ERROR:",
        JSON.stringify(errorReport, null, 2)
      );
    }

    // In production, you would:
    // 1. Save to database
    // 2. Send to external error tracking service (Sentry, LogRocket, etc.)
    // 3. Send alerts for critical errors
    // 4. Aggregate and analyze error patterns

    if (process.env.NODE_ENV === "production") {
      // Example: Save to database
      // await db.errorLog.create({ data: errorReport });
      // Example: Send to external service
      // await sendToSentry(errorReport);
      // Example: Send critical error alerts
      // if (body.level === 'critical') {
      //   await sendCriticalErrorAlert(errorReport);
      // }
    }

    return NextResponse.json({
      success: true,
      errorId: body.errorId,
      message: "Error logged successfully",
    });
  } catch (error) {
    console.error("Error in error tracking endpoint:", error);

    return NextResponse.json(
      {
        error: "Failed to log error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler - Get error statistics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // This would require authentication check for admin users
    // For now, just return a simple response

    return NextResponse.json({
      message: "Error tracking endpoint is active",
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in error tracking GET endpoint:", error);

    return NextResponse.json(
      { error: "Failed to fetch error statistics" },
      { status: 500 }
    );
  }
}

/**
 * Helper function to send critical error alerts
 * In production, this could send emails, Slack messages, etc.
 */
async function sendCriticalErrorAlert(
  errorReport: ErrorReport & { clientIP: string }
) {
  // Placeholder for alert system
  console.error("🚨 CRITICAL ERROR ALERT:", {
    errorId: errorReport.errorId,
    message: errorReport.message,
    url: errorReport.url,
    timestamp: errorReport.timestamp,
    userAgent: errorReport.userAgent,
    clientIP: errorReport.clientIP,
  });

  // In production, implement:
  // - Email notifications to dev team
  // - Slack/Discord webhooks
  // - PagerDuty/OpsGenie integration
  // - SMS alerts for severe issues
}

/**
 * Disable caching for error reports
 */
export const dynamic = "force-dynamic";
