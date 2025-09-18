import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag, revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { applyStandardHeaders } from "@/lib/response-headers";
import { handleApiError, createSuccessResponse } from "@/lib/api-error-handler";
import { DualProviderEnhancementService } from "@/lib/ai/dual-provider-enhancement-service";
import { AISchemaValidator } from "@/lib/ai/schema-validator";
import {
  AIConfig,
  type BasicProduct,
  type EnhancementOptions,
  type AIEnhancementResponse,
} from "@/lib/ai";

// Input validation schema for AI enhancement and save
const aiEnhanceAndSaveSchema = z.object({
  products: z
    .array(
      z.object({
        name: z.string().min(1, "Product name is required"),
        price: z.number().positive("Price must be positive"),
        category: z.string().min(1, "Category is required"),
        images: z.array(z.string().url()).optional(),
        description: z.string().optional(),
        sku: z.string().optional(),
        stockQuantity: z.number().int().min(0).optional(),
        weight: z.number().positive().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .min(1, "At least one product is required")
    .max(50, "Cannot enhance and save more than 50 products at once"),
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
  saveToDatabase: z.boolean().default(true),
  autoApprove: z.boolean().default(false), // Admin can choose to auto-approve
});

// Helper function to generate slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Helper function to find or create category
async function findOrCreateCategory(categoryName: string) {
  const slug = generateSlug(categoryName);

  // Try to find existing category
  let category = await db.category.findFirst({
    where: {
      OR: [
        { name: { equals: categoryName, mode: "insensitive" } },
        { slug: slug },
      ],
    },
  });

  // Create category if it doesn't exist
  if (!category) {
    category = await db.category.create({
      data: {
        name: categoryName,
        slug: slug,
        description: `${categoryName} STEM products`,
        isActive: true,
      },
    });
  }

  return category;
}

// POST - AI Enhancement and Database Save API Endpoint
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Not authorized",
          message: "You must be logged in as an admin to use AI enhancement",
        },
        { status: 403 }
      );
    }

    // Check if AI enhancement is enabled
    if (!AIConfig.isEnhancementEnabled() || !AIConfig.isConfigured()) {
      return NextResponse.json(
        {
          error: "AI Enhancement not available",
          message: "AI enhancement is not configured or enabled",
        },
        { status: 503 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = aiEnhanceAndSaveSchema.parse(body);

    console.log(
      `Starting AI enhancement and save for ${validatedData.products.length} products...`
    );

    const startTime = Date.now();
    const results = {
      enhanced: 0,
      saved: 0,
      failed: 0,
      errors: [] as Array<{ product: string; error: string; stage: string }>,
      warnings: [] as Array<{ product: string; warning: string }>,
    };

    // Initialize dual provider enhancement service
    const enhancementService = new DualProviderEnhancementService();
    const enhancedProducts = [];
    const savedProducts = [];

    // Process each product
    for (const [index, productData] of validatedData.products.entries()) {
      try {
        console.log(`Processing product ${index + 1}: ${productData.name}`);

        // Step 1: AI Enhancement
        const enhancedProduct = await enhancementService.enhanceProduct(
          productData,
          validatedData.options
        );

        // Step 2: Schema Validation
        const validation =
          AISchemaValidator.validateEnhancedProduct(enhancedProduct);

        if (!validation.isValid) {
          console.warn(
            `Schema validation issues for ${productData.name}:`,
            validation.errors
          );

          // Add warnings for validation issues
          validation.warnings.forEach(warning => {
            results.warnings.push({
              product: productData.name,
              warning: warning,
            });
          });

          // Use corrected product if available
          if (validation.correctedProduct) {
            console.log(`Using corrected product data for ${productData.name}`);
            enhancedProduct = validation.correctedProduct;
          } else {
            throw new Error(
              `Schema validation failed: ${validation.errors.join(", ")}`
            );
          }
        }

        enhancedProducts.push(enhancedProduct);
        results.enhanced++;

        // Step 3: Save to Database (if requested)
        if (validatedData.saveToDatabase) {
          try {
            // Find or create category
            const category = await findOrCreateCategory(
              enhancedProduct.category
            );

            // Generate unique slug
            const baseSlug = generateSlug(enhancedProduct.name);
            let slug = baseSlug;
            let counter = 1;

            while (await db.product.findUnique({ where: { slug } })) {
              slug = `${baseSlug}-${counter}`;
              counter++;
            }

            // Determine status: AI-enhanced products need approval unless auto-approved
            const status = validatedData.autoApprove
              ? "APPROVED"
              : "PENDING_APPROVAL";

            // Create product in database
            const savedProduct = await db.product.create({
              data: {
                // Core fields
                name: enhancedProduct.name,
                slug: slug,
                description:
                  enhancedProduct.enhancedDescription ||
                  enhancedProduct.description,
                price: enhancedProduct.price,
                sku: enhancedProduct.sku,
                images: enhancedProduct.images || [],
                categoryId: category.id,
                tags: enhancedProduct.tags || [],
                stockQuantity: enhancedProduct.stockQuantity || 0,
                weight: enhancedProduct.weight || 0.8,
                isActive: false, // Inactive until approved
                featured: false,

                // Enhanced categorization fields
                ageGroup: enhancedProduct.ageGroup as any,
                stemDiscipline: (enhancedProduct.stemDiscipline ||
                  "GENERAL") as any,
                learningOutcomes: (enhancedProduct.learningOutcomes ||
                  []) as any,
                productType: enhancedProduct.productType as any,
                specialCategories: ["NEW_ARRIVALS"],

                // Romanian educational fields
                romanianCompetencies:
                  enhancedProduct.romanianCompetencies || [],
                romanianCurriculumAlignment:
                  enhancedProduct.romanianCurriculumAlignment || [],
                romanianEducationalLevel:
                  enhancedProduct.romanianEducationalLevel as any,
                romanianSubjectAreas:
                  enhancedProduct.romanianSubjectAreas || [],
                romanianMinistryApproval:
                  enhancedProduct.romanianMinistryApproval || false,

                // Status - AI-enhanced products need approval
                status: status,

                // Currency fields
                priceCurrency: "RON",
                compareAtPriceCurrency: "RON",

                // SEO metadata in attributes
                attributes: {
                  metaTitle: enhancedProduct.metaTitle || enhancedProduct.name,
                  metaDescription:
                    enhancedProduct.metaDescription ||
                    (
                      enhancedProduct.enhancedDescription ||
                      enhancedProduct.description ||
                      ""
                    ).substring(0, 160),
                  metaKeywords: enhancedProduct.metaKeywords || [],
                  // AI enhancement tracking
                  aiEnhanced: true,
                  enhancedBy: "dual-provider",
                  fallbackUsed: enhancedProduct.fallbackUsed || false,
                  generatedByFallback:
                    enhancedProduct.generatedByFallback || false,
                  enhancementTimestamp: new Date().toISOString(),
                },
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

            savedProducts.push(savedProduct);
            results.saved++;

            console.log(
              `✅ Successfully saved product: ${savedProduct.name} (Status: ${status})`
            );
          } catch (saveError) {
            console.error(
              `Failed to save product ${productData.name}:`,
              saveError
            );
            results.errors.push({
              product: productData.name,
              error: `Database save failed: ${saveError instanceof Error ? saveError.message : String(saveError)}`,
              stage: "database_save",
            });
            results.failed++;
          }
        }
      } catch (enhanceError) {
        console.error(
          `Failed to enhance product ${productData.name}:`,
          enhanceError
        );
        results.errors.push({
          product: productData.name,
          error: `AI enhancement failed: ${enhanceError instanceof Error ? enhanceError.message : String(enhanceError)}`,
          stage: "ai_enhancement",
        });
        results.failed++;
      }
    }

    const processingTime = Date.now() - startTime;

    // Prepare response
    const response: AIEnhancementResponse & {
      savedProducts?: any[];
      saveResults?: typeof results;
    } = {
      success: results.failed === 0,
      enhancedProducts: enhancedProducts,
      processingTime,
      errors: results.errors.map(e => ({
        product: e.product,
        error: e.error,
      })),
      summary: {
        total: validatedData.products.length,
        successful: results.enhanced,
        failed: results.failed,
        successRate: `${((results.enhanced / validatedData.products.length) * 100).toFixed(1)}%`,
      },
      ...(validatedData.saveToDatabase && {
        savedProducts: savedProducts,
        saveResults: {
          saved: results.saved,
          pending_approval: savedProducts.filter(
            p => p.status === "PENDING_APPROVAL"
          ).length,
          auto_approved: savedProducts.filter(p => p.status === "APPROVED")
            .length,
          warnings: results.warnings,
        },
      }),
    };

    // Revalidate caches if products were saved
    if (validatedData.saveToDatabase && results.saved > 0) {
      revalidateTag("products");
      revalidatePath("/admin/products");

      // Revalidate categories
      const uniqueCategories = [
        ...new Set(savedProducts.map(p => p.categoryId)),
      ];
      uniqueCategories.forEach(categoryId => {
        if (categoryId) revalidateTag(`category-${categoryId}`);
      });
    }

    console.log(
      `✅ AI enhancement and save completed: ${results.enhanced} enhanced, ${results.saved} saved, ${results.failed} failed in ${processingTime}ms`
    );

    return applyStandardHeaders(NextResponse.json(response), {
      cache: "private",
    });
  } catch (error) {
    console.error("AI Enhancement and Save API error:", error);
    return handleApiError(error, "Failed to enhance and save products");
  }
}
