import { inngest } from "@/inngest/client";
import { DualProviderProductEnhancementService } from "@/lib/ai/dual-provider-product-enhancement-service";
import { EnhancedProductProcessor } from "@/lib/ai/enhanced-product-processor";
import { db } from "@/lib/db";

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Helper function to validate and correct product data
function validateAndCorrectProduct(
  product: any,
  rowNumber: number,
  results: any
) {
  try {
    // Validate meta title and description lengths
    if (product.metaTitle && product.metaTitle.length > 70) {
      product.metaTitle = product.metaTitle.substring(0, 70);
      results.warnings.push({
        row: rowNumber,
        field: "metaTitle",
        message: `Meta title truncated to 70 characters`,
      });
    }

    if (product.metaDescription && product.metaDescription.length > 160) {
      product.metaDescription = product.metaDescription.substring(0, 160);
      results.warnings.push({
        row: rowNumber,
        field: "metaDescription",
        message: `Meta description truncated to 160 characters`,
      });
    }

    // Ensure metaTitle exists
    if (!product.metaTitle || product.metaTitle.trim().length === 0) {
      product.metaTitle = product.name.substring(0, 70);
      results.warnings.push({
        row: rowNumber,
        field: "metaTitle",
        message: "Meta title was empty, using product name",
      });
    }

    // Ensure metaDescription exists
    if (
      !product.metaDescription ||
      product.metaDescription.trim().length === 0
    ) {
      product.metaDescription = (product.description || product.name).substring(
        0,
        160
      );
      results.warnings.push({
        row: rowNumber,
        field: "metaDescription",
        message: "Meta description was empty, using product description",
      });
    }

    // Validate array fields
    if (!Array.isArray(product.metaKeywords)) {
      product.metaKeywords = [];
    }
    if (!Array.isArray(product.tags)) {
      product.tags = product.tags ? [product.tags] : [];
    }
    if (!Array.isArray(product.learningOutcomes)) {
      product.learningOutcomes = [];
    }

    // Limit array sizes
    if (product.metaKeywords.length > 15) {
      product.metaKeywords = product.metaKeywords.slice(0, 15);
    }
    if (product.tags.length > 20) {
      product.tags = product.tags.slice(0, 20);
    }
    if (product.learningOutcomes.length > 5) {
      product.learningOutcomes = product.learningOutcomes.slice(0, 5);
    }

    return product;
  } catch (error) {
    results.errors.push({
      row: rowNumber,
      field: "validation",
      message: `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
      value: product.name,
    });
    return null;
  }
}

export const bulkUploadProductsJob = inngest.createFunction(
  { id: "bulk-upload-products", name: "Bulk Upload Products with AI" },
  { event: "products/bulk-upload.requested" },
  async ({ event, step }) => {
    const { userId, products, aiEnhancement, jobId } = event.data;

    // Update job status: processing
    await step.run("update-status-processing", async () => {
      await db.aiJob.update({
        where: { id: jobId },
        data: { status: "PROCESSING", startedAt: new Date() },
      });
    });

    // Process products with optional AI enhancement
    const result = await step.run("process-bulk-upload", async () => {
      const results = {
        success: 0,
        created: 0,
        updated: 0,
        failed: 0,
        errors: [] as any[],
        warnings: [] as any[],
      };

      let productsToProcess = products;

      // AI Enhancement if requested
      if (aiEnhancement?.enabled) {
        const dualProviderEnhancement =
          new DualProviderProductEnhancementService();

        try {
          const enhancementResults =
            await dualProviderEnhancement.enhanceProductsBatch(products, {
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
            });

          // Merge enhanced data
          productsToProcess = products.map(
            (originalProduct: any, index: number) => {
              const enhancement = enhancementResults[index];
              if (enhancement?.success && enhancement.enhancedProduct) {
                return { ...originalProduct, ...enhancement.enhancedProduct };
              }
              return originalProduct;
            }
          );
        } catch (error) {
          console.error("Enhancement failed:", error);
        }
      }

      // Process products with basic processing
      const processor = new EnhancedProductProcessor();
      productsToProcess = await processor.processProductsBatch(
        productsToProcess,
        {
          includeAIEnhancement: false, // Already enhanced
          applyRomanianDefaults: true,
        }
      );

      // Save to database
      for (const [index, product] of productsToProcess.entries()) {
        try {
          // Validate and correct product
          const validated = validateAndCorrectProduct(
            product,
            index + 1,
            results
          );
          if (validated) {
            const slug = validated.slug || normalizeSlug(validated.name);

            // Find or create category
            let category = await db.category.findFirst({
              where: {
                OR: [
                  { name: { equals: product.category, mode: "insensitive" } },
                  { slug: product.category.toLowerCase().replace(/\s+/g, "-") },
                ],
              },
            });

            if (!category) {
              const slug = product.category.toLowerCase().replace(/\s+/g, "-");
              category = await db.category.create({
                data: {
                  name: product.category,
                  slug: slug,
                  description: `${product.category} - produse educaționale`,
                  isActive: true,
                },
              });
            }

            const existingBySku = validated.sku
              ? await db.product.findUnique({
                  where: { sku: validated.sku },
                  select: { id: true, sku: true, slug: true },
                })
              : null;
            const existingBySlug = await db.product.findUnique({
              where: { slug },
              select: { id: true, sku: true, slug: true },
            });

            if (
              existingBySku &&
              existingBySlug &&
              existingBySku.id !== existingBySlug.id
            ) {
              results.failed++;
              results.errors.push({
                row: index + 1,
                error:
                  "Conflicting existing products found for this SKU and slug",
              });
              continue;
            }

            const existingProduct = existingBySku || existingBySlug;
            const productData = {
              name: validated.name,
              slug,
              description: validated.description,
              price: validated.price,
              compareAtPrice: validated.compareAtPrice,
              sku: validated.sku,
              images: validated.images || [],
              categoryId: category.id,
              tags: validated.tags || [],
              attributes: validated.attributes || {},
              metadata: validated.metadata || {},
              isActive: validated.isActive ?? true,
              featured: validated.featured ?? false,
              stockQuantity: validated.stockQuantity || 0,
              weight: validated.weight,
              ageGroup: validated.ageGroup,
              stemDiscipline: validated.stemDiscipline || "GENERAL",
              status: "APPROVED" as const,
            };

            if (existingProduct) {
              await db.product.update({
                where: { id: existingProduct.id },
                data: productData,
              });
              results.updated++;
            } else {
              await db.product.create({
                data: productData,
              });
              results.created++;
            }
            results.success++;
          } else {
            results.failed++;
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: index + 1,
            error: error instanceof Error ? error.message : "Save failed",
          });
        }
      }

      return {
        success: true,
        results,
      };
    });

    // Save result
    await step.run("save-result", async () => {
      await db.aiJob.update({
        where: { id: jobId },
        data: {
          status: result.success ? "COMPLETED" : "FAILED",
          result: JSON.stringify(result),
          completedAt: new Date(),
          error: null,
        },
      });
    });

    return { success: true, jobId, result };
  }
);
