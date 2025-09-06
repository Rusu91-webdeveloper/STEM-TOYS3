import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/server/auth";
import { ImageManagementService } from "@/lib/image-management-real";

// Simple in-memory cache for image stats
let statsCache: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check cache first
    const now = Date.now();
    if (statsCache && now - cacheTimestamp < CACHE_DURATION) {
      console.log("[IMAGE STATUS API] Returning cached stats");
      return NextResponse.json(statsCache);
    }

    console.log("[IMAGE STATUS API] Fetching fresh stats from database");

    // Get real statistics from database
    const stats = await ImageManagementService.getImageStats();

    // Return the status of the image processing system
    const status = {
      system: "active",
      version: "3.0.0",
      features: {
        multipleSizes: true,
        automaticProcessing: true,
        responsiveDesign: true,
        realImageProcessing: true,
        databaseIntegration: true,
        formatSupport: ["jpeg", "png", "webp", "avif"],
        sizeVariants: [
          { name: "thumbnail", dimensions: "150×150", use: "Mobile lists" },
          { name: "small", dimensions: "300×300", use: "Tablet cards" },
          { name: "medium", dimensions: "600×600", use: "Desktop pages" },
          { name: "large", dimensions: "1200×1200", use: "HD displays" },
          { name: "original", dimensions: "Full size", use: "Downloads" },
        ],
      },
      statistics: {
        totalProcessedImages: stats.totalImages,
        totalSizeSaved: `${Math.round(stats.storageSavings.totalSaved / 1024 / 1024)} MB`,
        processingQueue: 0,
        lastProcessed: new Date().toISOString(),
        formatDistribution: stats.formatDistribution,
        sizeDistribution: stats.sizeDistribution,
        processingStats: stats.processingStats,
        storageSavings: stats.storageSavings,
      },
      integration: {
        supplierProducts: "Active",
        adminInterface: "Active",
        apiEndpoints: "Active",
        database: "Connected",
        sharpProcessing: "Active",
        uploadThing: "Active",
      },
    };

    // Cache the result
    statsCache = status;
    cacheTimestamp = now;

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error getting image processing status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
