import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

// Validation schema for book updates
const bookUpdateSchema = z.object({
  name: z.string().min(1, "Book name is required").optional(),
  author: z.string().min(1, "Author is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  price: z.number().min(0, "Price must be non-negative").optional(),
  coverImage: z.string().url().nullable().optional(),
  isActive: z.boolean().optional(),
  slug: z.string().min(1, "Slug is required").optional(),
});

export async function GET(
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

    const book = await db.book.findUnique({
      where: { id },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    return NextResponse.json(book);
  } catch (error) {
    console.error("Error fetching book:", error);
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
    const validatedData = bookUpdateSchema.parse(body);

    const book = await db.book.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(book);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating book:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Check if book exists and has any orders
    // Note: Books are referenced through Product model in orders
    const book = await db.book.findUnique({
      where: { id },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Check if book has any orders by looking for products that reference this book
    const relatedProducts = await db.product.findMany({
      where: {
        name: book.name, // Books typically have matching product names
      },
      include: {
        orderItems: true,
      },
    });

    const hasOrders = relatedProducts.some(
      (product) => product.orderItems.length > 0
    );

    if (hasOrders) {
      const totalOrders = relatedProducts.reduce(
        (total, product) => total + product.orderItems.length,
        0
      );
      return NextResponse.json(
        {
          error:
            "Cannot delete book with existing orders. This book has been purchased and must be preserved for order history.",
          orderCount: totalOrders,
        },
        { status: 400 }
      );
    }

    // Safe to hard delete - no orders exist
    await db.book.delete({
      where: { id },
    });

    // Invalidate cache to ensure the book doesn't show up in products
    const { revalidateTag } = await import("next/cache");
    revalidateTag("books");
    revalidateTag(`book-${book.slug}`);

    return NextResponse.json({
      success: true,
      message: "Book deleted permanently",
    });
  } catch (error) {
    console.error("Error deleting book:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
