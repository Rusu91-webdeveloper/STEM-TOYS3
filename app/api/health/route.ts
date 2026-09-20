import { NextResponse } from "next/server";

import { db } from "@/lib/db";

/**
 * Health check endpoint to verify database connectivity
 * GET /api/health
 */
export async function GET() {
  try {
    // Test database connection with a simple query
    const result = await db.$queryRaw`SELECT 1 as health`;
    
    return NextResponse.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error) {
    console.error("Health check failed:", error);
    
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
