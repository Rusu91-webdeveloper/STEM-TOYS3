import { NextResponse } from "next/server";

import { withAdminAuth } from "@/lib/authorization";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export const POST = withAdminAuth(async () => {
  try {
    const config = await db.tikTokPixelConfig.findFirst({
      where: { isActive: true },
    });

    if (!config) {
      return NextResponse.json(
        { success: false, error: "No active TikTok pixel configuration found" },
        { status: 404 }
      );
    }

    // Test basic pixel ID format (TikTok pixel IDs are typically shorter)
    if (!config.pixelId || config.pixelId.length < 10) {
      return NextResponse.json({
        success: false,
        error: "Invalid pixel ID format. Pixel ID seems too short.",
      });
    }

    // Test TikTok Events API if access token is provided
    let apiTestResult = null;
    if (config.accessToken) {
      try {
        // Test API connection by making a simple request to TikTok Events API
        const testResponse = await fetch(
          `https://business-api.tiktok.com/open_api/v1.3/pixel/events/?pixel_code=${config.pixelId}`,
          {
            method: "GET",
            headers: {
              "Access-Token": config.accessToken,
              "Content-Type": "application/json",
            },
          }
        );

        if (testResponse.ok) {
          apiTestResult = {
            success: true,
            message: "TikTok Events API connection successful",
          };
        } else {
          const errorData = await testResponse.json();
          apiTestResult = {
            success: false,
            message: `API Error: ${errorData.message || "Unknown error"}`,
          };
        }
      } catch (apiError) {
        logger.error("TikTok API test error:", apiError);
        apiTestResult = {
          success: false,
          message: "Failed to connect to TikTok Events API",
        };
      }
    }

    logger.info("TikTok pixel test completed", {
      pixelId: config.pixelId,
      hasAccessToken: !!config.accessToken,
      apiTestResult,
    });

    return NextResponse.json({
      success: true,
      pixelId: config.pixelId,
      hasAccessToken: !!config.accessToken,
      apiTest: apiTestResult,
      message: "TikTok pixel configuration is valid",
    });
  } catch (error) {
    logger.error("Error testing TikTok pixel:", error);
    return NextResponse.json(
      { success: false, error: "Failed to test TikTok pixel configuration" },
      { status: 500 }
    );
  }
});
