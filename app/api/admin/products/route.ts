import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  withErrorHandling,
  badRequest,
  notFound,
  handleZodError,
  handleUnexpectedError,
} from "@/lib/api-error";
import { handleFormData } from "@/lib/api-helpers";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth/admin";
import {
  getCached,
  CacheKeys,
  invalidateCache,
  invalidateCachePattern,
} from "@/lib/cache";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";
import { applyStandardHeaders } from "@/lib/response-headers";
import { utapi } from "@/lib/uploadthing";
import { slugify } from "@/lib/utils";
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
    // Optional product attributes - redefine ageRange as string
    ageRange: z.string().optional(),
    stemCategory: z.string().optional(),
    difficultyLevel: z.string().optional(),
    learningObjectives: z.array(z.string()).optional(),
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
    console.log("Auth session in POST /api/admin/products:", session);

    if (session?.user?.role !== "ADMIN") {
      console.log("Unauthorized access attempt: User is not an admin");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Creating new product");
    const body = await request.json();
    console.log("Request body:", JSON.stringify(body, null, 2));

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
    console.log("Validated data:", JSON.stringify(data, null, 2));

    // Check if slug is already in use
    const existingProduct = await db.product.findUnique({
      where: { slug: data.slug },
    });

    if (existingProduct) {
      console.log("Slug already in use:", data.slug);
      return NextResponse.json(
        { error: "Slug already in use" },
        { status: 400 }
      );
    }

    // Create product in database
    try {
      console.log("Attempting to create product in database");
      const product = await db.product.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          price: data.price,
          compareAtPrice: data.compareAtPrice,
          images: data.images,
          categoryId: data.categoryId,
          tags: data.tags || [],
          stockQuantity: data.stock || 0,
          attributes: {
            // Include SEO metadata in attributes
            metaTitle: data.metaTitle || data.name,
            metaDescription:
              data.metaDescription || data.description.substring(0, 160),
            metaKeywords: data.metaKeywords || data.tags || [],
            ageRange: data.ageRange,
            stemCategory: data.stemCategory
              ? data.stemCategory.toUpperCase()
              : undefined,
            difficultyLevel: data.difficultyLevel,
            learningObjectives: data.learningObjectives,
            // Any other custom attributes
            ...(data.attributes || {}),
          },
          isActive: data.isActive,
        },
        include: {
          category: true,
        },
      });

      console.log("Product created successfully:", product.id);

      // Revalidate caches to ensure new product is visible immediately
      console.log("Revalidating cache tags for new product creation");

      // Revalidate the products list
      revalidateTag("products");

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
        ...(data.attributes || {}),
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
        ...(data.attributes || {}),
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
    console.log("Revalidating cache tags for product update");

    // Revalidate the products list
    revalidateTag("products");

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
        console.log("UploadThing delete result:", deleteResult);
      } catch (imageError) {
        // Log but don't fail the request if image deletion fails
        console.error("Failed to delete product images:", imageError);
      }
    }

    // Revalidate caches to ensure product disappears from the UI
    console.log("Revalidating cache tags for product deletion");

    // Revalidate the products list
    revalidateTag("products");

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
