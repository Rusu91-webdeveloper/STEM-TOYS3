import { inngest } from "@/inngest/client";
import { DualProviderProductEnhancementService } from "@/lib/ai/dual-provider-product-enhancement-service";
import { SmartFallbackEnhancement } from "@/lib/ai/smart-fallback-enhancement";
import { db } from "@/lib/db";

// Helper function to generate unique slug
async function generateUniqueSlug(baseName: string): Promise<string> {
  let slug = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let counter = 1;
  let uniqueSlug = slug;

  while (await db.product.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
}

// Helper function to find or create category
async function findOrCreateCategory(categoryName: string) {
  let category = await db.category.findFirst({
    where: {
      OR: [
        { name: { equals: categoryName, mode: "insensitive" } },
        { slug: categoryName.toLowerCase().replace(/\s+/g, "-") },
      ],
    },
  });

  if (!category) {
    const slug = categoryName.toLowerCase().replace(/\s+/g, "-");
    category = await db.category.create({
      data: {
        name: categoryName,
        slug: slug,
        description: `${categoryName} - produse educaționale`,
        isActive: true,
      },
    });
  }

  return category;
}

export const enhanceProductsJob = inngest.createFunction(
  { id: "enhance-products", name: "Enhance Products with AI" },
  { event: "products/enhance.requested" },
  async ({ event, step }) => {
    const { userId, products, options, jobId, saveToDatabase, autoApprove } =
      event.data;

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

    // Save products to database if requested
    let saveResults = null;
    if (saveToDatabase && result.success) {
      saveResults = await step.run("save-products-to-database", async () => {
        const saved: any[] = [];
        const errors: any[] = [];

        console.log(
          `[Inngest] Saving ${result.enhancedProducts.length} enhanced products to database...`
        );

        // Map original products with their enhancement results
        for (let i = 0; i < result.enhancedProducts.length; i++) {
          const enhancementResult = result.enhancedProducts[i];
          const originalProduct = products[i]; // Get original product

          // Use enhanced product if available, otherwise use smart fallback
          let productToSave;
          let usedSmartFallback = false;

          if (enhancementResult.success && enhancementResult.enhancedProduct) {
            // AI enhancement succeeded - use enhanced data
            productToSave = enhancementResult.enhancedProduct;
          } else {
            // AI enhancement failed - use smart fallback enhancement
            console.log(
              `[Inngest] ⚠️  AI enhancement failed for "${originalProduct.name}"`
            );
            console.log(`[Inngest] 🔧 Applying smart fallback enhancement...`);
            productToSave =
              SmartFallbackEnhancement.enhanceProduct(originalProduct);
            usedSmartFallback = true;
            console.log(
              `[Inngest] ✅ Smart fallback applied: ${productToSave.metadata.learningOutcomes.length} learning outcomes, ${productToSave.tags.length} tags, productType: ${productToSave.metadata.productType}`
            );
          }

          const enhancedProduct = productToSave;

          try {
            // Find or create category
            const category = await findOrCreateCategory(
              enhancedProduct.category
            );

            // Generate unique slug
            const slug = await generateUniqueSlug(enhancedProduct.name);

            // Check for duplicate SKU
            if (enhancedProduct.sku) {
              const existingProduct = await db.product.findFirst({
                where: { sku: enhancedProduct.sku },
              });
              if (existingProduct) {
                errors.push({
                  product: enhancedProduct.name,
                  error: `SKU ${enhancedProduct.sku} already exists`,
                });
                continue;
              }
            }

            // Determine status
            const status = autoApprove === true ? "APPROVED" : "IN_PENDING";

            // Build metadata - DON'T override smart fallback values!
            const baseMetadata = enhancedProduct.metadata || {};
            const metadata: any = {
              ...baseMetadata,
              // Move root-level educational fields into metadata (AI returns them at root)
              learningOutcomes:
                enhancedProduct.learningOutcomes ||
                baseMetadata.learningOutcomes ||
                [],
              romanianCompetencies:
                enhancedProduct.romanianCompetencies ||
                baseMetadata.romanianCompetencies ||
                [],
              romanianCurriculumAlignment:
                enhancedProduct.romanianCurriculumAlignment ||
                baseMetadata.romanianCurriculumAlignment ||
                [],
              romanianSubjectAreas:
                enhancedProduct.romanianSubjectAreas ||
                baseMetadata.romanianSubjectAreas ||
                [],
              romanianEducationalLevel:
                enhancedProduct.romanianEducationalLevel ||
                baseMetadata.romanianEducationalLevel ||
                null,
              productType:
                enhancedProduct.productType || baseMetadata.productType || null,
              // Override ai and ingestion sections (always use fresh values)
              ai: {
                aiEnhanced: !usedSmartFallback,
                enhancedBy: usedSmartFallback
                  ? "smart-fallback"
                  : "dual-provider",
                fallbackUsed: Boolean(
                  enhancementResult.fallbackUsed || usedSmartFallback
                ),
                smartFallbackUsed: usedSmartFallback,
                enhancementTimestamp: new Date().toISOString(),
                enhancementError: enhancementResult.error || null,
              },
              ingestion: {
                createdViaAIEnhancement: true,
                enhancementTimestamp: new Date().toISOString(),
              },
            };

            // Create product in database
            const savedProduct = await db.product.create({
              data: {
                // Core fields
                name: enhancedProduct.name,
                slug: slug,
                description: enhancedProduct.description,
                price: enhancedProduct.price,
                compareAtPrice: enhancedProduct.compareAtPrice || null,
                sku: enhancedProduct.sku,
                images: enhancedProduct.images || [],
                category: {
                  connect: { id: category.id },
                },
                tags: enhancedProduct.tags || [],
                stockQuantity: enhancedProduct.stockQuantity || 0,
                weight: enhancedProduct.weight || 0.8,
                isActive: true,
                featured: false,
                status: status,

                // Only fields that exist in schema
                ageGroup: enhancedProduct.ageGroup || null,
                stemDiscipline: enhancedProduct.stemDiscipline || "GENERAL",

                // Store all other data in metadata JSON field
                attributes: enhancedProduct.attributes || {},
                metadata: metadata,
              },
              include: {
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            });

            saved.push(savedProduct);
            const enhancementStatus = enhancementResult.success
              ? "with AI enhancements"
              : "without AI (original data)";
            console.log(
              `[Inngest] ✅ Saved product: ${savedProduct.name} (${savedProduct.id}) with status ${status} - ${enhancementStatus}`
            );

            // Track AI enhancement failure (product still saved successfully)
            if (!enhancementResult.success) {
              errors.push({
                product: savedProduct.name,
                error: `AI enhancement failed: ${enhancementResult.error || "Unknown error"} (Product saved with original data)`,
                type: "enhancement_failed",
              });
            }
          } catch (error) {
            console.error(
              `[Inngest] ❌ Failed to save product ${enhancedProduct.name}:`,
              error
            );
            errors.push({
              product: enhancedProduct.name,
              error:
                error instanceof Error ? error.message : "Database save failed",
            });
          }
        }

        return {
          success: saved.length > 0,
          saved: saved.length,
          failed: errors.length,
          savedProducts: saved,
          errors: errors,
        };
      });
    }

    // Finalize: Save result to AiJob
    await step.run("save-result", async () => {
      const finalResult: any = {
        ...result,
        saveResults: saveResults || null,
      };

      await db.aiJob.update({
        where: { id: jobId },
        data: {
          status: result.success ? "COMPLETED" : "FAILED",
          result: JSON.stringify(finalResult),
          completedAt: new Date(),
          error: result.error || null,
        },
      });

      console.log(
        `[Inngest] ✅ Job ${jobId} completed. Enhanced: ${result.summary.successful}, Saved: ${saveResults?.saved || 0}`
      );
    });

    return {
      success: true,
      jobId,
      result: {
        ...result,
        saveResults: saveResults || null,
      },
    };
  }
);
