import { NextRequest, NextResponse } from "next/server";

import {
  shouldAutoFulfillOrder,
  calculateProcessingTime,
  shouldHoldForReview,
  isSignatureRequired,
  getWarehouseLocation,
  getPackagingNotes,
  isQualityCheckRequired,
  shouldAlertHighValueOrder,
} from "@/lib/utils/order-processing";

/**
 * POST - Test order processing functionality
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderTotal, orderItems, shippingMethod, orderNotes } = body;

    // Test all order processing functions
    const results = {
      autoFulfillment: await shouldAutoFulfillOrder(
        orderTotal,
        orderItems || []
      ),
      processingTime: await calculateProcessingTime(
        shippingMethod || "standard"
      ),
      holdForReview: await shouldHoldForReview(orderTotal, orderNotes),
      signatureRequired: await isSignatureRequired(orderTotal),
      warehouseLocation: await getWarehouseLocation(),
      packagingNotes: await getPackagingNotes(),
      qualityCheckRequired: await isQualityCheckRequired(),
      highValueAlert: await shouldAlertHighValueOrder(orderTotal),
    };

    return NextResponse.json({
      success: true,
      data: results,
      message: "Order processing test completed successfully",
    });
  } catch (error) {
    console.error("Error testing order processing:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test order processing functionality",
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Get current order processing settings
 */
export async function GET() {
  try {
    const { getOrderProcessingSettings } = await import(
      "@/lib/utils/order-processing"
    );
    const settings = await getOrderProcessingSettings();

    return NextResponse.json({
      success: true,
      data: settings,
      message: "Order processing settings retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting order processing settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get order processing settings",
      },
      { status: 500 }
    );
  }
}
