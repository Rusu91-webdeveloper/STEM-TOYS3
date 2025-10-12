/**
 * Single Product Enhancement Job
 * Handles AI enhancement for individual products with preview generation
 */

import { inngest } from "@/inngest/client";
import { db } from "@/lib/db";
import { DualProviderProductEnhancementService } from "@/lib/ai/dual-provider-product-enhancement-service";

export const singleProductEnhancementJob = inngest.createFunction(
  {
    id: "single-product-enhancement",
    name: "Single Product AI Enhancement with Preview",
  },
  { event: "products/single-product-enhancement.requested" },
  async ({ event, step }) => {
    const { productId, aiEnhancement, jobId } = event.data;

    // Update job status: processing
    await step.run("update-status-processing", async () => {
      await db.aiJob.update({
        where: { id: jobId },
        data: { status: "PROCESSING", startedAt: new Date() },
      });
      return { status: "processing" };
    });

    // Fetch product from database
    const productData = await step.run("fetch-product", async () => {
      const product = await db.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          supplier: true,
        },
      });

      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      return product;
    });

    // Process product with AI enhancement
    const result = await step.run("enhance-product", async () => {
      const enhancementService = new DualProviderProductEnhancementService();

      try {
        // Prepare product data for enhancement
        const basicProduct = {
          name: productData.name,
          description: productData.description,
          price: productData.price,
          category: productData.category?.name || "",
          images: productData.images || [],
          sku: productData.sku || undefined,
          stockQuantity: productData.stockQuantity,
        };

        // Enhance product with selected options
        const enhancementResult = await enhancementService.enhanceProductsBatch(
          [basicProduct],
          {
            includeCategorization: true,
            includeRomanianOptimization:
              aiEnhancement.options?.includeRomanianOptimization ?? true,
            includeLearningOutcomes:
              aiEnhancement.options?.includeLearningOutcomes ?? true,
            includeStemDiscipline:
              aiEnhancement.options?.includeStemDiscipline ?? true,
            includeAgeGroup: aiEnhancement.options?.includeAgeGroup ?? true,
            includeProductType:
              aiEnhancement.options?.includeProductType ?? true,
          }
        );

        const enhancedData = enhancementResult[0];

        if (!enhancedData?.success || !enhancedData.enhancedProduct) {
          throw new Error("Enhancement failed");
        }

        // Determine which fields changed
        const changedFields: string[] = [];
        const enhanced = enhancedData.enhancedProduct;

        if (enhanced.description !== productData.description)
          changedFields.push("description");
        if (enhanced.tags?.length > (productData.tags?.length || 0))
          changedFields.push("tags");
        if (enhanced.ageGroup && enhanced.ageGroup !== productData.ageGroup)
          changedFields.push("ageGroup");
        if (
          enhanced.stemDiscipline &&
          enhanced.stemDiscipline !== productData.stemDiscipline
        )
          changedFields.push("stemDiscipline");
        if (
          enhanced.productType &&
          enhanced.productType !== productData.productType
        )
          changedFields.push("productType");
        if (
          enhanced.learningOutcomes?.length >
          (productData.learningOutcomes?.length || 0)
        )
          changedFields.push("learningOutcomes");
        if (enhanced.metadata?.seo) changedFields.push("metadata.seo");
        if (enhanced.romanianCompetencies?.length > 0)
          changedFields.push("romanianCompetencies");
        if (enhanced.romanianSubjectAreas?.length > 0)
          changedFields.push("romanianSubjectAreas");

        // Create preview structure
        return {
          success: true,
          preview: {
            original: {
              name: productData.name,
              description: productData.description,
              tags: productData.tags || [],
              ageGroup: productData.ageGroup,
              stemDiscipline: productData.stemDiscipline,
              productType: productData.productType,
              learningOutcomes: productData.learningOutcomes || [],
              metadata: productData.metadata || {},
              romanianCompetencies: productData.romanianCompetencies || [],
              romanianSubjectAreas: productData.romanianSubjectAreas || [],
            },
            enhanced: {
              name: enhanced.name || productData.name,
              description: enhanced.description || productData.description,
              tags: enhanced.tags || productData.tags || [],
              ageGroup: enhanced.ageGroup || productData.ageGroup,
              stemDiscipline:
                enhanced.stemDiscipline || productData.stemDiscipline,
              productType: enhanced.productType || productData.productType,
              learningOutcomes:
                enhanced.learningOutcomes || productData.learningOutcomes || [],
              metadata: {
                ...productData.metadata,
                seo: enhanced.metadata?.seo || productData.metadata?.seo || {},
              },
              romanianCompetencies:
                enhanced.romanianCompetencies ||
                productData.romanianCompetencies ||
                [],
              romanianSubjectAreas:
                enhanced.romanianSubjectAreas ||
                productData.romanianSubjectAreas ||
                [],
              romanianCurriculumAlignment:
                enhanced.romanianCurriculumAlignment || [],
              romanianParentGuides: enhanced.romanianParentGuides || [],
              romanianTeacherResources: enhanced.romanianTeacherResources || [],
            },
            changedFields,
          },
        };
      } catch (error) {
        console.error("Product enhancement error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Enhancement failed",
        };
      }
    });

    // Update job status: completed or failed
    await step.run("update-status-complete", async () => {
      await db.aiJob.update({
        where: { id: jobId },
        data: {
          status: result.success ? "COMPLETED" : "FAILED",
          completedAt: new Date(),
          result: JSON.stringify(result),
          error: result.success ? null : result.error,
        },
      });
      return { status: result.success ? "completed" : "failed" };
    });

    return result;
  }
);
