import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    // Check database connection
    let dbConnection = false;
    try {
      // Try a simple query
      await db.$queryRaw`SELECT 1`;
      dbConnection = true;
    } catch (dbError) {
      logger.error("Database connection failed", dbError);
      dbConnection = false;
    }

    // Check for critical environment variables
    const envVars = {
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    };

    // Return status and environment info
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: {
        connected: dbConnection,
      },
      env: envVars,
    });
  } catch (error) {
    logger.error("Health check failed", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
