/**
 * Marketing Campaigns API
 * Endpoint for managing promotional campaigns
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CampaignService } from "@/lib/campaigns/campaign-service";

// POST - Create new campaign
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // Check authentication and admin role
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      type,
      status = "draft",
      startDate,
      endDate,
      discountPercent,
      minimumOrderAmount,
      maximumDiscountAmount,
      applicableCategories = [],
      applicableProducts = [],
      customerSegments = [],
      maxUses,
    } = body;

    // Validate required fields
    if (!name || !type || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields: name, type, startDate, endDate" },
        { status: 400 }
      );
    }

    // Create campaign
    const campaign = await CampaignService.createCampaign({
      name,
      type,
      status,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      discountPercent,
      minimumOrderAmount,
      maximumDiscountAmount,
      applicableCategories,
      applicableProducts,
      customerSegments,
      maxUses,
    });

    return NextResponse.json({
      success: true,
      campaign,
      message: "Campaign created successfully",
    });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create campaign",
      },
      { status: 500 }
    );
  }
}

// GET - Get campaigns
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    let campaigns;

    if (customerId) {
      // Get active campaigns for specific customer
      campaigns =
        await CampaignService.getActiveCampaignsForCustomer(customerId);
    } else {
      // Get all campaigns (admin only)
      if (session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Unauthorized: Admin access required" },
          { status: 403 }
        );
      }

      // TODO: Implement get all campaigns with filters
      campaigns = [];
    }

    return NextResponse.json({
      success: true,
      campaigns,
      message: "Campaigns retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting campaigns:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get campaigns",
      },
      { status: 500 }
    );
  }
}
