import { NextRequest, NextResponse } from "next/server";

import { getCronSecret, isAuthorizedCronRequest } from "@/lib/cron-auth";

/**
 * Cron job scheduler endpoint
 * This endpoint can be called by external cron services like Vercel Cron, GitHub Actions, etc.
 */
export async function GET(req: NextRequest) {
  try {
    // Verify this is a cron job request
    const authHeader = req.headers.get("authorization");
    if (!isAuthorizedCronRequest(authHeader)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const cronJobs = [
      {
        name: "process-orders",
        endpoint: "/api/cron/process-orders",
        description: "Process orders and handle auto-fulfillment",
        frequency: "Every 10 minutes",
        lastRun: new Date().toISOString(),
      },
      {
        name: "auto-complete-orders",
        endpoint: "/api/cron/auto-complete-orders",
        description: "Auto-complete orders after delivery time",
        frequency: "Every hour",
        lastRun: new Date().toISOString(),
      },
      {
        name: "oos-reminders",
        endpoint: "/api/cron/oos-reminders",
        description: "Send admin reminders for unresolved supplier OOS issues",
        frequency: "Every hour",
        lastRun: new Date().toISOString(),
      },
      {
        name: "courier-status-sync",
        endpoint: "/api/cron/courier-status-sync",
        description: "Sync FAN Courier / courier tracking states into order fulfillment",
        frequency: "Every hour",
        lastRun: new Date().toISOString(),
      },
    ];

    return NextResponse.json({
      success: true,
      message: "Cron job scheduler is running",
      data: {
        cronJobs,
        serverTime: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    console.error("Error in cron scheduler:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to access cron scheduler",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Manual trigger for all cron jobs (for testing)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobName } = body;

    if (!jobName) {
      return NextResponse.json(
        { success: false, error: "Job name is required" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const cronSecret = getCronSecret();

    if (!cronSecret) {
      return NextResponse.json(
        {
          success: false,
          error: "Cron secret not configured (CRON_SECRET/CRON_SECRET_TOKEN)",
        },
        { status: 500 }
      );
    }

    let endpoint = "";
    switch (jobName) {
      case "process-orders":
        endpoint = "/api/cron/process-orders";
        break;
      case "auto-complete-orders":
        endpoint = "/api/cron/auto-complete-orders";
        break;
      case "oos-reminders":
        endpoint = "/api/cron/oos-reminders";
        break;
      case "courier-status-sync":
        endpoint = "/api/cron/courier-status-sync";
        break;
      default:
        return NextResponse.json(
          { success: false, error: "Unknown job name" },
          { status: 400 }
        );
    }

    // Trigger the cron job
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: `Cron job ${jobName} triggered successfully`,
      data: {
        jobName,
        endpoint,
        response: result,
      },
    });
  } catch (error) {
    console.error("Error triggering cron job:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to trigger cron job",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
