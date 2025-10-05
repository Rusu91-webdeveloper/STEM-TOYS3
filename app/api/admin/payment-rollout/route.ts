import { NextRequest, NextResponse } from "next/server";
import {
  getRolloutStatistics,
  updateRolloutConfig,
} from "@/lib/middleware/payment-provider";

// GET - Get current rollout statistics and configuration
export async function GET(request: NextRequest) {
  try {
    const stats = await getRolloutStatistics();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting rollout statistics:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get rollout statistics",
      },
      { status: 500 }
    );
  }
}

// POST - Update rollout configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      gradualRolloutPercentage,
      netopiaEnabled,
      stripeEnabled,
      rolloutStrategy,
    } = body;

    // Validate input
    const updates: any = {};

    if (typeof gradualRolloutPercentage === "number") {
      if (gradualRolloutPercentage < 0 || gradualRolloutPercentage > 100) {
        return NextResponse.json(
          {
            success: false,
            error: "Gradual rollout percentage must be between 0 and 100",
          },
          { status: 400 }
        );
      }
      updates.gradualRolloutPercentage = gradualRolloutPercentage;
    }

    if (typeof netopiaEnabled === "boolean") {
      updates.netopiaEnabled = netopiaEnabled;
    }

    if (typeof stripeEnabled === "boolean") {
      updates.stripeEnabled = stripeEnabled;
    }

    if (
      rolloutStrategy &&
      ["percentage", "user_id", "country", "locale"].includes(rolloutStrategy)
    ) {
      updates.rolloutStrategy = rolloutStrategy;
    }

    // Update configuration
    const result = await updateRolloutConfig(updates);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Rollout configuration updated successfully",
    });
  } catch (error) {
    console.error("Error updating rollout configuration:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update rollout configuration",
      },
      { status: 500 }
    );
  }
}
