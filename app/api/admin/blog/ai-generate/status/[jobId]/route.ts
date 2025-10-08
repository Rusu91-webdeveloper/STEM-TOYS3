import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Next.js 15: await params before accessing properties
    const resolvedParams = await params;
    const job = await db.aiJob.findUnique({
      where: { id: resolvedParams.jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify job belongs to user
    if (job.userId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Parse the result to extract blog post info if available
    let parsedResult = null;
    let blogPost = null;

    if (job.result) {
      try {
        parsedResult = JSON.parse(job.result);
        // Extract blogPost from the Inngest result
        blogPost = parsedResult.blogPost || null;
      } catch (e) {
        console.error("Failed to parse job result:", e);
      }
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status, // PENDING | PROCESSING | COMPLETED | FAILED
      result: parsedResult,
      blogPost: blogPost, // Include blog post info for frontend
      error: job.error,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: "Failed to check job status" },
      { status: 500 }
    );
  }
}
