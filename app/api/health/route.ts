import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

// Initialize Prisma client
const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Basic application health checks
    const healthChecks = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "unknown",
      version: process.env.npm_package_version || "unknown",
      checks: {
        database: "unknown",
        memory: "unknown",
        storage: "unknown",
      },
    };

    // Database connectivity check
    try {
      await prisma.$queryRaw`SELECT 1`;
      healthChecks.checks.database = "healthy";
    } catch (error) {
      console.error("Database health check failed:", error);
      healthChecks.checks.database = "unhealthy";
      healthChecks.status = "degraded";
    }

    // Memory usage check
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);

    if (memoryUsageMB < 500) {
      healthChecks.checks.memory = "healthy";
    } else if (memoryUsageMB < 800) {
      healthChecks.checks.memory = "warning";
      healthChecks.status = "degraded";
    } else {
      healthChecks.checks.memory = "critical";
      healthChecks.status = "unhealthy";
    }

    // Response time check
    const responseTime = Date.now() - startTime;
    healthChecks.checks.storage = responseTime < 1000 ? "healthy" : "slow";

    // Determine overall status
    const unhealthyChecks = Object.values(healthChecks.checks).filter(
      status => status === "unhealthy" || status === "critical"
    );

    if (unhealthyChecks.length > 0) {
      healthChecks.status = "unhealthy";
    }

    // Return appropriate HTTP status code
    const httpStatus =
      healthChecks.status === "healthy"
        ? 200
        : healthChecks.status === "degraded"
          ? 200
          : 503;

    return NextResponse.json(
      {
        ...healthChecks,
        responseTime: `${responseTime}ms`,
        memory: {
          heapUsed: `${memoryUsageMB}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        },
      },
      { status: httpStatus }
    );
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
        responseTime: `${Date.now() - startTime}ms`,
      },
      { status: 503 }
    );
  } finally {
    // Clean up Prisma connection
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.error("Failed to disconnect Prisma:", error);
    }
  }
}

// Support HEAD requests for simple health checks
export async function HEAD() {
  try {
    // Quick database ping
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  } finally {
    await prisma.$disconnect();
  }
}
