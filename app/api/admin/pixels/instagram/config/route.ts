/**
 * Instagram Pixel Configuration API
 * 
 * Handles CRUD operations for Instagram pixel settings
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Retrieve Instagram pixel config (public for pixel loading)
export async function GET() {
  try {
    // Get the active config (no auth required for pixel loading)
    const config = await db.instagramPixelConfig.findFirst({
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
        message: "No active Instagram pixel configuration found",
      });
    }

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("Error fetching Instagram pixel config:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch Instagram pixel config" },
      { status: 500 }
    );
  }
}

// POST - Create or update Instagram pixel config (admin only)
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
    const existingConfig = await db.instagramPixelConfig.findFirst();

    let config;
    if (existingConfig) {
      // Update existing config
      config = await db.instagramPixelConfig.update({
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
      config = await db.instagramPixelConfig.create({
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
        ? "Instagram pixel config updated"
        : "Instagram pixel config created",
    });
  } catch (error) {
    console.error("Error saving Instagram pixel config:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save Instagram pixel config" },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate Instagram pixel (admin only)
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
    await db.instagramPixelConfig.updateMany({
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: "Instagram pixel deactivated",
    });
  } catch (error) {
    console.error("Error deactivating Instagram pixel:", error);
    return NextResponse.json(
      { success: false, error: "Failed to deactivate Instagram pixel" },
      { status: 500 }
    );
  }
}
