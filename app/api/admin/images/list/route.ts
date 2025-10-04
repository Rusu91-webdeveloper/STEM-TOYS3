import { NextRequest, NextResponse } from "next/server";

import { withAdminAuth } from "@/lib/authorization";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const format = searchParams.get("format");
    const search = searchParams.get("search");

    // Build where clause
    const where: any = {};

    if (format && format !== "ALL") {
      where.format = format;
    }

    if (search) {
      where.OR = [
        { filename: { contains: search, mode: "insensitive" } },
        { alt: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await db.imageMetadata.count({ where });

    // Get images with processing logs
    const images = await db.imageMetadata.findMany({
      where,
      include: {
        processingLogs: {
          orderBy: { startedAt: "desc" },
          take: 10, // Last 10 processing operations
        },
      },
      orderBy: { uploadedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    logger.info("Images fetched successfully", {
      count: images.length,
      page,
      limit,
    });

    return NextResponse.json({
      images: images.map(img => ({
        id: img.id,
        originalUrl: img.originalUrl,
        filename: img.filename,
        fileSize: img.fileSize,
        width: img.width,
        height: img.height,
        format: img.format,
        uploadedAt: img.uploadedAt.toISOString(),
        processedSizes: img.processedSizes,
        optimizationStats: img.optimizationStats,
        tags: img.tags,
        alt: img.alt,
        description: img.description,
        processingLogs: img.processingLogs.map(log => ({
          id: log.id,
          operation: log.operation,
          status: log.status,
          startedAt: log.startedAt.toISOString(),
          completedAt: log.completedAt?.toISOString(),
          errorMessage: log.errorMessage,
        })),
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Error fetching images:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
});
