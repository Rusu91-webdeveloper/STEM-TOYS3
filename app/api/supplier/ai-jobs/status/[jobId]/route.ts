import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPPLIER") {
      return NextResponse.json(
        {
          error: "Not authorized",
          message: "You must be logged in as a supplier to check job status",
        },
        { status: 403 }
      );
    }

    // Get supplier ID from session
    const supplier = await db.supplier.findUnique({
      where: { userId: session.user.id },
    });

    if (!supplier) {
      return NextResponse.json(
        {
          error: "Supplier not found",
          message: "Your supplier account could not be found",
        },
        { status: 404 }
      );
    }

    const { jobId } = params;

    // Fetch job from database
    const job = await db.aiJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json(
        {
          error: "Job not found",
          message: "The requested job could not be found",
        },
        { status: 404 }
      );
    }

    // Verify the job belongs to this supplier
    if (job.userId !== session.user.id) {
      return NextResponse.json(
        {
          error: "Access denied",
          message: "You do not have permission to view this job",
        },
        { status: 403 }
      );
    }

    // Parse input to verify supplierId matches (additional security)
    let inputData: any = {};
    try {
      inputData = JSON.parse(job.input);
    } catch (error) {
      console.error("Failed to parse job input:", error);
    }

    if (inputData.supplierId && inputData.supplierId !== supplier.id) {
      return NextResponse.json(
        {
          error: "Access denied",
          message: "This job belongs to a different supplier",
        },
        { status: 403 }
      );
    }

    // Parse result if completed
    let result: any = null;
    if (job.result) {
      try {
        result = JSON.parse(job.result);
      } catch (error) {
        console.error("Failed to parse job result:", error);
      }
    }

    // Parse error if failed
    let errorMessage: any = null;
    if (job.error) {
      try {
        errorMessage = JSON.parse(job.error);
      } catch (error) {
        // If parsing fails, use the error string as-is
        errorMessage = job.error;
      }
    }

    // Return job status
    return NextResponse.json({
      jobId: job.id,
      status: job.status, // PENDING, PROCESSING, COMPLETED, FAILED
      type: job.type,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      result: result,
      error: errorMessage,
      summary: result?.summary || null,
    });
  } catch (error) {
    console.error("Error fetching job status:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to fetch job status",
      },
      { status: 500 }
    );
  }
}
