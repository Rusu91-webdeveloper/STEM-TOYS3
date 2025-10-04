import { NextResponse } from "next/server";

import { withAdminAuth } from "@/lib/authorization";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export const POST = withAdminAuth(async () => {
  try {
    const config = await db.facebookPixelConfig.findFirst({
      where: { isActive: true },
    });

    if (!config) {
      return NextResponse.json(
        {
          success: false,
          error: "No active Facebook pixel configuration found",
        },
        { status: 404 }
      );
    }

    // Test basic pixel ID format
    if (
      !config.pixelId ||
      config.pixelId.length !== 16 ||
      !/^\d+$/.test(config.pixelId)
    ) {
      return NextResponse.json({
        success: false,
        error: "Invalid pixel ID format. Should be 16 digits.",
      });
    }

    // Test Conversions API if access token is provided
    let apiTestResult = null;
    if (config.accessToken) {
      try {
        // Test API connection by making a simple request
        const testResponse = await fetch(
          `https://graph.facebook.com/v18.0/${config.pixelId}/events?access_token=${config.accessToken}`,
          {
            method: "GET",
          }
        );

        if (testResponse.ok) {
          apiTestResult = {
            success: true,
            message: "Conversions API connection successful",
          };
        } else {
          const errorData = await testResponse.json();
          apiTestResult = {
            success: false,
            message: `API Error: ${errorData.error?.message || "Unknown error"}`,
          };
        }
      } catch (apiError) {
        logger.error("Facebook API test error:", apiError);
        apiTestResult = {
          success: false,
          message: "Failed to connect to Facebook Conversions API",
        };
      }
    }

    logger.info("Facebook pixel test completed", {
      pixelId: config.pixelId,
      hasAccessToken: !!config.accessToken,
      apiTestResult,
    });

    return NextResponse.json({
      success: true,
      pixelId: config.pixelId,
      hasAccessToken: !!config.accessToken,
      apiTest: apiTestResult,
      message: "Facebook pixel configuration is valid",
    });
  } catch (error) {
    logger.error("Error testing Facebook pixel:", error);
    return NextResponse.json(
      { success: false, error: "Failed to test Facebook pixel configuration" },
      { status: 500 }
    );
  }
});
