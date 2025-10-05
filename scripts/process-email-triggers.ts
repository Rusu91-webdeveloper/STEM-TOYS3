import { PrismaClient } from "@prisma/client";
import { SegmentationService } from "../lib/services/segmentation-service";
import { UserAnalyticsService } from "../lib/services/user-analytics-service";
import { EmailTriggerService } from "../lib/services/email-trigger-service";

const prisma = new PrismaClient();
const analyticsService = new UserAnalyticsService(prisma);
const emailTriggerService = new EmailTriggerService(prisma);
const segmentationService = new SegmentationService(
  prisma,
  analyticsService,
  emailTriggerService
);

async function processEmailTriggers() {
  console.log("🔄 Starting email trigger processing...");

  const startTime = Date.now();
  let processedTriggers = 0;
  let triggeredEmails = 0;

  try {
    // 1. Process time-based triggers (inactive users, etc.)
    console.log("⏰ Processing time-based triggers...");
    await segmentationService.processTimeBasedTriggers();
    processedTriggers++;

    // 2. Process any pending segment updates that might trigger emails
    // This is a good place to bulk update segmentations if needed
    console.log("📊 Processing segmentation updates...");
    await segmentationService.bulkUpdateSegmentation(100);
    processedTriggers++;

    // 3. Log trigger execution summary
    const analytics = await emailTriggerService.getTriggerAnalytics();
    const totalExecutions = analytics.executions.reduce(
      (sum, item) => sum + item._count.id,
      0
    );
    const successfulExecutions =
      analytics.executions.find(e => e.status === "success")?._count.id || 0;
    const failedExecutions =
      analytics.executions.find(e => e.status === "failed")?._count.id || 0;

    triggeredEmails = successfulExecutions;

    console.log("📈 Trigger Processing Summary:");
    console.log(`   • Total executions: ${totalExecutions}`);
    console.log(`   • Successful: ${successfulExecutions}`);
    console.log(`   • Failed: ${failedExecutions}`);
    console.log(`   • Processing time: ${Date.now() - startTime}ms`);

    // 4. Clean up old trigger executions (keep last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const deletedCount = await prisma.emailTriggerExecution.deleteMany({
      where: {
        executedAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    if (deletedCount.count > 0) {
      console.log(`🧹 Cleaned up ${deletedCount.count} old trigger executions`);
    }
  } catch (error) {
    console.error("❌ Error processing email triggers:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  console.log(`✅ Email trigger processing completed successfully!`);
  console.log(`   • Triggers processed: ${processedTriggers}`);
  console.log(`   • Emails triggered: ${triggeredEmails}`);
}

async function main() {
  try {
    await processEmailTriggers();
  } catch (error) {
    console.error("Fatal error in email trigger processing:", error);
    process.exit(1);
  }
}

// Allow running manually or as a cron job
if (require.main === module) {
  main();
}

export { processEmailTriggers };
