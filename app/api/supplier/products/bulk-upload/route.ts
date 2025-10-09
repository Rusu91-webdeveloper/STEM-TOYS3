import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Enhanced bulk upload schema with better validation
const bulkUploadSchema = z.object({
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
          .optional()
          .refine((val, ctx) => {
            if (val && ctx.parent.price && val <= ctx.parent.price) {
              return false;
            }
            return true;
          }, "Compare at price must be greater than regular price"),
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
          .max(999.99, "Weight cannot exceed 999.99 kg")
          .optional(),
        category: z
          .string()
          .max(100, "Category name must be 100 characters or less")
          .optional()
          .refine(
            cat => !cat || cat.trim().length > 0,
            "Category cannot be empty if provided"
          ),
        tags: z
          .string()
          .max(500, "Tags must be 500 characters or less")
          .optional()
          .refine(
            tags => !tags || tags.trim().length > 0,
            "Tags cannot be empty if provided"
          ),
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
          .optional()
          .default("GENERAL"),
        productType: z
          .enum([
            "ROBOTICS",
            "PUZZLES",
            "CONSTRUCTION_SETS",
            "EXPERIMENT_KITS",
            "BOARD_GAMES",
          ])
          .optional(),
        learningOutcomes: z
          .string()
          .max(500, "Learning outcomes must be 500 characters or less")
          .optional()
          .refine(
            outcomes => !outcomes || outcomes.trim().length > 0,
            "Learning outcomes cannot be empty if provided"
          ),
        specialCategories: z
          .string()
          .max(500, "Special categories must be 500 characters or less")
          .optional()
          .refine(
            cats => !cats || cats.trim().length > 0,
            "Special categories cannot be empty if provided"
          ),
        images: z
          .string()
          .max(2000, "Images must be 2000 characters or less")
          .optional()
          .refine(
            imgs => !imgs || imgs.trim().length > 0,
            "Images cannot be empty if provided"
          ),
      })
    )
    .min(1, "At least one product is required")
    .max(5, "Suppliers can upload maximum 5 products at once"),
});

// Enhanced validation for learning outcomes and special categories
const validateLearningOutcomes = (outcomes: string): string[] => {
  const validOutcomes = [
    "PROBLEM_SOLVING",
    "CREATIVITY",
    "CRITICAL_THINKING",
    "MOTOR_SKILLS",
    "LOGIC",
  ];

  return outcomes
    .split(",")
    .map(outcome => outcome.trim().toUpperCase())
    .filter(outcome => validOutcomes.includes(outcome));
};

const validateSpecialCategories = (categories: string): string[] => {
  const validCategories = [
    "NEW_ARRIVALS",
    "BEST_SELLERS",
    "GIFT_IDEAS",
    "SALE_ITEMS",
  ];

  return categories
    .split(",")
    .map(cat => cat.trim().toUpperCase())
    .filter(cat => validCategories.includes(cat));
};

// POST - Enhanced bulk upload products
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (
      !session?.user ||
      (session.user.role !== "SUPPLIER" && session.user.role !== "ADMIN")
    ) {
      return NextResponse.json(
        {
          error: "Not authorized",
          message:
            "You must be logged in as a supplier or admin to upload products",
        },
        { status: 403 }
      );
    }

    // Get supplier ID from session
    const supplier = await db.supplier.findUnique({
      where: { userId: session.user.id },
    });

    if (!supplier) {
      return NextResponse.json(
        {
          error: "Supplier not found",
          message: "Your supplier account could not be found",
        },
        { status: 404 }
      );
    }

    // Check if supplier is approved
    if (supplier.status !== "APPROVED") {
      return NextResponse.json(
        {
          error: "Account not approved",
          message:
            "Your supplier account must be approved before uploading products",
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = bulkUploadSchema.parse(body);

    console.log(
      `Processing bulk upload for ${validatedData.products.length} products...`
    );

    // Process products synchronously
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

    // Process products in batches for better performance
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < validatedData.products.length; i += batchSize) {
      batches.push(validatedData.products.slice(i, i + batchSize));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      // Process each product in the batch
      for (let i = 0; i < batch.length; i++) {
        const productData = batch[i];
        const rowNumber = batchIndex * batchSize + i + 1;

        try {
          // Generate slug from name
          const slug = productData.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

          // Check if slug already exists
          const existingProduct = await db.product.findFirst({
            where: {
              OR: [
                { slug },
                { name: productData.name, supplierId: supplier.id },
              ],
            },
          });

          if (existingProduct) {
            results.failed++;
            results.errors.push({
              row: rowNumber,
              field: "name",
              message:
                existingProduct.slug === slug
                  ? "A product with this name already exists"
                  : "A product with this name already exists in your catalog",
              value: productData.name,
            });
            continue;
          }

          // Check if SKU already exists
          if (productData.sku) {
            const existingSku = await db.product.findFirst({
              where: { sku: productData.sku },
            });

            if (existingSku) {
              results.failed++;
              results.errors.push({
                row: rowNumber,
                field: "sku",
                message: "A product with this SKU already exists",
                value: productData.sku,
              });
              continue;
            }
          }

          // Find or create category
          let categoryId: string | undefined;
          if (productData.category) {
            const category = await db.category.findFirst({
              where: {
                name: {
                  contains: productData.category,
                  mode: "insensitive",
                },
              },
            });

            if (category) {
              categoryId = category.id;
            } else {
              // Create new category
              const newCategory = await db.category.create({
                data: {
                  name: productData.category,
                  slug: productData.category
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-"),
                  description: `Category for ${productData.category} products`,
                },
              });
              categoryId = newCategory.id;
            }
          }

          // Process tags
          const tags = productData.tags
            ? productData.tags
                .split(",")
                .map(tag => tag.trim())
                .filter(Boolean)
                .slice(0, 20) // Limit to 20 tags
            : [];

          // Process learning outcomes with validation
          const learningOutcomes = productData.learningOutcomes
            ? validateLearningOutcomes(productData.learningOutcomes)
            : [];

          // Process special categories with validation
          const specialCategories = productData.specialCategories
            ? validateSpecialCategories(productData.specialCategories)
            : [];

          // Process images
          const images = productData.images
            ? productData.images
                .split(",")
                .map(img => img.trim())
                .filter(Boolean)
                .slice(0, 10) // Limit to 10 images
            : [];

          // Validate image URLs
          const invalidImages = images.filter(img => !img.startsWith("http"));
          if (invalidImages.length > 0) {
            results.warnings.push({
              row: rowNumber,
              field: "images",
              message: `Some image URLs may be invalid: ${invalidImages.join(", ")}`,
            });
          }

          // Create product with IN_PENDING status (awaiting approval)
          await db.product.create({
            data: {
              name: productData.name,
              slug,
              description: productData.description,
              price: productData.price,
              compareAtPrice: productData.compareAtPrice,
              sku: productData.sku,
              stockQuantity: productData.stockQuantity,
              reorderPoint: productData.reorderPoint,
              weight: productData.weight,
              // Connect category using Prisma relation
              ...(categoryId && {
                category: {
                  connect: { id: categoryId },
                },
              }),
              tags,
              ageGroup: productData.ageGroup,
              stemDiscipline: productData.stemDiscipline || "GENERAL",
              images,
              // Connect supplier using Prisma relation
              supplier: {
                connect: { id: supplier.id },
              },
              status: "IN_PENDING", // Supplier products require approval
              isActive: true,
              featured: false,

              // Metadata field for tracking - store learningOutcomes, specialCategories, and other data here
              metadata: {
                createdViaSupplierBulkUpload: true,
                supplierBulkUploadTimestamp: new Date().toISOString(),
                supplierId: supplier.id,
                productType: productData.productType,
                learningOutcomes,
                specialCategories,
              },
            },
          });

          results.success++;
        } catch (error) {
          results.failed++;
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";

          // Provide more specific error messages
          if (errorMessage.includes("Unique constraint")) {
            results.errors.push({
              row: rowNumber,
              field: "general",
              message: "Product with this name or SKU already exists",
              value: productData.name,
            });
          } else if (errorMessage.includes("Foreign key constraint")) {
            results.errors.push({
              row: rowNumber,
              field: "category",
              message: "Invalid category reference",
              value: productData.category,
            });
          } else {
            results.errors.push({
              row: rowNumber,
              field: "general",
              message: errorMessage,
            });
          }

          console.error(`Error creating product at row ${rowNumber}:`, error);
        }
      }

      // Add a small delay between batches to prevent overwhelming the database
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    results.processingTime = Date.now() - startTime;

    // Return detailed results
    return NextResponse.json({
      ...results,
      summary: {
        total: validatedData.products.length,
        success: results.success,
        failed: results.failed,
        successRate: `${((results.success / validatedData.products.length) * 100).toFixed(1)}%`,
        processingTime: `${(results.processingTime / 1000).toFixed(2)}s`,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join("."),
        message: err.message,
        code: err.code,
      }));

      return NextResponse.json(
        {
          error: "Validation error",
          message: "Please check your data format and try again",
          details: formattedErrors,
          totalErrors: formattedErrors.length,
        },
        { status: 400 }
      );
    }

    console.error("Error in bulk upload:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred. Please try again later.",
      },
      { status: 500 }
    );
  }
}
