import { NextRequest, NextResponse } from "next/server";

import { withAdminAuth } from "@/lib/authorization";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export const GET = withAdminAuth(async () => {
  try {
    const config = await db.tikTokPixelConfig.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!config) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      id: config.id,
      pixelId: config.pixelId,
      accessToken: config.accessToken ? "***" : undefined, // Hide actual token
      isActive: config.isActive,
      lastSyncAt: config.lastSyncAt?.toISOString(),
      metadata: config.metadata,
    });
  } catch (error) {
    logger.error("Error fetching TikTok pixel config:", error);
    return NextResponse.json(
      { error: "Failed to fetch TikTok pixel configuration" },
      { status: 500 }
    );
  }
});

export const PUT = withAdminAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { pixelId, accessToken, isActive, metadata } = body;

    if (!pixelId) {
      return NextResponse.json(
        { error: "Pixel ID is required" },
        { status: 400 }
      );
    }

    // Check if config exists
    const existingConfig = await db.tikTokPixelConfig.findFirst();

    if (existingConfig) {
      // Update existing config
      const updatedConfig = await db.tikTokPixelConfig.update({
        where: { id: existingConfig.id },
        data: {
          pixelId,
          accessToken: accessToken || existingConfig.accessToken,
          isActive: isActive ?? existingConfig.isActive,
          metadata: metadata || existingConfig.metadata,
          lastSyncAt: new Date(),
        },
      });

      logger.info("TikTok pixel config updated", {
        configId: updatedConfig.id,
      });
      return NextResponse.json({
        id: updatedConfig.id,
        pixelId: updatedConfig.pixelId,
        isActive: updatedConfig.isActive,
        lastSyncAt: updatedConfig.lastSyncAt?.toISOString(),
      });
    } else {
      // Create new config
      const newConfig = await db.tikTokPixelConfig.create({
        data: {
          pixelId,
          accessToken,
          isActive: isActive ?? false,
          metadata,
        },
      });

      logger.info("TikTok pixel config created", { configId: newConfig.id });
      return NextResponse.json({
        id: newConfig.id,
        pixelId: newConfig.pixelId,
        isActive: newConfig.isActive,
        lastSyncAt: newConfig.lastSyncAt?.toISOString(),
      });
    }
  } catch (error) {
    logger.error("Error updating TikTok pixel config:", error);
    return NextResponse.json(
      { error: "Failed to update TikTok pixel configuration" },
      { status: 500 }
    );
  }
});
