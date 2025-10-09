import { inngest } from "../client";
import { DualProviderProductEnhancementService } from "@/lib/ai/dual-provider-product-enhancement-service";
import { EnhancedProductProcessor } from "@/lib/ai/enhanced-product-processor";
import { db } from "@/lib/db";

// Helper function to extract SEO fields
function extractSeoFields(input: any): {
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    ogImage?: string;
  };
  legacy: Record<string, unknown>;
} {
  const seo: any = {};
  const legacy: Record<string, unknown> = {};

  const fromTop = input ?? {};
  const fromAttributes = (input?.attributes as any) ?? {};
  const fromSeo = (input?.seo as any) ?? {};

  const metaTitle =
    fromSeo.metaTitle ||
    fromTop.metaTitle ||
    fromAttributes.metaTitle ||
    fromTop.title;
  const metaDescription =
    fromSeo.metaDescription ||
    fromTop.metaDescription ||
    fromAttributes.metaDescription ||
    fromTop.description;
  const metaKeywords =
    fromSeo.metaKeywords ||
    fromTop.metaKeywords ||
    fromAttributes.metaKeywords ||
    fromTop.keywords;
  const ogImage = fromSeo.ogImage || fromTop.ogImage || fromAttributes.ogImage;

  if (metaTitle) seo.metaTitle = String(metaTitle);
  if (metaDescription) seo.metaDescription = String(metaDescription);
  if (Array.isArray(metaKeywords)) seo.metaKeywords = metaKeywords as string[];
  if (ogImage) seo.ogImage = String(ogImage);

  if (seo.metaTitle) {
    legacy.metaTitle = seo.metaTitle;
    legacy.title = seo.metaTitle;
  }
  if (seo.metaDescription) {
    legacy.metaDescription = seo.metaDescription;
    legacy.description = seo.metaDescription;
  }
  if (seo.metaKeywords) {
    legacy.metaKeywords = seo.metaKeywords;
    legacy.keywords = seo.metaKeywords;
  }
  if (seo.ogImage) legacy.ogImage = seo.ogImage;

  return { seo, legacy };
}

// Helper function to remove SEO from attributes
function stripSeoFromAttributes(attributes: any): any {
  if (!attributes || typeof attributes !== "object") return attributes;
  const {
    metaTitle,
    metaDescription,
    metaKeywords,
    ogImage,
    title,
    description,
    keywords,
    seo,
    ...rest
  } = attributes;
  return rest;
}

// Helper function to build default specs
function buildDefaultSpecsFromProduct(product: any): Record<string, unknown> {
  const tags: string[] = Array.isArray(product?.tags) ? product.tags : [];
  const lowerTags = tags.map((t: string) => t.toLowerCase());

  const programmingCandidates = [
    "scratch",
    "python",
    "block",
    "blockly",
    "c++",
    "c#",
    "java",
    "swift",
    "arduino",
    "vexcode",
    "micro:bit",
  ];
  const connectivityCandidates = [
    "bluetooth",
    "wi-fi",
    "wifi",
    "usb",
    "serial",
    "ble",
  ];
  const compatibilityCandidatesMap: Record<string, string> = {
    ios: "iOS",
    android: "Android",
    windows: "Windows",
    macos: "macOS",
    mac: "macOS",
    chromebook: "Chromebook",
  };

  const programming = programmingCandidates.filter(c =>
    lowerTags.some(t => t.includes(c))
  );
  const connectivity = connectivityCandidates.filter(c =>
    lowerTags.some(t => t.includes(c))
  );
  const compatibility = Object.keys(compatibilityCandidatesMap)
    .filter(k => lowerTags.some(t => t.includes(k)))
    .map(k => compatibilityCandidatesMap[k]);

  const dim =
    product?.dimensions && typeof product.dimensions === "object"
      ? product.dimensions
      : undefined;
  const width = Number(dim?.width ?? dim?.w ?? dim?.latime);
  const height = Number(dim?.height ?? dim?.h ?? dim?.inaltime);
  const depth = Number(dim?.depth ?? dim?.d ?? dim?.adancime);

  const dimensionsMm: Record<string, number> = {};
  if (!Number.isNaN(width)) dimensionsMm.width = width;
  if (!Number.isNaN(height)) dimensionsMm.height = height;
  if (!Number.isNaN(depth)) dimensionsMm.depth = depth;

  const specs: Record<string, unknown> = {
    motors: null,
    sensors: [],
    programming,
    connectivity,
    batteryLifeHours: null,
    materials: null,
    dimensionsMm: Object.keys(dimensionsMm).length ? dimensionsMm : undefined,
    weightKg: typeof product?.weight === "number" ? product.weight : undefined,
    boxContents: [],
    compatibility,
  };

  return specs;
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

export const supplierBulkUploadProductsJob = inngest.createFunction(
  {
    id: "supplier-bulk-upload-products",
    name: "Supplier Bulk Upload Products with AI",
  },
  { event: "products/supplier-bulk-upload.requested" },
  async ({ event, step }) => {
    const { userId, supplierId, products, aiEnhancement, jobId } = event.data;

    // Update job status: processing
    await step.run("update-status-processing", async () => {
      await db.aiJob.update({
        where: { id: jobId },
        data: { status: "PROCESSING", startedAt: new Date() },
      });
    });

    // Process products with AI enhancement
    const result = await step.run("process-supplier-bulk-upload", async () => {
      const results = {
        success: 0,
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
          applyCurrencyConversion: true,
        }
      );

      // Save to database with supplier-specific settings
      for (const [index, product] of productsToProcess.entries()) {
        try {
          // Validate and correct product
          const validated = validateAndCorrectProduct(
            product,
            index + 1,
            results
          );
          if (!validated) {
            results.failed++;
            continue;
          }

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

          // Generate unique slug
          let slug = validated.name.toLowerCase().replace(/\s+/g, "-");
          let slugCounter = 1;
          let originalSlug = slug;
          while (await db.product.findUnique({ where: { slug } })) {
            slug = `${originalSlug}-${slugCounter}`;
            slugCounter++;
          }

          // Normalize SEO and attributes
          const { seo: rawSeo, legacy } = extractSeoFields(validated);
          let cleanedAttributes = stripSeoFromAttributes(
            (validated as any).attributes
          );

          // Build metadata
          const metadata: Record<string, unknown> = {
            ...(validated.metadata || {}),
            ...legacy,
            seo: ((): any => {
              const s: any = { ...(rawSeo || {}) };
              if (!s.ogImage) {
                const firstImage = Array.isArray(validated.images)
                  ? validated.images[0]
                  : undefined;
                if (firstImage) s.ogImage = String(firstImage);
              }
              return s;
            })(),
            ai: {
              aiEnhanced: true,
              enhancedBy: "dual-provider",
              fallbackUsed: Boolean(validated.fallbackUsed),
              enhancementTimestamp: new Date().toISOString(),
            },
            ingestion: {
              createdViaSupplierBulkUpload: true,
              supplierBulkUploadTimestamp: new Date().toISOString(),
              supplierId: supplierId,
            },
          };

          // Ensure attributes.specs exists
          if (!cleanedAttributes || typeof cleanedAttributes !== "object") {
            cleanedAttributes = {} as any;
          }
          const hasSpecs =
            cleanedAttributes &&
            typeof cleanedAttributes === "object" &&
            (cleanedAttributes as any).specs &&
            Object.keys((cleanedAttributes as any).specs || {}).length > 0;
          if (!hasSpecs) {
            (cleanedAttributes as any).specs =
              buildDefaultSpecsFromProduct(validated);
          }

          // Enhance metadata with additional educational fields
          const enhancedMetadata = {
            ...metadata,
            productType: validated.productType,
            learningOutcomes: validated.learningOutcomes || [],
            specialCategories: validated.specialCategories || ["NEW_ARRIVALS"],
            romanianCompetencies: validated.romanianCompetencies || [],
            romanianCurriculumAlignment:
              validated.romanianCurriculumAlignment || [],
            romanianEducationalLevel: validated.romanianEducationalLevel,
            romanianSubjectAreas: validated.romanianSubjectAreas || [],
            romanianMinistryApproval: true,
          };

          // Create product with IN_PENDING status and supplierId
          await db.product.create({
            data: {
              name: validated.name,
              slug: slug,
              description:
                validated.enhancedDescription || validated.description,
              price: validated.price,
              compareAtPrice: validated.compareAtPrice,
              sku: validated.sku,
              images: validated.images || [],
              categoryId: category.id,
              tags: validated.tags || [],
              attributes: cleanedAttributes || {},
              metadata: enhancedMetadata,
              isActive: true,
              featured: false,
              stockQuantity: validated.stockQuantity || 0,
              weight: validated.weight,
              ageGroup: validated.ageGroup,
              stemDiscipline: validated.stemDiscipline || "GENERAL",
              status: "IN_PENDING", // All supplier products require approval
              supplierId: supplierId, // Set supplier ID
            },
          });
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: index + 1,
            product: product.name,
            error: error instanceof Error ? error.message : "Save failed",
          });
          console.error(`Error saving product ${index + 1}:`, error);
        }
      }

      return {
        success: results.failed === 0,
        summary: {
          total: products.length,
          successful: results.success,
          failed: results.failed,
          successRate: `${((results.success / products.length) * 100).toFixed(1)}%`,
        },
        results,
        errors: results.errors,
        warnings: results.warnings,
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
          error: result.success ? null : JSON.stringify(result.errors),
        },
      });
    });

    return { success: true, jobId, result };
  }
);
