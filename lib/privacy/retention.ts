import type { PrismaClient } from "@prisma/client";

export const AUTOMATED_RETENTION_CATEGORIES = [
  "logs",
  "analytics_data",
] as const;
export const supportsAutomaticRetention = (category: string) =>
  AUTOMATED_RETENTION_CATEGORIES.some(value => value === category);

/** Only configured operational data. Financial and consent evidence are preserved. */
export async function runRetentionCleanup(db: PrismaClient, now = new Date()) {
  const policies = await db.dataRetentionPolicy.findMany({
    where: { autoDelete: true },
  });
  const results = {
    processedPolicies: 0,
    deletedRecords: 0,
    manualReview: [] as string[],
    errors: [] as string[],
  };
  for (const policy of policies) {
    if (!supportsAutomaticRetention(policy.category)) {
      results.manualReview.push(policy.category);
      continue;
    }
    if (
      !Number.isInteger(policy.retentionPeriod) ||
      policy.retentionPeriod < 1
    ) {
      results.errors.push(policy.category);
      continue;
    }
    const cutoff = new Date(now.getTime() - policy.retentionPeriod * 86400000);
    try {
      // Bounded batches avoid long cron runs; subsequent runs continue cleanup.
      const count = await db.$transaction(async tx => {
        if (policy.category === "logs") {
          const records = await tx.emailEvent.findMany({
            where: { createdAt: { lt: cutoff } },
            select: { id: true },
            orderBy: { createdAt: "asc" },
            take: 500,
          });
          return (
            await tx.emailEvent.deleteMany({
              where: { id: { in: records.map(row => row.id) } },
            })
          ).count;
        }
        const records = await tx.performanceMetric.findMany({
          where: { timestamp: { lt: cutoff } },
          select: { id: true },
          orderBy: { timestamp: "asc" },
          take: 500,
        });
        return (
          await tx.performanceMetric.deleteMany({
            where: { id: { in: records.map(row => row.id) } },
          })
        ).count;
      });
      results.processedPolicies++;
      results.deletedRecords += count;
    } catch {
      results.errors.push(policy.category);
    }
  }
  return results;
}
