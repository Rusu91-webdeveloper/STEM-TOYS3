/**
 * TikTok Pixel Configuration API
 * 
 * Handles CRUD operations for TikTok pixel settings
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Retrieve TikTok pixel config (public for pixel loading)
export async function GET() {
  try {
    // Get the active config (no auth required for pixel loading)
    const config = await db.tikTokPixelConfig.findFirst({
      where: { isActive: true },
      select: {
        pixelId: true,
        isActive: true,
        lastSyncAt: true,
      },
    });

    if (!config) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "No active TikTok pixel configuration found",
      });
    }

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("Error fetching TikTok pixel config:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch TikTok pixel config" },
      { status: 500 }
    );
  }
}

// POST - Create or update TikTok pixel config (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { pixelId, accessToken, isActive = true, metadata } = body;

    if (!pixelId) {
      return NextResponse.json(
        { success: false, error: "Pixel ID is required" },
        { status: 400 }
      );
    }

    // Check if config exists
    const existingConfig = await db.tikTokPixelConfig.findFirst();

    let config;
    if (existingConfig) {
      // Update existing config
      config = await db.tikTokPixelConfig.update({
        where: { id: existingConfig.id },
        data: {
          pixelId,
          accessToken,
          isActive,
          metadata,
          lastSyncAt: new Date(),
        },
      });
    } else {
      // Create new config
      config = await db.tikTokPixelConfig.create({
        data: {
          pixelId,
          accessToken,
          isActive,
          metadata,
          lastSyncAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: config.id,
        pixelId: config.pixelId,
        isActive: config.isActive,
        lastSyncAt: config.lastSyncAt,
      },
      message: existingConfig
        ? "TikTok pixel config updated"
        : "TikTok pixel config created",
    });
  } catch (error) {
    console.error("Error saving TikTok pixel config:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save TikTok pixel config" },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate TikTok pixel (admin only)
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    // Deactivate all configs
    await db.tikTokPixelConfig.updateMany({
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: "TikTok pixel deactivated",
    });
  } catch (error) {
    console.error("Error deactivating TikTok pixel:", error);
    return NextResponse.json(
      { success: false, error: "Failed to deactivate TikTok pixel" },
      { status: 500 }
    );
  }
}
