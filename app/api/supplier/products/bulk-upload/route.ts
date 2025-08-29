import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Bulk upload schema
const bulkUploadSchema = z.object({
  products: z.array(
    z.object({
      name: z.string().min(1, "Product name is required").max(100),
      description: z
        .string()
        .min(10, "Description must be at least 10 characters")
        .max(1000),
      price: z.number().min(0.01, "Price must be greater than 0"),
      compareAtPrice: z.number().optional(),
      sku: z.string().optional(),
      stockQuantity: z.number().min(0, "Stock quantity cannot be negative"),
      reorderPoint: z.number().min(0).optional(),
      weight: z.number().min(0).optional(),
      category: z.string().optional(),
      tags: z.string().optional(),
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
      productType: z
        .enum([
          "ROBOTICS",
          "PUZZLES",
          "CONSTRUCTION_SETS",
          "EXPERIMENT_KITS",
          "BOARD_GAMES",
        ])
        .optional(),
      learningOutcomes: z.string().optional(),
      specialCategories: z.string().optional(),
      images: z.string().optional(),
    })
  ),
});

// POST - Bulk upload products
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get supplier ID from session
    const supplier = await db.supplier.findUnique({
      where: { userId: session.user.id },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = bulkUploadSchema.parse(body);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; field: string; message: string }>,
    };

    // Process each product
    for (let i = 0; i < validatedData.products.length; i++) {
      const productData = validatedData.products[i];
      const rowNumber = i + 1;

      try {
        // Generate slug from name
        const slug = productData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

        // Check if slug already exists
        const existingProduct = await db.product.findUnique({
          where: { slug },
        });

        if (existingProduct) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            field: "name",
            message: "A product with this name already exists",
          });
          continue;
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
          categoryId = category?.id;
        }

        // Process tags
        const tags = productData.tags
          ? productData.tags
              .split(",")
              .map(tag => tag.trim())
              .filter(Boolean)
          : [];

        // Process learning outcomes
        const learningOutcomes = productData.learningOutcomes
          ? productData.learningOutcomes
              .split(",")
              .map(outcome => outcome.trim())
              .filter(Boolean)
          : [];

        // Process special categories
        const specialCategories = productData.specialCategories
          ? productData.specialCategories
              .split(",")
              .map(cat => cat.trim().toUpperCase())
              .filter(Boolean)
          : [];

        // Process images
        const images = productData.images
          ? productData.images
              .split(",")
              .map(img => img.trim())
              .filter(Boolean)
          : [];

        // Create product
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
            categoryId,
            tags,
            ageGroup: productData.ageGroup,
            stemDiscipline: productData.stemDiscipline,
            productType: productData.productType,
            learningOutcomes,
            specialCategories,
            images,
            supplierId: supplier.id,
            isActive: true,
            featured: false,
          },
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          field: "general",
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
        console.error(`Error creating product at row ${rowNumber}:`, error);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error in bulk upload:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
