import { NextRequest, NextResponse } from "next/server";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { withAdminAuth } from "@/lib/authorization";
import { z } from "zod";

// Validation schemas
const retentionPolicySchema = z.object({
  category: z.enum([
    "personal_data",
    "marketing_data",
    "analytics_data",
    "logs",
  ]),
  retentionPeriod: z.number().min(1).max(3650), // 1 day to 10 years
  autoDelete: z.boolean().default(true),
  description: z.string().optional(),
});

const updateRetentionPolicySchema = z.object({
  id: z.string(),
  retentionPeriod: z.number().min(1).max(3650).optional(),
  autoDelete: z.boolean().optional(),
  description: z.string().optional(),
});

/**
 * GET /api/admin/gdpr/retention - Get data retention policies
 */
export const GET = withAdminAuth(async (request: NextRequest, session) => {
  try {
    // Get all retention policies
    const policies = await db.dataRetentionPolicy.findMany({
      orderBy: { category: "asc" },
    });

    // Get retention statistics
    const stats = await getRetentionStatistics();

    return NextResponse.json({
      policies,
      statistics: stats,
    });
  } catch (error) {
    console.error("Error fetching retention policies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/gdpr/retention - Create or update retention policy
 */
export const POST = withAdminAuth(async (request: NextRequest, session) => {
  try {
    const body = await request.json();
    const validation = retentionPolicySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { category, retentionPeriod, autoDelete, description } =
      validation.data;

    // Upsert retention policy
    const policy = await db.dataRetentionPolicy.upsert({
      where: { category },
      update: {
        retentionPeriod,
        autoDelete,
        description,
        updatedAt: new Date(),
      },
      create: {
        category,
        retentionPeriod,
        autoDelete,
        description,
      },
    });

    return NextResponse.json({
      message: "Retention policy updated successfully",
      policy,
    });
  } catch (error) {
    console.error("Error updating retention policy:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

/**
 * PATCH /api/admin/gdpr/retention/[id] - Update specific retention policy
 */
export const PATCH = withAdminAuth(async (request: NextRequest, session) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json(
        { error: "Policy ID required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = updateRetentionPolicySchema.safeParse({ ...body, id });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { retentionPeriod, autoDelete, description } = validation.data;

    const policy = await db.dataRetentionPolicy.update({
      where: { id },
      data: {
        ...(retentionPeriod !== undefined && { retentionPeriod }),
        ...(autoDelete !== undefined && { autoDelete }),
        ...(description !== undefined && { description }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Retention policy updated successfully",
      policy,
    });
  } catch (error) {
    console.error("Error updating retention policy:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/gdpr/retention/cleanup - Run data cleanup based on retention policies
 */
export const PUT = withAdminAuth(async (request: NextRequest, session) => {
  try {
    const result = await runDataCleanup();

    return NextResponse.json({
      message: "Data cleanup completed",
      result,
    });
  } catch (error) {
    console.error("Error running data cleanup:", error);
    return NextResponse.json(
      { error: "Internal server error during cleanup" },
      { status: 500 }
    );
  }
});

/**
 * Get retention statistics
 */
async function getRetentionStatistics() {
  const [
    totalUsers,
    usersWithRetentionPolicy,
    recentCleanups,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({
      where: {
        dataRetention: { not: Prisma.DbNull },
      },
    }),
    db.consentLog.count({
      where: {
        consentType: "data_cleanup",
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    }),
  ]);

  return {
    totalUsers,
    usersWithRetentionPolicy,
    expiredDataCount: 0, // Simplified - would require raw SQL for JSON path comparison
    recentCleanups,
    complianceRate:
      totalUsers > 0 ? (usersWithRetentionPolicy / totalUsers) * 100 : 0,
  };
}

/**
 * Run automated data cleanup based on retention policies
 */
async function runDataCleanup() {
  const policies = await db.dataRetentionPolicy.findMany({
    where: { autoDelete: true },
  });

  const results = {
    processedPolicies: 0,
    deletedRecords: 0,
    errors: [] as Array<{ category: string; error: string }>,
  };

  for (const policy of policies) {
    try {
      const cutoffDate = new Date(
        Date.now() - policy.retentionPeriod * 24 * 60 * 60 * 1000
      );

      switch (policy.category) {
        case "logs":
          // Clean old email events
          const deletedEmailEvents = await db.emailEvent.deleteMany({
            where: {
              createdAt: { lt: cutoffDate },
            },
          });
          results.deletedRecords += deletedEmailEvents.count;

          // Clean old consent logs (keep last 100 per user)
          await db.$executeRaw`
            DELETE FROM "ConsentLog"
            WHERE "id" IN (
              SELECT "id" FROM "ConsentLog"
              WHERE "userId" IN (
                SELECT "userId" FROM "ConsentLog"
                GROUP BY "userId"
                HAVING COUNT(*) > 100
              )
              AND "createdAt" < ${cutoffDate}
              ORDER BY "createdAt" ASC
              LIMIT (
                SELECT COUNT(*) - 100 FROM "ConsentLog" c2
                WHERE c2."userId" = "ConsentLog"."userId"
              )
            )
          `;
          break;

        case "analytics_data":
          // Clean old performance metrics
          const deletedMetrics = await db.performanceMetric.deleteMany({
            where: {
              timestamp: { lt: cutoffDate },
            },
          });
          results.deletedRecords += deletedMetrics.count;
          break;

        case "marketing_data":
          // Anonymize old marketing campaign data (keep structure but remove PII)
          await db.campaignApplication.updateMany({
            where: {
              appliedAt: { lt: cutoffDate },
            },
            data: {
              metadata: {}, // Clear metadata that might contain PII
            },
          });
          break;
      }

      results.processedPolicies++;

      // Log cleanup action
      await db.consentLog.create({
        data: {
          userId: "system", // Automated cleanup
          action: "GRANTED",
          consentType: "data_cleanup",
          consentGiven: true,
          consentDetails: {
            policyCategory: policy.category,
            retentionPeriod: policy.retentionPeriod,
            cutoffDate: cutoffDate.toISOString(),
          },
        },
      });
    } catch (error) {
      console.error(`Error cleaning up ${policy.category}:`, error);
      results.errors.push({
        category: policy.category,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}
