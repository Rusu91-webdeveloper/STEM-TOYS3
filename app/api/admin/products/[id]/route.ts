import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { handleFormData } from "@/lib/api-helpers";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { deleteUploadThingFiles } from "@/lib/uploadthing";
import { slugify } from "@/lib/utils";

// In a production application, you would properly implement auth checks
// For this demo, we'll add a fallback for development mode
const isDevelopment = process.env.NODE_ENV === "development";

// Validation schema for product updates
const productUpdateSchema = z.object({
  name: z.string().min(1, "Product name is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  price: z.number().min(0, "Price must be non-negative").optional(),
  stockQuantity: z
    .number()
    .min(0, "Stock quantity must be non-negative")
    .optional(),
  isActive: z.boolean().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  attributes: z.record(z.any()).optional(),
});

// GET handler to retrieve a specific product
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: productId } = await context.params;

    const product = await db.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE handler to remove a product
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: productId } = await context.params;

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        orderItems: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if product has any orders
    if (product.orderItems.length > 0) {
      // Instead of hard delete, mark as inactive if it has orders
      const updatedProduct = await db.product.update({
        where: { id: productId },
        data: {
          isActive: false,
          name: `${product.name} (Deleted)`,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Product marked as inactive due to existing orders",
        product: updatedProduct,
      });
    }

    // Safe to hard delete if no orders exist
    await db.product.delete({
      where: { id: productId },
    });

    // Delete associated images if there are any
    if (
      product.images &&
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {
      try {
        console.log(
          `Deleting ${product.images.length} images for product ${productId}`
        );
        await deleteUploadThingFiles(product.images as string[]);
        console.log(`Successfully deleted images for product ${productId}`);
      } catch (uploadError) {
        console.error("Error deleting product images:", uploadError);
        // Continue with the response even if image deletion fails
      }
    } else {
      console.log(`No images to delete for product ${productId}`);
    }

    // Revalidate caches to ensure product disappears from the UI
    console.log("Revalidating cache tags for product deletion");

    // Revalidate the products list
    revalidateTag("products");

    // Revalidate specific product
    revalidateTag(`product-${product.slug}`);

    // Revalidate category if it exists
    if (product.categoryId) {
      revalidateTag(`category-${product.categoryId}`);
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH handler to update a product
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: productId } = await context.params;

    let updatedData;

    // Check if the request is multipart/form-data or JSON
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // Handle form data (including file uploads)
      const formData = await request.formData();
      updatedData = await handleFormData(formData);
    } else {
      // Handle JSON data
      updatedData = await request.json();
    }

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Prepare data for update
    const updateData: any = {
      name: updatedData.name,
      price: parseFloat(updatedData.price),
      description: updatedData.description,
    };

    // Only update slug if name has changed (and generate slug from name)
    if (updatedData.name && updatedData.name !== existingProduct.name) {
      updateData.slug = slugify(updatedData.name);
    }

    // Only add optional fields if they exist in the update data
    if (updatedData.compareAtPrice) {
      updateData.compareAtPrice = parseFloat(updatedData.compareAtPrice);
    }

    if (updatedData.stock !== undefined) {
      updateData.stockQuantity = parseInt(updatedData.stock, 10);
    }

    if (updatedData.categoryId) {
      updateData.categoryId = updatedData.categoryId;
    }

    if (updatedData.isActive !== undefined) {
      updateData.isActive =
        updatedData.isActive === true || updatedData.isActive === "true";
    }

    if (updatedData.featured !== undefined) {
      updateData.featured =
        updatedData.featured === true || updatedData.featured === "true";
    }

    if (updatedData.tags) {
      updateData.tags = Array.isArray(updatedData.tags)
        ? updatedData.tags
        : JSON.parse(updatedData.tags);
    }

    // Handle attributes as JSON
    if (updatedData.attributes) {
      updateData.attributes =
        typeof updatedData.attributes === "string"
          ? JSON.parse(updatedData.attributes)
          : updatedData.attributes;
    }

    // Handle images array - preserve existing images if not updating
    if (updatedData.images) {
      updateData.images = Array.isArray(updatedData.images)
        ? updatedData.images
        : JSON.parse(updatedData.images);
    }

    // Update product in database
    const updatedProduct = await db.product.update({
      where: { id: productId },
      data: updateData,
      include: { category: true },
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

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate the request body
    const validatedData = productUpdateSchema.parse(body);

    const product = await db.product.update({
      where: { id },
      data: validatedData,
      include: {
        category: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
