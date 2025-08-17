import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * Readiness probe endpoint for container orchestration systems
 * This endpoint checks if the application is ready to serve traffic
 * by verifying critical dependencies like database connectivity
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check database connectivity
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - dbStartTime;

    // Consider ready if database responds within 2 seconds
    if (dbResponseTime > 2000) {
      return NextResponse.json(
        {
          status: "not_ready",
          reason: "Database response too slow",
          checks: {
            database: {
              status: "slow",
              responseTime: dbResponseTime,
            },
          },
          timestamp: new Date().toISOString(),
          responseTime: Date.now() - startTime,
        },
        { status: 503 }
      );
    }

    // Check environment variables are set
    const requiredEnvVars = ["DATABASE_URL", "NEXTAUTH_SECRET"];
    const missingEnvVars = requiredEnvVars.filter(
      envVar => !process.env[envVar]
    );

    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        {
          status: "not_ready",
          reason: "Missing required environment variables",
          missing: missingEnvVars,
          timestamp: new Date().toISOString(),
          responseTime: Date.now() - startTime,
        },
        { status: 503 }
      );
    }

    // All checks passed - ready to serve traffic
    return NextResponse.json(
      {
        status: "ready",
        checks: {
          database: {
            status: "healthy",
            responseTime: dbResponseTime,
          },
          environment: {
            status: "configured",
          },
        },
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "not_ready",
        reason: "Database connection failed",
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      },
      { status: 503 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function HEAD(request: NextRequest) {
  try {
    // Quick database check for HEAD requests
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
