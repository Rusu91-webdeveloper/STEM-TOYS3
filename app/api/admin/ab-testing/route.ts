/**
 * A/B Testing API Endpoints
 *
 * CRUD operations for A/B testing management
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ABTestingService } from "@/lib/services/ab-testing-service";
import { ABTestType, ABTestAudience } from "@prisma/client";
import { z } from "zod";

// Validation schemas
const createABTestSchema = z.object({
  name: z.string().min(1, "Test name is required"),
  description: z.string().optional(),
  type: z.nativeEnum(ABTestType),
  targetAudience: z.nativeEnum(ABTestAudience),
  variants: z
    .array(
      z.object({
        name: z.string().min(1, "Variant name is required"),
        content: z.string().min(1, "Variant content is required"),
        weight: z.number().min(0).max(100),
        isControl: z.boolean().optional(),
      })
    )
    .min(2, "At least 2 variants are required"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const updateTestStatusSchema = z.object({
  status: z.enum(["start", "pause", "stop"]),
});

// GET - Get all A/B tests
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let tests;
    switch (status) {
      case "running":
        tests = await ABTestingService.getRunningTests();
        break;
      case "completed":
        tests = await ABTestingService.getCompletedTests();
        break;
      default:
        tests = await ABTestingService.getAllTests();
    }

    return NextResponse.json({
      success: true,
      tests,
      count: tests.length,
    });
  } catch (error) {
    console.error("Error fetching A/B tests:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch A/B tests",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST - Create a new A/B test
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createABTestSchema.parse(body);

    // Parse dates if provided
    const testData = {
      ...validatedData,
      startDate: validatedData.startDate
        ? new Date(validatedData.startDate)
        : undefined,
      endDate: validatedData.endDate
        ? new Date(validatedData.endDate)
        : undefined,
      createdBy: session.user.id,
    };

    const test = await ABTestingService.createABTest(testData);

    return NextResponse.json({
      success: true,
      test,
      message: "A/B test created successfully",
    });
  } catch (error) {
    console.error("Error creating A/B test:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create A/B test",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// PUT - Update A/B test status
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get("testId");

    if (!testId) {
      return NextResponse.json(
        { error: "Test ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = updateTestStatusSchema.parse(body);

    let updatedTest;
    switch (status) {
      case "start":
        updatedTest = await ABTestingService.startTest(testId);
        break;
      case "pause":
        updatedTest = await ABTestingService.pauseTest(testId);
        break;
      case "stop":
        updatedTest = await ABTestingService.stopTest(testId);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid status update" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      test: updatedTest,
      message: `A/B test ${status}ed successfully`,
    });
  } catch (error) {
    console.error("Error updating A/B test status:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update A/B test status",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
