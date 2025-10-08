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

// Helper: Extract SEO fields from various shapes and normalize into metadata.seo
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

// Helper: remove SEO-related keys from attributes object
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

// Helper: build default specs from product data (fallback when AI omits attributes.specs)
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
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = aiEnhanceAndSaveSchema.parse(body);

    console.log(
      `Creating AI enhancement job for ${validatedData.products.length} products...`
    );

    // Create job record
    const job = await db.aiJob.create({
      data: {
        type: "PRODUCT_ENHANCEMENT",
        status: "PENDING",
        userId: session.user.id,
        input: JSON.stringify({
          products: validatedData.products,
          options: validatedData.options,
          saveToDatabase: validatedData.saveToDatabase,
          autoApprove: validatedData.autoApprove,
        }),
      },
    });

    // Trigger Inngest job
    const { inngest } = await import("@/inngest/client");
    await inngest.send({
      name: "products/enhance.requested",
      data: {
        userId: session.user.id,
        products: validatedData.products,
        options: validatedData.options,
        saveToDatabase: validatedData.saveToDatabase,
        autoApprove: validatedData.autoApprove,
        jobId: job.id,
      },
    });

    console.log(`✅ Product enhancement job created: ${job.id}`);

    // Return job ID immediately (< 1 second!)
    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: "PENDING",
      message:
        "Product enhancement started. Poll status endpoint for progress.",
    });
  } catch (error) {
    console.error("Product enhancement API error:", error);
    return handleApiError(error, "Failed to start product enhancement");
  }
}

// Keep the old implementation commented for reference
/*
export async function POST_OLD(request: NextRequest) {
  try {
    // Old implementation...
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

            // Debug logging before database insertion
            console.log(`Database Insert Debug for ${enhancedProduct.name}:`);
            console.log(`  isActive: true (MANDATORY)`);
            console.log(`  romanianMinistryApproval: true (MANDATORY)`);
            console.log(
              `  price: ${enhancedProduct.price * 1.2} (20% markup applied)`
            );
            console.log(
              `  status: PENDING_APPROVAL (default for bulk uploads)`
            );

            // Normalize SEO and attributes
            const { seo: rawSeo, legacy } = extractSeoFields(enhancedProduct);
            let cleanedAttributes = stripSeoFromAttributes(
              (enhancedProduct as any).attributes
            );

            // Build metadata with namespaced sections and legacy fallbacks
            const metadata: Record<string, unknown> = {
              ...(enhancedProduct.metadata || {}),
              ...legacy,
              seo: ((): any => {
                const s: any = { ...(rawSeo || {}) };
                if (!s.ogImage) {
                  const firstImage = Array.isArray(enhancedProduct.images)
                    ? enhancedProduct.images[0]
                    : undefined;
                  if (firstImage) s.ogImage = String(firstImage);
                }
                return s;
              })(),
              ai: {
                aiEnhanced: true,
                enhancedBy: "dual-provider",
                fallbackUsed: Boolean(enhancedProduct.fallbackUsed),
                enhancementTimestamp: new Date().toISOString(),
              },
            };

            // Ensure attributes.specs exists with sensible defaults
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
                buildDefaultSpecsFromProduct(enhancedProduct);
            }

            // Create product in database
            const savedProduct = await db.product.create({
              data: {
                // Core fields
                name: enhancedProduct.name,
                slug: slug,
                description:
                  enhancedProduct.enhancedDescription ||
                  enhancedProduct.description,
                price: enhancedProduct.price * 1.2,
                sku: enhancedProduct.sku,
                images: enhancedProduct.images || [],
                categoryId: category.id,
                tags: enhancedProduct.tags || [],
                stockQuantity: enhancedProduct.stockQuantity || 0,
                weight: enhancedProduct.weight || 0.8,
                isActive: true,
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
                romanianMinistryApproval: true,

                // Status - All products require approval by default
                status: "PENDING_APPROVAL",

                // Currency fields
                priceCurrency: "RON",
                compareAtPriceCurrency: "RON",

                // Product specs only
                attributes: cleanedAttributes || {},

                // Structured metadata
                metadata,
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
          auto_approved: 0, // No auto-approval for bulk uploads
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
*/
