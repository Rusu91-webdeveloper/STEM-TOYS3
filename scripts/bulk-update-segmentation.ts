import { PrismaClient } from "@prisma/client";
import { SegmentationService } from "../lib/services/segmentation-service";
import { UserAnalyticsService } from "../lib/services/user-analytics-service";

const prisma = new PrismaClient();
const analyticsService = new UserAnalyticsService(prisma);
const segmentationService = new SegmentationService(prisma, analyticsService);

async function bulkUpdateSegmentation() {
  console.log("Starting bulk segmentation update for all users...");

  try {
    const totalUsers = await prisma.user.count();
    console.log(`Found ${totalUsers} users to process`);

    let processed = 0;
    let updated = 0;
    let errors = 0;
    const batchSize = 50; // Smaller batch size for better progress tracking

    while (processed < totalUsers) {
      const users = await prisma.user.findMany({
        select: { id: true, email: true },
        take: batchSize,
        skip: processed,
        orderBy: { createdAt: "asc" },
      });

      if (users.length === 0) break;

      console.log(
        `Processing batch ${Math.floor(processed / batchSize) + 1} (${users.length} users)...`
      );

      // Process users in parallel with controlled concurrency
      const promises = users.map(async user => {
        try {
          const result = await segmentationService.updateUserSegmentation(
            user.id
          );

          // Also update purchase metrics
          await analyticsService.updatePurchaseMetrics(user.id);
          await analyticsService.updateSocialEngagementScore(user.id);

          return { userId: user.id, success: true, segment: result.segment };
        } catch (error) {
          console.error(`Error processing user ${user.email}:`, error);
          return {
            userId: user.id,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      });

      const results = await Promise.all(promises);

      // Count results
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      updated += successful.length;
      errors += failed.length;
      processed += users.length;

      console.log(
        `Batch completed: ${successful.length} updated, ${failed.length} errors`
      );

      // Log some successful updates for visibility
      if (successful.length > 0) {
        const segments = successful.reduce(
          (acc, r) => {
            const segment = r.segment || "UNKNOWN";
            acc[segment] = (acc[segment] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        console.log("Segment distribution in this batch:", segments);
      }

      // Small delay between batches to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log("\nBulk segmentation update completed!");
    console.log(`Total processed: ${processed}`);
    console.log(`Successfully updated: ${updated}`);
    console.log(`Errors: ${errors}`);

    // Get final segment distribution
    const finalDistribution = await prisma.user.groupBy({
      by: ["segment"],
      _count: { id: true },
    });

    console.log("\nFinal segment distribution:");
    finalDistribution.forEach(dist => {
      console.log(`${dist.segment}: ${dist._count.id} users`);
    });
  } catch (error) {
    console.error("Error in bulk segmentation update:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

bulkUpdateSegmentation();
