/**
 * A/B Testing Tracking API
 *
 * Endpoint for tracking A/B test metrics from frontend
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Mock A/B Testing Service (temporary implementation)
class MockABTestingService {
  static async getTestById(testId: string) {
    // Return a mock test object
    return {
      id: testId,
      name: `Mock Test: ${testId}`,
      type: "TITLE",
      status: "RUNNING",
      isActive: true,
    };
  }

  static async trackMetric(
    testId: string,
    variantId: string,
    metricType: string,
    value: number
  ) {
    // Mock implementation - just log the action
    console.log(
      `Mock A/B testing: Tracked ${metricType} for test ${testId}, variant ${variantId}, value ${value}`
    );
  }

  static getVariantForUser(test: any, userId: string) {
    // Mock implementation - return a default variant
    return {
      id: "control",
      name: "Control Variant",
      content: "Control Content",
      isControl: true,
    };
  }
}

const ABTestingService = MockABTestingService;

// Validation schema for tracking data
const trackMetricSchema = z.object({
  testId: z.string().min(1, "Test ID is required"),
  variantId: z.string().min(1, "Variant ID is required"),
  metricType: z.enum([
    "impressions",
    "clicks",
    "conversions",
    "socialShares",
    "timeOnPage",
    "bounceRate",
  ]),
  value: z.number().min(0).default(1),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
});

// POST - Track A/B test metric
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = trackMetricSchema.parse(body);

    const { testId, variantId, metricType, value } = validatedData;

    // Track the metric
    await ABTestingService.trackMetric(testId, variantId, metricType, value);

    return NextResponse.json({
      success: true,
      message: "Metric tracked successfully",
      data: {
        testId,
        variantId,
        metricType,
        value,
      },
    });
  } catch (error) {
    console.error("Error tracking A/B test metric:", error);

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
        error: "Failed to track metric",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// GET - Get A/B test variant for user (for frontend integration)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get("testId");
    const userId = searchParams.get("userId");

    if (!testId) {
      return NextResponse.json(
        { error: "Test ID is required" },
        { status: 400 }
      );
    }

    // Get the test
    const test = await ABTestingService.getTestById(testId);
    if (!test) {
      return NextResponse.json(
        { error: "A/B test not found" },
        { status: 404 }
      );
    }

    // Get variant for user if userId provided
    let variant = null;
    if (userId) {
      variant = ABTestingService.getVariantForUser(test, userId);
    }

    return NextResponse.json({
      success: true,
      test: {
        id: test.id,
        name: test.name,
        type: test.type,
        status: test.status,
        isActive: test.isActive,
      },
      variant: variant
        ? {
            id: variant.id,
            name: variant.name,
            content: variant.content,
            isControl: variant.isControl,
          }
        : null,
    });
  } catch (error) {
    console.error("Error getting A/B test variant:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get A/B test variant",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
