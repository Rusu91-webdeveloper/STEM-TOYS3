/**
 * Marketing Campaigns API
 * Endpoint for managing promotional campaigns
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CampaignService } from "@/lib/campaigns/campaign-service";
import { getFilterParams } from "@/lib/utils/filtering";
import { getPaginationParams } from "@/lib/utils/pagination";
import { db } from "@/lib/db";

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

      // Get pagination params
      const { page, limit, skip } = getPaginationParams(searchParams, {
        defaultLimit: 20,
        maxLimit: 100,
      });

      // Get filter params
      const filters = getFilterParams(searchParams, [
        "status",
        "type",
        "search",
        "startDateFrom",
        "startDateTo",
        "endDateFrom",
        "endDateTo",
        "isActive",
      ]);

      // Build where clause
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {};

      // Status filter
      if (filters.status && filters.status !== "all") {
        where.status = String(filters.status);
      }

      // Type filter
      if (filters.type && filters.type !== "all") {
        where.type = String(filters.type);
      }

      // Search filter (search in name)
      if (filters.search) {
        where.name = {
          contains: String(filters.search),
          mode: "insensitive",
        };
      }

      // Date range filters
      if (filters.startDateFrom || filters.startDateTo) {
        where.startDate = {};
        if (filters.startDateFrom) {
          where.startDate.gte = new Date(String(filters.startDateFrom));
        }
        if (filters.startDateTo) {
          where.startDate.lte = new Date(String(filters.startDateTo));
        }
      }

      if (filters.endDateFrom || filters.endDateTo) {
        where.endDate = {};
        if (filters.endDateFrom) {
          where.endDate.gte = new Date(String(filters.endDateFrom));
        }
        if (filters.endDateTo) {
          where.endDate.lte = new Date(String(filters.endDateTo));
        }
      }

      // Active filter (campaigns currently within date range and active status)
      if (filters.isActive === true) {
        const now = new Date();
        where.status = "active";
        where.startDate = { ...where.startDate, lte: now };
        where.endDate = { ...where.endDate, gte: now };
      }

      // Execute queries in parallel
      const [campaignsList, totalCount] = await Promise.all([
        db.campaign.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: { applications: true },
            },
          },
        }),
        db.campaign.count({ where }),
      ]);

      campaigns = campaignsList;

      return NextResponse.json({
        success: true,
        campaigns,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit),
        },
        message: "Campaigns retrieved successfully",
      });
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
