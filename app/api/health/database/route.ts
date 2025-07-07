import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

/**
 * Database health check endpoint
 * GET /api/health/database
 */
export async function GET(_request: NextRequest) {
  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          status: "unhealthy",
          error: "DATABASE_URL not configured",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    // Perform database health check
    const startTime = Date.now();
    await db.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;

    return NextResponse.json({
      status: "healthy",
      latency,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
