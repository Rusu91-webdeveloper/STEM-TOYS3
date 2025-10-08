import { inngest } from "../client";
import { DualProviderProductEnhancementService } from "@/lib/ai/dual-provider-product-enhancement-service";
import { db } from "@/lib/db";

export const enhanceProductsJob = inngest.createFunction(
  { id: "enhance-products", name: "Enhance Products with AI" },
  { event: "products/enhance.requested" },
  async ({ event, step }) => {
    const { userId, products, options, jobId } = event.data;

    // Update job status: processing
    await step.run("update-status-processing", async () => {
      await db.aiJob.update({
        where: { id: jobId },
        data: { status: "PROCESSING", startedAt: new Date() },
      });
    });

    // Enhance products (no timeout limits!)
    const result = await step.run("enhance-products-batch", async () => {
      const dualProviderEnhancement =
        new DualProviderProductEnhancementService();

      try {
        const enhancementResults =
          await dualProviderEnhancement.enhanceProductsBatch(products, {
            includeCategorization: true,
            includeRomanianOptimization:
              options?.includeRomanianOptimization ?? true,
            includeLearningOutcomes: options?.includeLearningOutcomes ?? true,
            includeStemDiscipline: options?.includeStemDiscipline ?? true,
            includeAgeGroup: options?.includeAgeGroup ?? true,
            includeProductType: options?.includeProductType ?? true,
          });

        return {
          success: true,
          enhancedProducts: enhancementResults,
          summary: {
            total: enhancementResults.length,
            successful: enhancementResults.filter(r => r.success).length,
            failed: enhancementResults.filter(r => !r.success).length,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Enhancement failed",
        };
      }
    });

    // Save result
    await step.run("save-result", async () => {
      await db.aiJob.update({
        where: { id: jobId },
        data: {
          status: result.success ? "COMPLETED" : "FAILED",
          result: JSON.stringify(result),
          completedAt: new Date(),
          error: result.error || null,
        },
      });
    });

    return { success: true, jobId, result };
  }
);
