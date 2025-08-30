import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Validation schema for single product
const validateProductSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .max(100, "Product name must be 100 characters or less")
    .refine(name => name.trim().length > 0, "Product name cannot be empty"),
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
  categoryId: z.string().optional(),
  tags: z
    .array(z.string())
    .max(20, "Cannot have more than 20 tags")
    .default([])
    .refine(
      tags => tags.every(tag => tag.trim().length > 0),
      "Tags cannot be empty"
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
    .enum(["SCIENCE", "TECHNOLOGY", "ENGINEERING", "MATHEMATICS", "GENERAL"])
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
    .array(
      z.enum([
        "PROBLEM_SOLVING",
        "CREATIVITY",
        "CRITICAL_THINKING",
        "MOTOR_SKILLS",
        "LOGIC",
      ])
    )
    .max(5, "Cannot have more than 5 learning outcomes")
    .default([]),
  specialCategories: z
    .array(z.enum(["NEW_ARRIVALS", "BEST_SELLERS", "GIFT_IDEAS", "SALE_ITEMS"]))
    .max(4, "Cannot have more than 4 special categories")
    .default([]),
  images: z
    .array(z.string())
    .max(10, "Cannot have more than 10 images")
    .default([])
    .refine(
      images => images.every(img => img.startsWith("http")),
      "All images must be valid URLs"
    ),
});

// Validation schema for bulk products
const validateBulkProductsSchema = z.object({
  products: z
    .array(validateProductSchema)
    .min(1, "At least one product is required")
    .max(1000, "Cannot validate more than 1000 products at once"),
});

// POST - Validate single product
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
            "You must be logged in as a supplier or admin to validate products",
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
            "Your supplier account must be approved before validating products",
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { type = "single", data } = body;

    if (type === "single") {
      // Validate single product
      const validatedData = validateProductSchema.parse(data);

      // Check for existing products with same name or SKU
      const existingChecks = await Promise.all([
        db.product.findFirst({
          where: {
            OR: [
              { name: validatedData.name, supplierId: supplier.id },
              {
                slug: validatedData.name
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/(^-|-$)/g, ""),
              },
            ],
          },
        }),
        validatedData.sku
          ? db.product.findFirst({
              where: { sku: validatedData.sku },
            })
          : null,
      ]);

      const [existingName, existingSku] = existingChecks;

      const warnings = [];
      const errors = [];

      if (existingName) {
        errors.push({
          field: "name",
          message: "A product with this name already exists in your catalog",
          code: "DUPLICATE_NAME",
        });
      }

      if (existingSku) {
        errors.push({
          field: "sku",
          message: "A product with this SKU already exists",
          code: "DUPLICATE_SKU",
        });
      }

      // Check category exists if provided
      if (validatedData.categoryId) {
        const category = await db.category.findUnique({
          where: { id: validatedData.categoryId },
        });

        if (!category) {
          errors.push({
            field: "categoryId",
            message: "Selected category does not exist",
            code: "INVALID_CATEGORY",
          });
        }
      }

      // Check for potential issues
      if (validatedData.stockQuantity <= (validatedData.reorderPoint || 0)) {
        warnings.push({
          field: "stockQuantity",
          message: "Stock quantity is at or below reorder point",
          code: "LOW_STOCK",
        });
      }

      if (validatedData.price < 10) {
        warnings.push({
          field: "price",
          message: "Price seems low for a STEM product",
          code: "LOW_PRICE",
        });
      }

      return NextResponse.json({
        valid: errors.length === 0,
        errors,
        warnings,
        summary: {
          totalErrors: errors.length,
          totalWarnings: warnings.length,
          isValid: errors.length === 0,
        },
      });
    } else if (type === "bulk") {
      // Validate bulk products
      const validatedData = validateBulkProductsSchema.parse(data);

      const results = {
        valid: true,
        errors: [] as Array<{
          row: number;
          field: string;
          message: string;
          code: string;
        }>,
        warnings: [] as Array<{
          row: number;
          field: string;
          message: string;
          code: string;
        }>,
        summary: {
          total: validatedData.products.length,
          valid: 0,
          invalid: 0,
          totalErrors: 0,
          totalWarnings: 0,
        },
      };

      // Check for duplicates within the batch
      const names = new Set<string>();
      const skus = new Set<string>();

      for (let i = 0; i < validatedData.products.length; i++) {
        const product = validatedData.products[i];
        const rowNumber = i + 1;
        let rowValid = true;

        // Check for duplicate names within batch
        if (names.has(product.name)) {
          results.errors.push({
            row: rowNumber,
            field: "name",
            message: "Duplicate product name within this batch",
            code: "DUPLICATE_NAME_BATCH",
          });
          rowValid = false;
        } else {
          names.add(product.name);
        }

        // Check for duplicate SKUs within batch
        if (product.sku && skus.has(product.sku)) {
          results.errors.push({
            row: rowNumber,
            field: "sku",
            message: "Duplicate SKU within this batch",
            code: "DUPLICATE_SKU_BATCH",
          });
          rowValid = false;
        } else if (product.sku) {
          skus.add(product.sku);
        }

        // Check for potential issues
        if (product.stockQuantity <= (product.reorderPoint || 0)) {
          results.warnings.push({
            row: rowNumber,
            field: "stockQuantity",
            message: "Stock quantity is at or below reorder point",
            code: "LOW_STOCK",
          });
        }

        if (product.price < 10) {
          results.warnings.push({
            row: rowNumber,
            field: "price",
            message: "Price seems low for a STEM product",
            code: "LOW_PRICE",
          });
        }

        if (rowValid) {
          results.summary.valid++;
        } else {
          results.summary.invalid++;
        }
      }

      // Check for existing products in database
      const existingNames = await db.product.findMany({
        where: {
          OR: [
            { name: { in: Array.from(names) }, supplierId: supplier.id },
            { sku: { in: Array.from(skus).filter(Boolean) } },
          ],
        },
        select: { name: true, sku: true },
      });

      const existingNameSet = new Set(existingNames.map(p => p.name));
      const existingSkuSet = new Set(
        existingNames.map(p => p.sku).filter(Boolean)
      );

      for (let i = 0; i < validatedData.products.length; i++) {
        const product = validatedData.products[i];
        const rowNumber = i + 1;

        if (existingNameSet.has(product.name)) {
          results.errors.push({
            row: rowNumber,
            field: "name",
            message: "A product with this name already exists in your catalog",
            code: "DUPLICATE_NAME_DB",
          });
          results.summary.valid--;
          results.summary.invalid++;
        }

        if (product.sku && existingSkuSet.has(product.sku)) {
          results.errors.push({
            row: rowNumber,
            field: "sku",
            message: "A product with this SKU already exists",
            code: "DUPLICATE_SKU_DB",
          });
          results.summary.valid--;
          results.summary.invalid++;
        }
      }

      results.summary.totalErrors = results.errors.length;
      results.summary.totalWarnings = results.warnings.length;
      results.valid = results.summary.invalid === 0;

      return NextResponse.json(results);
    } else {
      return NextResponse.json(
        {
          error: "Invalid validation type",
          message: "Type must be 'single' or 'bulk'",
        },
        { status: 400 }
      );
    }
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

    console.error("Error validating product:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred. Please try again later.",
      },
      { status: 500 }
    );
  }
}
