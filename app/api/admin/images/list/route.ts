import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ImageManagementService } from "@/lib/image-management-real";
import { auth } from "@/lib/server/auth";
import { redis } from "@/lib/redis";
import { isRedisConfigured } from "@/lib/redis";

// Simple in-memory cache for image lists (fallback when Redis is not available)
let listCache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for image lists (shorter than status)

// Generate cache key for image list requests
function generateCacheKey(filters: any): string {
  // Create a deterministic key based on filters
  const keyParts = [
    "images:list",
    `page:${filters.page}`,
    `limit:${filters.limit}`,
    `sortBy:${filters.sortBy}`,
    `sortOrder:${filters.sortOrder}`,
  ];

  // Add optional filters to key
  if (filters.search) keyParts.push(`search:${filters.search}`);
  if (filters.format) keyParts.push(`format:${filters.format}`);
  if (filters.status) keyParts.push(`status:${filters.status}`);
  if (filters.isActive !== undefined)
    keyParts.push(`isActive:${filters.isActive}`);
  if (filters.productId) keyParts.push(`productId:${filters.productId}`);
  if (filters.dateFrom) keyParts.push(`dateFrom:${filters.dateFrom}`);
  if (filters.dateTo) keyParts.push(`dateTo:${filters.dateTo}`);

  return keyParts.join(":");
}

// List request schema
const listRequestSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  format: z.string().optional(),
  status: z.enum(["valid", "invalid", "orphaned", "processing"]).optional(),
  isActive: z.boolean().optional(),
  sortBy: z
    .enum(["uploadedAt", "filename", "size", "format"])
    .default("uploadedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  productId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const validation = listRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const filters = validation.data;
    const cacheKey = generateCacheKey(filters);

    // Check cache first (Redis or in-memory)
    const now = Date.now();
    let cachedData: any = null;

    try {
      if (isRedisConfigured) {
        const redisData = await redis.get(cacheKey);
        if (redisData) {
          const parsedData =
            typeof redisData === "string" ? JSON.parse(redisData) : redisData;
          if (
            parsedData &&
            parsedData.timestamp &&
            now - parsedData.timestamp < CACHE_DURATION
          ) {
            cachedData = parsedData.data;
            console.log(
              `[IMAGES LIST API] Returning Redis cached data for key: ${cacheKey}`
            );
          }
        }
      } else {
        // Fallback to in-memory cache
        const memoryCached = listCache.get(cacheKey);
        if (memoryCached && now - memoryCached.timestamp < CACHE_DURATION) {
          cachedData = memoryCached.data;
          console.log(
            `[IMAGES LIST API] Returning memory cached data for key: ${cacheKey}`
          );
        }
      }
    } catch (cacheError) {
      console.warn("[IMAGES LIST API] Cache read error:", cacheError);
      // Continue without cache
    }

    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
      });
    }

    console.log(
      `[IMAGES LIST API] Fetching fresh images with filters:`,
      filters
    );

    // Build filter object for the service
    const serviceFilters = {
      page: filters.page,
      limit: filters.limit,
      search: filters.search,
      format: filters.format,
      status: filters.status,
      isActive: filters.isActive,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      productId: filters.productId,
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
    };

    // Get images from service
    const result = await ImageManagementService.getImages(serviceFilters);

    console.log(
      `[IMAGES LIST API] Found ${result.images.length} images (total: ${result.total})`
    );

    // Transform images to match frontend interface
    const transformedImages = result.images.map(image => ({
      id: image.id,
      url: image.originalUrl,
      filename: image.filename,
      size: image.fileSize,
      width: image.width,
      height: image.height,
      format: image.format,
      uploadedAt: image.uploadedAt,
      tags: image.tags,
      alt: image.alt,
      status: image.status,
      isActive: image.isActive,
      productId: image.productId,
      processedSizes: image.processedSizes,
      optimizationStats: image.optimizationStats,
    }));

    const responseData = {
      images: transformedImages,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.page < result.totalPages,
        hasPrev: result.page > 1,
      },
    };

    // Cache the result
    try {
      const cacheData = {
        data: responseData,
        timestamp: now,
      };

      if (isRedisConfigured) {
        await redis.set(cacheKey, JSON.stringify(cacheData), {
          ex: Math.floor(CACHE_DURATION / 1000), // Convert to seconds for Redis
        });
        console.log(
          `[IMAGES LIST API] Cached data in Redis with key: ${cacheKey}`
        );
      } else {
        // Fallback to in-memory cache
        listCache.set(cacheKey, cacheData);
        console.log(
          `[IMAGES LIST API] Cached data in memory with key: ${cacheKey}`
        );

        // Clean up old cache entries (simple cleanup)
        if (listCache.size > 100) {
          const cutoff = now - CACHE_DURATION;
          for (const [key, value] of listCache.entries()) {
            if (value.timestamp < cutoff) {
              listCache.delete(key);
            }
          }
        }
      }
    } catch (cacheError) {
      console.warn("[IMAGES LIST API] Cache write error:", cacheError);
      // Continue without caching
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      cached: false,
    });
  } catch (error) {
    console.error("[IMAGES LIST API] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}
