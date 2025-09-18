import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag, revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { applyStandardHeaders } from "@/lib/response-headers";
import { invalidateCachePattern } from "@/lib/cache";
import {
  BatchEnhancementService,
  AIConfig,
  type BasicProduct,
  type EnhancementOptions,
} from "@/lib/ai";
import { EnhancedProductProcessor } from "@/lib/ai/enhanced-product-processor";
import { AISchemaValidator } from "@/lib/ai/schema-validator";

// Enhanced bulk upload schema for admin products
const adminBulkUploadSchema = z.object({
  products: z
    .array(
      z.object({
        name: z
          .string()
          .min(1, "Product name is required")
          .max(100, "Product name must be 100 characters or less")
          .refine(
            name => name.trim().length > 0,
            "Product name cannot be empty"
          ),
        description: z
          .string()
          .min(10, "Description must be at least 10 characters")
          .max(1000, "Description must be 1000 characters or less")
          .refine(
            desc => desc.trim().length >= 10,
            "Description must be at least 10 characters"
          ),
        price: z
          .number()
          .min(0.01, "Price must be greater than 0")
          .max(999999.99, "Price cannot exceed 999,999.99"),
        compareAtPrice: z
          .number()
          .min(0.01, "Compare at price must be greater than 0")
          .max(999999.99, "Compare at price cannot exceed 999,999.99")
          .optional(),
        sku: z
          .string()
          .max(50, "SKU must be 50 characters or less")
          .optional()
          .refine(
            sku => !sku || sku.trim().length > 0,
            "SKU cannot be empty if provided"
          ),
        stockQuantity: z
          .number()
          .int("Stock quantity must be a whole number")
          .min(0, "Stock quantity cannot be negative")
          .max(999999, "Stock quantity cannot exceed 999,999"),
        reorderPoint: z
          .number()
          .int("Reorder point must be a whole number")
          .min(0, "Reorder point cannot be negative")
          .max(999999, "Reorder point cannot exceed 999,999")
          .optional(),
        weight: z
          .number()
          .min(0, "Weight cannot be negative")
          .max(999999, "Weight cannot exceed 999,999")
          .optional(),
        category: z
          .string()
          .min(1, "Category is required")
          .max(100, "Category name must be 100 characters or less"),
        tags: z
          .string()
          .optional()
          .transform(tags => {
            if (!tags) return [];
            return tags
              .split(",")
              .map(tag => tag.trim())
              .filter(tag => tag.length > 0);
          }),
        // Enhanced categorization fields
        ageGroup: z
          .enum([
            "TODDLERS_1_3",
            "PRESCHOOL_3_5",
            "ELEMENTARY_6_8",
            "MIDDLE_SCHOOL_9_12",
            "TEENS_13_PLUS",
          ])
          .optional(),
        stemDiscipline: z
          .enum([
            "SCIENCE",
            "TECHNOLOGY",
            "ENGINEERING",
            "MATHEMATICS",
            "GENERAL",
          ])
          .default("GENERAL"),
        learningOutcomes: z
          .string()
          .optional()
          .transform(outcomes => {
            if (!outcomes) return [];
            return outcomes
              .split(",")
              .map(outcome => outcome.trim())
              .filter(outcome => outcome.length > 0);
          }),
        productType: z
          .enum([
            "ROBOTICS",
            "PUZZLES",
            "CONSTRUCTION_SETS",
            "EXPERIMENT_KITS",
            "BOARD_GAMES",
          ])
          .optional(),
        specialCategories: z
          .string()
          .optional()
          .transform(categories => {
            if (!categories) return [];
            return categories
              .split(",")
              .map(cat => cat.trim())
              .filter(cat => cat.length > 0);
          }),
        images: z
          .string()
          .optional()
          .transform(images => {
            if (!images) return [];
            return images
              .split(",")
              .map(img => img.trim())
              .filter(img => img.length > 0);
          }),
        // Additional fields for admin
        isActive: z.boolean().default(true),
        featured: z.boolean().default(false),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        metaKeywords: z
          .string()
          .optional()
          .transform(keywords => {
            if (!keywords) return [];
            return keywords
              .split(",")
              .map(keyword => keyword.trim())
              .filter(keyword => keyword.length > 0);
          }),
        // Romanian educational fields
        romanianCompetencies: z
          .string()
          .optional()
          .transform(competencies => {
            if (!competencies) return [];
            return competencies
              .split(",")
              .map(comp => comp.trim())
              .filter(comp => comp.length > 0);
          }),
        romanianCurriculumAlignment: z
          .string()
          .optional()
          .transform(alignment => {
            if (!alignment) return [];
            return alignment
              .split(",")
              .map(align => align.trim())
              .filter(align => align.length > 0);
          }),
        romanianEducationalLevel: z
          .enum(["PRESCOLAR", "PRIMAR", "GIMNAZIAL", "LICEAL", "UNIVERSITAR"])
          .optional(),
        romanianSubjectAreas: z
          .string()
          .optional()
          .transform(areas => {
            if (!areas) return [];
            return areas
              .split(",")
              .map(area => area.trim())
              .filter(area => area.length > 0);
          }),
        romanianMinistryApproval: z.boolean().default(false),
        romanianEducationalCertification: z.string().optional(),
      })
    )
    .min(1, "At least one product is required")
    .max(1000, "Cannot upload more than 1000 products at once"),
  // AI Enhancement options
  aiEnhancement: z
    .object({
      enabled: z.boolean().default(false),
      options: z
        .object({
          includeRomanianOptimization: z.boolean().default(true),
          includeSEOMetadata: z.boolean().default(true),
          includeLearningOutcomes: z.boolean().default(true),
          includeAgeGroup: z.boolean().default(true),
          includeStemDiscipline: z.boolean().default(true),
          includeProductType: z.boolean().default(true),
        })
        .optional(),
    })
    .optional(),
});

// Validation functions
const validateAgeGroup = (ageGroup: string): boolean => {
  const validAgeGroups = [
    "TODDLERS_1_3",
    "PRESCHOOL_3_5",
    "ELEMENTARY_6_8",
    "MIDDLE_SCHOOL_9_12",
    "TEENS_13_PLUS",
  ];
  return validAgeGroups.includes(ageGroup);
};

const validateStemDiscipline = (discipline: string): boolean => {
  const validDisciplines = [
    "SCIENCE",
    "TECHNOLOGY",
    "ENGINEERING",
    "MATHEMATICS",
    "GENERAL",
  ];
  return validDisciplines.includes(discipline);
};

const validateProductType = (type: string): boolean => {
  const validTypes = [
    "ROBOTICS",
    "PUZZLES",
    "CONSTRUCTION_SETS",
    "EXPERIMENT_KITS",
    "BOARD_GAMES",
  ];
  return validTypes.includes(type);
};

const validateLearningOutcomes = (outcomes: string[]): boolean => {
  const validOutcomes = [
    "PROBLEM_SOLVING",
    "CREATIVITY",
    "CRITICAL_THINKING",
    "MOTOR_SKILLS",
    "LOGIC",
    "ANALYTICAL_THINKING",
    "COLLABORATION",
    "COMMUNICATION",
  ];
  return outcomes.every(outcome => validOutcomes.includes(outcome));
};

const validateSpecialCategories = (categories: string[]): boolean => {
  const validCategories = [
    "NEW_ARRIVALS",
    "BEST_SELLERS",
    "GIFT_IDEAS",
    "SALE_ITEMS",
  ];
  return categories.every(cat => validCategories.includes(cat));
};

// Function to validate and correct product data before saving
function validateAndCorrectProduct(
  product: any,
  rowNumber: number,
  results: any
) {
  try {
    // Validate meta title and description lengths
    if (product.metaTitle && product.metaTitle.length > 70) {
      console.warn(
        `Row ${rowNumber}: metaTitle too long (${product.metaTitle.length} chars), truncating`
      );
      product.metaTitle = product.metaTitle.substring(0, 70);
      results.warnings.push({
        row: rowNumber,
        field: "metaTitle",
        message: `Meta title truncated to 70 characters (was ${product.metaTitle.length})`,
      });
    }

    if (product.metaDescription && product.metaDescription.length > 160) {
      console.warn(
        `Row ${rowNumber}: metaDescription too long (${product.metaDescription.length} chars), truncating`
      );
      product.metaDescription = product.metaDescription.substring(0, 160);
      results.warnings.push({
        row: rowNumber,
        field: "metaDescription",
        message: `Meta description truncated to 160 characters (was ${product.metaDescription.length})`,
      });
    }

    // Ensure metaTitle exists and is not empty
    if (!product.metaTitle || product.metaTitle.trim().length === 0) {
      product.metaTitle = product.name.substring(0, 70);
      results.warnings.push({
        row: rowNumber,
        field: "metaTitle",
        message: "Meta title was empty, using product name",
      });
    }

    // Ensure metaDescription exists and is not empty
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

    // Validate and fix array fields
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
      results.warnings.push({
        row: rowNumber,
        field: "metaKeywords",
        message: "Meta keywords limited to 15 items",
      });
    }

    if (product.tags.length > 20) {
      product.tags = product.tags.slice(0, 20);
      results.warnings.push({
        row: rowNumber,
        field: "tags",
        message: "Tags limited to 20 items",
      });
    }

    if (product.learningOutcomes.length > 5) {
      product.learningOutcomes = product.learningOutcomes.slice(0, 5);
      results.warnings.push({
        row: rowNumber,
        field: "learningOutcomes",
        message: "Learning outcomes limited to 5 items",
      });
    }

    return product;
  } catch (error) {
    console.error(`Error validating product at row ${rowNumber}:`, error);
    results.errors.push({
      row: rowNumber,
      field: "validation",
      message: `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
      value: product.name,
    });
    return null;
  }
}

// POST - Admin bulk upload products
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Not authorized",
          message: "You must be logged in as an admin to upload products",
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = adminBulkUploadSchema.parse(body);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{
        row: number;
        field: string;
        message: string;
        value?: string;
      }>,
      warnings: [] as Array<{ row: number; field: string; message: string }>,
      processingTime: 0,
    };

    const startTime = Date.now();

    // Enhanced Product Processing step - Optimized for OpenAI-only
    const productProcessor = new EnhancedProductProcessor();
    let productsToProcess = validatedData.products;
    let aiEnhancementResults = null;

    // Always use AI enhancement when requested - OpenAI-only optimization handles performance
    const shouldUseAIEnhancement =
      validatedData.aiEnhancement?.enabled || false;

    if (shouldUseAIEnhancement) {
      console.log(
        `Using OpenAI-only enhancement for ${validatedData.products.length} products - optimized for performance`
      );
    } else {
      console.log(`AI enhancement disabled - using basic processing only`);
    }

    // Process all products with enhanced processor
    try {
      console.log("Starting OpenAI-only enhanced product processing...");
      productsToProcess = await productProcessor.processProductsBatch(
        validatedData.products,
        {
          includeAIEnhancement: shouldUseAIEnhancement,
          applyRomanianDefaults: true,
          processImages: true,
          addMarkup: true,
          markupPercentage: 20, // 20% markup as requested
        }
      );
      console.log(
        `OpenAI-only enhanced processing completed for ${productsToProcess.length} products`
      );
    } catch (error) {
      console.error("Enhanced product processing failed:", error);
      // Continue with original products if processing fails
    }

    // Legacy AI Enhancement step (if enabled and not already processed)
    if (
      validatedData.aiEnhancement?.enabled &&
      AIConfig.isEnhancementEnabled() &&
      AIConfig.isConfigured() &&
      !productsToProcess.some(p => p.romanianCompetencies?.length > 0)
    ) {
      try {
        console.log("Starting AI enhancement for bulk upload...");

        // Convert products to BasicProduct format for AI enhancement
        const basicProducts: BasicProduct[] = validatedData.products.map(
          product => ({
            name: product.name,
            price: product.price,
            category: product.category,
            images: product.images,
            description: product.description,
            sku: product.sku,
            stockQuantity: product.stockQuantity,
            weight: product.weight,
            tags: product.tags,
          })
        );

        // Enhance products with AI
        const batchService = new BatchEnhancementService();
        aiEnhancementResults = await batchService.enhanceProductsBatch(
          basicProducts,
          validatedData.aiEnhancement.options
        );

        // Merge AI-enhanced data with original products
        productsToProcess = validatedData.products.map(
          (originalProduct, index) => {
            const enhancedResult = aiEnhancementResults.results[index];

            if (enhancedResult.success && enhancedResult.enhancedProduct) {
              const enhanced = enhancedResult.enhancedProduct;

              return {
                ...originalProduct,
                // Use AI-enhanced description if available
                description:
                  enhanced.enhancedDescription || originalProduct.description,
                // Merge AI-generated metadata
                metaTitle: enhanced.metaTitle || originalProduct.metaTitle,
                metaDescription:
                  enhanced.metaDescription || originalProduct.metaDescription,
                metaKeywords:
                  enhanced.metaKeywords.length > 0
                    ? enhanced.metaKeywords
                    : originalProduct.metaKeywords,
                // Merge AI-generated categorization
                ageGroup: enhanced.ageGroup || originalProduct.ageGroup,
                stemDiscipline:
                  enhanced.stemDiscipline || originalProduct.stemDiscipline,
                productType:
                  enhanced.productType || originalProduct.productType,
                learningOutcomes:
                  enhanced.learningOutcomes.length > 0
                    ? enhanced.learningOutcomes
                    : originalProduct.learningOutcomes,
                // Merge AI-generated Romanian content
                romanianCompetencies:
                  enhanced.romanianCompetencies.length > 0
                    ? enhanced.romanianCompetencies
                    : originalProduct.romanianCompetencies,
                romanianCurriculumAlignment:
                  enhanced.romanianCurriculumAlignment.length > 0
                    ? enhanced.romanianCurriculumAlignment
                    : originalProduct.romanianCurriculumAlignment,
                romanianEducationalLevel:
                  enhanced.romanianEducationalLevel ||
                  originalProduct.romanianEducationalLevel,
                romanianSubjectAreas:
                  enhanced.romanianSubjectAreas.length > 0
                    ? enhanced.romanianSubjectAreas
                    : originalProduct.romanianSubjectAreas,
                romanianMinistryApproval:
                  enhanced.romanianMinistryApproval ||
                  originalProduct.romanianMinistryApproval,
                romanianEducationalCertification:
                  enhanced.romanianEducationalCertification ||
                  originalProduct.romanianEducationalCertification,
                // Merge enhanced tags
                tags:
                  enhanced.tags.length > 0
                    ? enhanced.tags
                    : originalProduct.tags,
              };
            }

            return originalProduct;
          }
        );

        console.log(
          `AI enhancement completed: ${aiEnhancementResults.summary.successful}/${aiEnhancementResults.summary.total} products enhanced successfully`
        );
      } catch (error) {
        console.error(
          "AI enhancement failed, proceeding with original products:",
          error
        );
        // Continue with original products if AI enhancement fails
        productsToProcess = validatedData.products;
      }
    }

    // Process products in batches for better performance
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < productsToProcess.length; i += batchSize) {
      batches.push(productsToProcess.slice(i, i + batchSize));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      for (let productIndex = 0; productIndex < batch.length; productIndex++) {
        const product = batch[productIndex];
        const rowNumber = batchIndex * batchSize + productIndex + 1;

        try {
          // Validate compareAtPrice
          if (
            product.compareAtPrice &&
            product.compareAtPrice <= product.price
          ) {
            results.errors.push({
              row: rowNumber,
              field: "compareAtPrice",
              message: "Compare at price must be greater than regular price",
              value: product.compareAtPrice.toString(),
            });
            results.failed++;
            continue;
          }

          // Validate categorization fields
          if (product.ageGroup && !validateAgeGroup(product.ageGroup)) {
            results.errors.push({
              row: rowNumber,
              field: "ageGroup",
              message: "Invalid age group",
              value: product.ageGroup,
            });
            results.failed++;
            continue;
          }

          if (
            product.stemDiscipline &&
            !validateStemDiscipline(product.stemDiscipline)
          ) {
            results.errors.push({
              row: rowNumber,
              field: "stemDiscipline",
              message: "Invalid STEM discipline",
              value: product.stemDiscipline,
            });
            results.failed++;
            continue;
          }

          if (
            product.productType &&
            !validateProductType(product.productType)
          ) {
            results.errors.push({
              row: rowNumber,
              field: "productType",
              message: "Invalid product type",
              value: product.productType,
            });
            results.failed++;
            continue;
          }

          if (
            product.learningOutcomes &&
            !validateLearningOutcomes(product.learningOutcomes)
          ) {
            results.errors.push({
              row: rowNumber,
              field: "learningOutcomes",
              message: "Invalid learning outcomes",
              value: product.learningOutcomes.join(", "),
            });
            results.failed++;
            continue;
          }

          if (
            product.specialCategories &&
            !validateSpecialCategories(product.specialCategories)
          ) {
            results.errors.push({
              row: rowNumber,
              field: "specialCategories",
              message: "Invalid special categories",
              value: product.specialCategories.join(", "),
            });
            results.failed++;
            continue;
          }

          // Find or create category
          let category = await db.category.findFirst({
            where: {
              name: {
                equals: product.category,
                mode: "insensitive",
              },
              isActive: true,
            },
          });

          if (!category) {
            // Create new category if it doesn't exist
            const slug = product.category
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "");

            category = await db.category.create({
              data: {
                name: product.category,
                slug: slug,
                description: `Category for ${product.category}`,
                isActive: true,
              },
            });

            results.warnings.push({
              row: rowNumber,
              field: "category",
              message: `Created new category: ${product.category}`,
            });
          }

          // Generate unique slug
          let slug = product.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

          // Check if slug exists and make it unique
          let slugCounter = 1;
          let originalSlug = slug;
          while (await db.product.findUnique({ where: { slug } })) {
            slug = `${originalSlug}-${slugCounter}`;
            slugCounter++;
          }

          // Check if SKU exists
          if (product.sku) {
            const existingProduct = await db.product.findFirst({
              where: { sku: product.sku },
            });
            if (existingProduct) {
              results.errors.push({
                row: rowNumber,
                field: "sku",
                message: "SKU already exists",
                value: product.sku,
              });
              results.failed++;
              continue;
            }
          }

          // Validate and correct product data before saving
          const correctedProduct = validateAndCorrectProduct(
            product,
            rowNumber,
            results
          );
          if (!correctedProduct) {
            results.failed++;
            continue;
          }

          // Create product with all enhanced fields
          const newProduct = await db.product.create({
            data: {
              // Core fields
              name: correctedProduct.name,
              slug: correctedProduct.slug || slug,
              description: correctedProduct.description,
              price: correctedProduct.price,
              compareAtPrice: correctedProduct.compareAtPrice,
              sku: correctedProduct.sku,
              images: correctedProduct.images,
              categoryId: category.id,
              tags: correctedProduct.tags,
              stockQuantity: correctedProduct.stockQuantity,
              reservedQuantity: correctedProduct.reservedQuantity || 0,
              reorderPoint: correctedProduct.reorderPoint,
              weight: correctedProduct.weight || 0.8,
              dimensions: correctedProduct.dimensions,
              isActive: true, // Always active by default
              featured: false, // ALWAYS false for bulk uploads
              reviewCount: 0, // Default as requested
              totalSold: 0, // Default as requested
              barcode: correctedProduct.barcode || null,

              // Enhanced categorization fields
              ageGroup: correctedProduct.ageGroup,
              stemDiscipline: correctedProduct.stemDiscipline || "GENERAL",
              learningOutcomes: correctedProduct.learningOutcomes || [],
              productType: correctedProduct.productType,
              specialCategories: correctedProduct.specialCategories || [
                "NEW_ARRIVALS",
              ],
              supplierId: correctedProduct.supplierId || null,

              // Romanian educational fields
              romanianCompetencies: correctedProduct.romanianCompetencies || [],
              romanianCurriculumAlignment:
                correctedProduct.romanianCurriculumAlignment || [],
              romanianEducationalLevel:
                correctedProduct.romanianEducationalLevel,
              romanianSubjectAreas: correctedProduct.romanianSubjectAreas || [],
              romanianMinistryApproval: true, // Always true by default
              romanianEducationalCertification:
                correctedProduct.romanianEducationalCertification,
              romanianParentGuides: correctedProduct.romanianParentGuides || [],
              romanianTeacherResources:
                correctedProduct.romanianTeacherResources || [],

              // Status logic: AI-enhanced products need approval, manual uploads are auto-approved
              status:
                correctedProduct.generatedByFallback ||
                correctedProduct.fallbackUsed ||
                correctedProduct.dualProviderEnhancement
                  ? "PENDING_APPROVAL"
                  : "APPROVED",

              // Currency fields
              priceCurrency: "RON",
              compareAtPriceCurrency: "RON",

              // SEO metadata in attributes
              attributes: {
                metaTitle: correctedProduct.metaTitle || correctedProduct.name,
                metaDescription:
                  correctedProduct.metaDescription ||
                  correctedProduct.description.substring(0, 160),
                metaKeywords: correctedProduct.metaKeywords || [],
                ...correctedProduct.attributes,
              },

              // Image metadata
              imageMetadata: correctedProduct.imageMetadata || [],

              // Metadata field for tracking
              metadata: {
                createdViaBulkUpload: true,
                bulkUploadTimestamp: new Date().toISOString(),
                enhancementMethod: correctedProduct.fallbackUsed
                  ? "fallback"
                  : correctedProduct.dualProviderEnhancement
                    ? "dual-provider"
                    : "standard",
                ministryApproved: true,
                isActive: true,
              },

              // Ensure isActive is ALWAYS true for bulk uploads
              isActive: true,
            },
          });

          results.success++;
        } catch (error) {
          console.error(`Error processing product at row ${rowNumber}:`, {
            product: correctedProduct?.name || product.name,
            sku: correctedProduct?.sku || product.sku,
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            productData: {
              name: correctedProduct?.name || product.name,
              sku: correctedProduct?.sku || product.sku,
              price: correctedProduct?.price || product.price,
              category: correctedProduct?.category || product.category,
              learningOutcomes:
                correctedProduct?.learningOutcomes || product.learningOutcomes,
              ageGroup: correctedProduct?.ageGroup || product.ageGroup,
              stemDiscipline:
                correctedProduct?.stemDiscipline || product.stemDiscipline,
              productType: correctedProduct?.productType || product.productType,
            },
          });

          // Provide more specific error messages for common issues
          let errorMessage = "Failed to create product";
          if (error instanceof Error) {
            if (error.message.includes("learningOutcomes")) {
              errorMessage =
                "Invalid learning outcome values - product skipped";
            } else if (error.message.includes("ageGroup")) {
              errorMessage = "Invalid age group value - product skipped";
            } else if (error.message.includes("stemDiscipline")) {
              errorMessage = "Invalid STEM discipline value - product skipped";
            } else if (error.message.includes("productType")) {
              errorMessage = "Invalid product type value - product skipped";
            } else if (error.message.includes("unique constraint")) {
              errorMessage = "Duplicate SKU or unique constraint violation";
            } else {
              errorMessage = `Database error: ${error.message}`;
            }
          }

          results.errors.push({
            row: rowNumber,
            field: "general",
            message: errorMessage,
            value: correctedProduct?.name || product.name,
          });
          results.failed++;
        }
      }
    }

    results.processingTime = Date.now() - startTime;

    // Revalidate caches
    revalidateTag("products");
    revalidatePath("/admin/products");
    await invalidateCachePattern("products:");
    await invalidateCachePattern("product:");

    return applyStandardHeaders(
      NextResponse.json({
        ...results,
        summary: {
          total: validatedData.products.length,
          success: results.success,
          failed: results.failed,
          successRate: `${((results.success / validatedData.products.length) * 100).toFixed(1)}%`,
          processingTime: `${(results.processingTime / 1000).toFixed(2)}s`,
        },
        aiEnhancement: aiEnhancementResults
          ? {
              enabled: true,
              summary: {
                total: aiEnhancementResults.summary.total,
                successful: aiEnhancementResults.summary.successful,
                failed: aiEnhancementResults.summary.failed,
                successRate: `${aiEnhancementResults.summary.successRate.toFixed(1)}%`,
                processingTime: `${(aiEnhancementResults.summary.totalProcessingTime / 1000).toFixed(2)}s`,
              },
              errors: aiEnhancementResults.results
                .filter(r => !r.success)
                .map(r => ({
                  product: "Unknown",
                  error: r.error || "Unknown error",
                })),
            }
          : {
              enabled: false,
              reason: validatedData.aiEnhancement?.enabled
                ? "AI enhancement failed or not configured"
                : "AI enhancement not requested",
            },
      }),
      { cache: "private" }
    );
  } catch (error) {
    console.error("Bulk upload error:", error);

    if (error instanceof z.ZodError) {
      return applyStandardHeaders(
        NextResponse.json(
          {
            error: "Validation error",
            message: "Invalid product data",
            details: error.errors,
          },
          { status: 400 }
        ),
        { cache: "private" }
      );
    }

    return applyStandardHeaders(
      NextResponse.json(
        {
          error: "Upload failed",
          message: "Failed to process bulk upload",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      ),
      { cache: "private" }
    );
  }
}
