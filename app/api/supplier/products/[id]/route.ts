import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { validateCsrfForRequest } from "@/lib/csrf";

// Product update schema (all fields optional except id)
const updateProductSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(10).max(1000).optional(),
  price: z.number().min(0.01).optional(),
  compareAtPrice: z.number().optional(),
  sku: z.string().optional(),
  stockQuantity: z.number().min(0).optional(),
  reorderPoint: z.number().min(0).optional(),
  weight: z.number().min(0).optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  featured: z.boolean().optional(),
  ageGroup: z
    .enum(["TODDLER", "PRESCHOOL", "SCHOOL_AGE", "TEEN", "ALL_AGES"])
    .optional(),
  stemDiscipline: z
    .enum(["SCIENCE", "TECHNOLOGY", "ENGINEERING", "MATH", "GENERAL"])
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
  learningOutcomes: z.array(z.string()).optional(),
  specialCategories: z.array(z.string()).optional(),
  attributes: z.record(z.any()).optional(),
  images: z.array(z.string()).optional(),
});

// GET - Get specific product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Get product and verify ownership
    const product = await db.product.findFirst({
      where: {
        id: id,
        supplierId: supplier.id,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching supplier product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Verify product ownership
    const existingProduct = await db.product.findFirst({
      where: {
        id: id,
        supplierId: supplier.id,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // CSRF validation
    let csrfBody: any = null;
    try {
      const clone = request.clone();
      csrfBody = await clone.json();
    } catch {}
    const csrfResult = await validateCsrfForRequest(request, csrfBody);
    if (!csrfResult.valid) {
      return NextResponse.json(
        { error: "CSRF validation failed", message: csrfResult.error },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = csrfBody ?? (await request.json());
    const validatedData = updateProductSchema.parse(body);

    // If name is being updated, check for slug conflicts
    if (validatedData.name && validatedData.name !== existingProduct.name) {
      const newSlug = validatedData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const slugConflict = await db.product.findFirst({
        where: {
          slug: newSlug,
          id: { not: id },
        },
      });

      if (slugConflict) {
        return NextResponse.json(
          { error: "A product with this name already exists" },
          { status: 400 }
        );
      }

      // Update slug if name changed
      validatedData.slug = newSlug;
    }

    // Update product
    const updatedProduct = await db.product.update({
      where: { id: id },
      data: validatedData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating supplier product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Partial update (for status changes, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Verify product ownership
    const existingProduct = await db.product.findFirst({
      where: {
        id: id,
        supplierId: supplier.id,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // CSRF validation
    let csrfBody: any = null;
    try {
      const clone = request.clone();
      csrfBody = await clone.json();
    } catch {}
    const csrfResult = await validateCsrfForRequest(request, csrfBody);
    if (!csrfResult.valid) {
      return NextResponse.json(
        { error: "CSRF validation failed", message: csrfResult.error },
        { status: 403 }
      );
    }

    // Parse request body and validate minimal shape
    const body = csrfBody ?? (await request.json());
    const partialSchema = updateProductSchema.partial();
    const validatedPartial = partialSchema.parse(body);

    // Update product
    const updatedProduct = await db.product.update({
      where: { id: id },
      data: body,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating supplier product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // CSRF validation (no body needed)
    const csrfResult = await validateCsrfForRequest(request);
    if (!csrfResult.valid) {
      return NextResponse.json(
        { error: "CSRF validation failed", message: csrfResult.error },
        { status: 403 }
      );
    }
    const { id } = await params;

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

    // Verify product ownership
    const existingProduct = await db.product.findFirst({
      where: {
        id: id,
        supplierId: supplier.id,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if product has any orders
    const orderCount = await db.orderItem.count({
      where: {
        productId: id,
      },
    });

    if (orderCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete product with existing orders" },
        { status: 400 }
      );
    }

    // Delete product
    await db.product.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting supplier product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
