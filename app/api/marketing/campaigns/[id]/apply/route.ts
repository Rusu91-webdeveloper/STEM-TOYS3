/**
 * Apply Campaign API
 * Endpoint for applying campaign discounts to orders
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CampaignService } from "@/lib/campaigns/campaign-service";

// POST - Apply campaign discount
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const campaignId = params.id;
    const body = await req.json();
    const { orderId, customerId, orderTotal, categoryIds = [] } = body;

    // Validate required fields
    if (!orderId || !customerId || orderTotal === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, customerId, orderTotal" },
        { status: 400 }
      );
    }

    // Apply campaign discount
    const result = await CampaignService.applyCampaignDiscount(
      campaignId,
      orderId,
      customerId,
      orderTotal,
      categoryIds
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        discountAmount: result.discountAmount,
        campaignId: result.campaignId,
        message: "Campaign discount applied successfully",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error applying campaign discount:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to apply campaign discount",
      },
      { status: 500 }
    );
  }
}
