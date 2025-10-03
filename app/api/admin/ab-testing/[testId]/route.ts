/**
 * Individual A/B Test API Endpoints
 *
 * Operations for specific A/B tests
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ABTestingService } from "@/lib/services/ab-testing-service";

// GET - Get specific A/B test by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const { testId } = params;
    const test = await ABTestingService.getTestById(testId);

    if (!test) {
      return NextResponse.json(
        { error: "A/B test not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      test,
    });
  } catch (error) {
    console.error("Error fetching A/B test:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch A/B test",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete an A/B test
export async function DELETE(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const { testId } = params;

    // Check if test exists and is not running
    const test = await ABTestingService.getTestById(testId);
    if (!test) {
      return NextResponse.json(
        { error: "A/B test not found" },
        { status: 404 }
      );
    }

    if (test.status === "RUNNING") {
      return NextResponse.json(
        { error: "Cannot delete a running A/B test. Stop it first." },
        { status: 400 }
      );
    }

    // Delete the test (cascade will handle variants, metrics, and results)
    const { db } = await import("@/lib/db");
    await db.aBTest.delete({
      where: { id: testId },
    });

    return NextResponse.json({
      success: true,
      message: "A/B test deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting A/B test:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete A/B test",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
