import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  addEmailJob,
  addBatchEmailJobs,
  getQueueStats,
} from "@/lib/email/queue-system";
import { EmailJobData } from "@/lib/email/queue-system";

const EmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email()).min(1)]),
  template: z.string().min(1),
  variables: z.record(z.any()).default({}),
  subject: z.string().optional(),
  html: z.string().optional(),
  text: z.string().optional(),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  scheduledAt: z.string().datetime().optional(),
  campaignId: z.string().optional(),
  segmentId: z.string().optional(),
  tracking: z.boolean().optional(),
  personalization: z.boolean().optional(),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        content: z.string(), // base64
        contentType: z.string().optional(),
        encoding: z.string().optional(),
      })
    )
    .optional(),
});

// Add support for batch emails
const BatchEmailSchema = z.object({
  emails: z.array(EmailSchema).min(1).max(100), // Max 100 emails per batch
});

// Add support for queue stats
const QueueStatsSchema = z.object({
  action: z.literal("stats"),
});

export async function POST(request: NextRequest) {
  try {
    // Check if request has a body
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json(
        {
          success: false,
          error: "Content-Type must be application/json",
        },
        { status: 400 }
      );
    }

    // Safely parse JSON
    let json;
    try {
      const text = await request.text();
      if (!text || text.trim() === "") {
        return NextResponse.json(
          {
            success: false,
            error: "Request body cannot be empty",
          },
          { status: 400 }
        );
      }
      json = JSON.parse(text);
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
          details:
            parseError instanceof Error ? parseError.message : "Unknown error",
        },
        { status: 400 }
      );
    }

    // Handle queue stats request
    const statsParsed = QueueStatsSchema.safeParse(json);
    if (statsParsed.success) {
      const stats = await getQueueStats();
      return NextResponse.json({
        success: true,
        stats,
      });
    }

    // Handle batch email request
    const batchParsed = BatchEmailSchema.safeParse(json);
    if (batchParsed.success) {
      const jobs = await addBatchEmailJobs(batchParsed.data.emails);
      return NextResponse.json({
        success: true,
        message: `Added ${jobs.length} email jobs to queue`,
        jobIds: jobs.map(job => job.id),
      });
    }

    // Handle single email request
    const parsed = EmailSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payload",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    // Add email job to queue
    const job = await addEmailJob(parsed.data as EmailJobData);

    return NextResponse.json({
      success: true,
      message: "Email job added to queue",
      jobId: job.id,
      estimatedDelivery: new Date(
        Date.now() + (parsed.data.priority || 2) * 1000
      ).toISOString(),
    });
  } catch (error) {
    console.error("❌ Error in email API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint for queue stats and health check
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "stats") {
      const stats = await getQueueStats();
      return NextResponse.json({
        success: true,
        stats,
      });
    }

    if (action === "health") {
      return NextResponse.json({
        success: true,
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "2.0.0",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Invalid action. Use ?action=stats for queue statistics or ?action=health for health check",
        availableActions: ["stats", "health"],
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("❌ Error in GET request:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
