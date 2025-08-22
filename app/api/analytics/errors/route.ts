import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ErrorEvent } from "@/lib/utils/error-tracking";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { errors } = body;

    if (!errors || !Array.isArray(errors)) {
      return NextResponse.json(
        { success: false, error: "Invalid error data format" },
        { status: 400 }
      );
    }

    // Store errors in database
    const storedErrors = await Promise.all(
      errors.map(async (error: ErrorEvent) => {
        return await prisma.errorLog.create({
          data: {
            errorId: error.id,
            type: error.type,
            severity: error.severity,
            message: error.message,
            stack: error.stack,
            url: error.url,
            userAgent: error.userAgent,
            userId: error.userId,
            sessionId: error.sessionId,
            metadata: error.metadata,
            timestamp: new Date(error.timestamp),
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        storedCount: storedErrors.length,
        errors: storedErrors,
      },
    });
  } catch (error: any) {
    console.error("Error storing error data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to store error data" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const severity = searchParams.get("severity");
    const limit = parseInt(searchParams.get("limit") || "100");
    const days = parseInt(searchParams.get("days") || "7");
    const userId = searchParams.get("userId");

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (severity) {
      where.severity = severity;
    }

    if (userId) {
      where.userId = userId;
    }

    if (days > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      where.timestamp = {
        gte: cutoffDate,
      };
    }

    const errors = await prisma.errorLog.findMany({
      where,
      orderBy: {
        timestamp: "desc",
      },
      take: limit,
    });

    // Calculate statistics
    const totalErrors = await prisma.errorLog.count({ where });
    const errorsByType = await prisma.errorLog.groupBy({
      by: ["type"],
      where,
      _count: {
        type: true,
      },
    });

    const errorsBySeverity = await prisma.errorLog.groupBy({
      by: ["severity"],
      where,
      _count: {
        severity: true,
      },
    });

    const criticalErrors = await prisma.errorLog.count({
      where: {
        ...where,
        severity: "critical",
      },
    });

    const recentErrors = await prisma.errorLog.findMany({
      where: {
        ...where,
        timestamp: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 10,
    });

    // Calculate error rate (simplified)
    const totalRequests = totalErrors + recentErrors.length; // This would need actual request count
    const errorRate =
      totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        errors,
        statistics: {
          totalErrors,
          errorsByType: errorsByType.reduce(
            (acc, item) => {
              acc[item.type] = item._count.type;
              return acc;
            },
            {} as Record<string, number>
          ),
          errorsBySeverity: errorsBySeverity.reduce(
            (acc, item) => {
              acc[item.severity] = item._count.severity;
              return acc;
            },
            {} as Record<string, number>
          ),
          criticalErrors,
          recentErrors,
          errorRate,
          uptime: 100 - errorRate,
        },
        summary: {
          dateRange: days > 0 ? `Last ${days} days` : "All time",
          type: type || "All types",
          severity: severity || "All severities",
          userId: userId || "All users",
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching error data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch error data" },
      { status: 500 }
    );
  }
}
