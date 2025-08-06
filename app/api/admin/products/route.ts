import { revalidateTag, revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth/admin";
import { getCached, CacheKeys, invalidateCachePattern } from "@/lib/cache";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";
import { applyStandardHeaders } from "@/lib/response-headers";
import { productSchema as baseProductSchema } from "@/lib/validations";

// Extend the base product schema with additional fields specific to this API
const productSchema = baseProductSchema
  .omit({
    category: true, // Remove the base 'category' requirement
    ageRange: true, // Remove the base 'ageRange' object requirement
  })
  .extend({
    slug: z.string().min(1, "Slug is required"),
    compareAtPrice: z
      .number()
      .positive("Compare at price must be positive")
      .nullable()
      .optional(),
    categoryId: z.string().min(1, "Category is required"),
    images: z.array(z.string()).default([]),
    isActive: z.boolean().default(true),
    stock: z
      .number()
      .int()
      .nonnegative("Stock must be zero or positive")
      .default(0),
    // Optional meta fields
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    metaKeywords: z.array(z.string()).optional(),
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
      .enum(["SCIENCE", "TECHNOLOGY", "ENGINEERING", "MATHEMATICS", "GENERAL"])
      .default("GENERAL"),
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
      .optional(),
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
      .array(
        z.enum(["NEW_ARRIVALS", "BEST_SELLERS", "GIFT_IDEAS", "SALE_ITEMS"])
      )
      .optional(),
    // Additional attributes (non-categorization)
    difficultyLevel: z.string().optional(),
    attributes: z.record(z.any()).optional(),
  });

// Schema for product update validation (similar to create but all fields optional)
const productUpdateSchema = productSchema.partial().extend({
  id: z.string().min(1, { message: "Product ID is required" }),
});

// GET all products
export const GET = withRateLimit(
  async (request: NextRequest) => {
    try {
      // Check if user is admin
      if (!(await isAdmin(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // --- Caching logic start ---
      const cacheKey = CacheKeys.productList({ admin: true });
      const CACHE_TTL = 2 * 60 * 1000; // 2 minutes
      const products = await getCached(
        cacheKey,
        async () => {
          // Fetch from database with proper error handling
          try {
            return await db.product.findMany({
              include: {
                category: true,
              },
              orderBy: {
                createdAt: "desc",
              },
            });
          } catch (dbError) {
            console.error("Database error when fetching products:", dbError);
            throw dbError;
          }
        },
        CACHE_TTL
      );
      // --- Caching logic end ---

      return applyStandardHeaders(NextResponse.json(products), {
        cache: "private",
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      return applyStandardHeaders(
        NextResponse.json(
          { error: "Internal Server Error", details: error },
          { status: 500 }
        ),
        { cache: "private" }
      );
    }
  },
  { limit: 30, windowMs: 10 * 60 * 1000 }
);

// POST - Create a new product
export async function POST(request: NextRequest) {
  try {
    // Get the auth session and enforce admin role check
    const session = await auth();
    console.warn("Auth session in POST /api/admin/products:", session);

    if (session?.user?.role !== "ADMIN") {
      console.warn("Unauthorized access attempt: User is not an admin");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.warn("Creating new product");
    const body = await request.json();
    console.warn("Request body:", JSON.stringify(body, null, 2));

    // Validate input
    const validationResult = productSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.format());
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    console.warn("Validated data:", JSON.stringify(data, null, 2));

    // Check if slug is already in use
    const existingProduct = await db.product.findUnique({
      where: { slug: data.slug },
    });

    if (existingProduct) {
      console.warn("Slug already in use:", data.slug);
      return NextResponse.json(
        { error: "Slug already in use" },
        { status: 400 }
      );
    }

    // Create product in database
    try {
      console.warn("Attempting to create product in database");
      const product = await db.product.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          price: data.price,
          compareAtPrice: data.compareAtPrice,
          images: data.images,
          categoryId: data.categoryId,
          tags: data.tags ?? [],
          stockQuantity: data.stock ?? 0,
          // New categorization fields
          ageGroup: data.ageGroup,
          stemDiscipline: data.stemDiscipline,
          learningOutcomes: data.learningOutcomes ?? [],
          productType: data.productType,
          specialCategories: data.specialCategories ?? [],
          attributes: {
            // Include SEO metadata in attributes
            metaTitle: data.metaTitle ?? data.name,
            metaDescription:
              data.metaDescription ?? data.description.substring(0, 160),
            metaKeywords: data.metaKeywords ?? data.tags ?? [],
            // Additional non-categorization attributes
            difficultyLevel: data.difficultyLevel,
            // Any other custom attributes
            ...(data.attributes ?? {}),
          },
          isActive: data.isActive,
        },
        include: {
          category: true,
        },
      });

      console.warn("Product created successfully:", product.id);

      // Revalidate caches to ensure new product is visible immediately
      console.warn("Revalidating cache tags for new product creation");

      // Revalidate the products list
      revalidateTag("products");
      revalidatePath("/admin/products");

      // Revalidate specific product
      revalidateTag(`product-${data.slug}`);

      // Revalidate category pages
      if (data.categoryId) {
        revalidateTag(`category-${data.categoryId}`);
      }

      // After any admin product mutation (POST, PUT, DELETE), add:
      await invalidateCachePattern("products:");
      await invalidateCachePattern("product:");

      return applyStandardHeaders(NextResponse.json(product), {
        cache: "private",
      });
    } catch (dbError) {
      console.error("Database error creating product:", dbError);
      return applyStandardHeaders(
        NextResponse.json(
          { error: "Database error", details: String(dbError) },
          { status: 500 }
        ),
        { cache: "private" }
      );
    }
  } catch (error) {
    console.error("Error creating product:", error);
    return applyStandardHeaders(
      NextResponse.json(
        { error: "Failed to create product", details: String(error) },
        { status: 500 }
      ),
      { cache: "private" }
    );
  }
}

// PUT - Update existing product
export async function PUT(request: NextRequest) {
  try {
    // Check if user is admin
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validationResult = productUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id: data.id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if new slug (if provided) is already in use by another product
    if (data.slug && data.slug !== existingProduct.slug) {
      const slugExists = await db.product.findUnique({
        where: { slug: data.slug },
      });

      if (slugExists && slugExists.id !== data.id) {
        return NextResponse.json(
          { error: "Slug already in use by another product" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};

    // Add basic fields if they exist
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.compareAtPrice !== undefined)
      updateData.compareAtPrice = data.compareAtPrice;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.stock !== undefined) updateData.stockQuantity = data.stock;

    // Add new categorization fields if they exist
    if (data.ageGroup !== undefined) updateData.ageGroup = data.ageGroup;
    if (data.stemDiscipline !== undefined)
      updateData.stemDiscipline = data.stemDiscipline;
    if (data.learningOutcomes !== undefined)
      updateData.learningOutcomes = data.learningOutcomes;
    if (data.productType !== undefined)
      updateData.productType = data.productType;
    if (data.specialCategories !== undefined)
      updateData.specialCategories = data.specialCategories;

    // Handle attributes update
    if (existingProduct.attributes) {
      const currentAttributes = existingProduct.attributes as Record<
        string,
        any
      >;

      const updatedAttributes = {
        ...currentAttributes,
        ...(data.metaTitle !== undefined && {
          metaTitle: data.metaTitle || data.name,
        }),
        ...(data.metaDescription !== undefined && {
          metaDescription:
            data.metaDescription ||
            (data.description ? data.description.substring(0, 160) : undefined),
        }),
        ...(data.metaKeywords !== undefined && {
          metaKeywords: data.metaKeywords,
        }),
        // Legacy fields for backward compatibility
        ...(data.ageRange !== undefined && { ageRange: data.ageRange }),
        ...(data.stemCategory !== undefined && {
          stemCategory: data.stemCategory
            ? data.stemCategory.toUpperCase()
            : undefined,
        }),
        ...(data.difficultyLevel !== undefined && {
          difficultyLevel: data.difficultyLevel,
        }),
        ...(data.learningObjectives !== undefined && {
          learningObjectives: data.learningObjectives,
        }),
        ...(data.attributes ?? {}),
      };

      updateData.attributes = updatedAttributes;
    } else if (
      data.metaTitle ||
      data.metaDescription ||
      data.metaKeywords ||
      data.ageRange ||
      data.stemCategory ||
      data.difficultyLevel ||
      data.learningObjectives ||
      data.attributes
    ) {
      // If there were no previous attributes but now we have some
      updateData.attributes = {
        ...(data.metaTitle && { metaTitle: data.metaTitle || data.name }),
        ...(data.metaDescription && {
          metaDescription:
            data.metaDescription ||
            (data.description ? data.description.substring(0, 160) : undefined),
        }),
        ...(data.metaKeywords && { metaKeywords: data.metaKeywords }),
        // Legacy fields for backward compatibility
        ...(data.ageRange && { ageRange: data.ageRange }),
        ...(data.stemCategory && {
          stemCategory: data.stemCategory
            ? data.stemCategory.toUpperCase()
            : undefined,
        }),
        ...(data.difficultyLevel && { difficultyLevel: data.difficultyLevel }),
        ...(data.learningObjectives && {
          learningObjectives: data.learningObjectives,
        }),
        ...(data.attributes ?? {}),
      };
    }

    // Update product in database
    const updatedProduct = await db.product.update({
      where: { id: data.id },
      data: updateData,
      include: {
        category: true,
      },
    });

    // Store the product slug and category for cache revalidation
    const productSlug = updatedProduct.slug;
    const categoryId = updatedProduct.categoryId;

    // Revalidate caches to ensure product updates are visible immediately
    console.warn("Revalidating cache tags for product update");

    // Revalidate the products list
    revalidateTag("products");
    revalidatePath("/admin/products");

    // Revalidate specific product
    revalidateTag(`product-${productSlug}`);

    // If old slug is different from new slug, revalidate the old one too
    if (existingProduct.slug !== productSlug) {
      revalidateTag(`product-${existingProduct.slug}`);
    }

    // Revalidate category pages
    if (categoryId) {
      revalidateTag(`category-${categoryId}`);
    }

    // If category was changed, revalidate the old category too
    if (existingProduct.categoryId !== categoryId) {
      revalidateTag(`category-${existingProduct.categoryId}`);
    }

    // After any admin product mutation (POST, PUT, DELETE), add:
    await invalidateCachePattern("products:");
    await invalidateCachePattern("product:");

    return applyStandardHeaders(NextResponse.json(updatedProduct), {
      cache: "private",
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return applyStandardHeaders(
      NextResponse.json({ error: "Internal Server Error" }, { status: 500 }),
      { cache: "private" }
    );
  }
}

// DELETE - Remove a product
export async function DELETE(request: NextRequest) {
  try {
    // Check if user is admin
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get product ID from URL
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Store product images before deleting the product
    const productImages = existingProduct.images as string[];

    // Store product info for cache invalidation
    const productSlug = existingProduct.slug;
    const categoryId = existingProduct.categoryId;

    // Delete product
    await db.product.delete({
      where: { id },
    });

    // Delete associated images from UploadThing
    if (productImages && productImages.length > 0) {
      try {
        const { deleteUploadThingFiles } = await import("@/lib/uploadthing");
        const deleteResult = await deleteUploadThingFiles(productImages);
        console.warn("UploadThing delete result:", deleteResult);
      } catch (imageError) {
        // Log but don't fail the request if image deletion fails
        console.error("Failed to delete product images:", imageError);
      }
    }

    // Revalidate caches to ensure product disappears from the UI
    console.warn("Revalidating cache tags for product deletion");

    // Revalidate the products list
    revalidateTag("products");
    revalidatePath("/admin/products");

    // Revalidate specific product
    revalidateTag(`product-${productSlug}`);

    // Revalidate category if it exists
    if (categoryId) {
      revalidateTag(`category-${categoryId}`);
    }

    // After any admin product mutation (POST, PUT, DELETE), add:
    await invalidateCachePattern("products:");
    await invalidateCachePattern("product:");

    return applyStandardHeaders(
      NextResponse.json(
        { message: "Product deleted successfully" },
        { status: 200 }
      ),
      { cache: "private" }
    );
  } catch (error) {
    console.error("Error deleting product:", error);
    return applyStandardHeaders(
      NextResponse.json({ error: "Internal Server Error" }, { status: 500 }),
      { cache: "private" }
    );
  }
}
