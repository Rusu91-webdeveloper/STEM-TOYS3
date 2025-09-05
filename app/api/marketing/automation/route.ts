/**
 * Marketing Automation API
 * Endpoint for managing marketing automation workflows
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MarketingAutomationService } from "@/lib/automation/marketing-automation-service";

// POST - Process automation trigger
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, customerId, data } = body;

    // Validate required fields
    if (!type || !customerId || !data) {
      return NextResponse.json(
        { error: "Missing required fields: type, customerId, data" },
        { status: 400 }
      );
    }

    // Process automation trigger
    const results = await MarketingAutomationService.processTrigger({
      type,
      customerId,
      data,
      timestamp: new Date(),
    });

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    return NextResponse.json({
      success: successCount > 0,
      results,
      summary: {
        total: totalCount,
        successful: successCount,
        failed: totalCount - successCount,
      },
      message: `Automation trigger processed: ${successCount}/${totalCount} actions successful`,
    });
  } catch (error) {
    console.error("Error processing automation trigger:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process automation trigger",
      },
      { status: 500 }
    );
  }
}

// GET - Get customer automation workflows
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");

    if (!customerId) {
      return NextResponse.json(
        { error: "Missing required parameter: customerId" },
        { status: 400 }
      );
    }

    // Get customer workflows
    const workflows =
      await MarketingAutomationService.getCustomerWorkflows(customerId);

    return NextResponse.json({
      success: true,
      workflows,
      message: "Customer workflows retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting customer workflows:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get customer workflows",
      },
      { status: 500 }
    );
  }
}
