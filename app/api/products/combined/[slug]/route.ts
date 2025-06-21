import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    // First, try to find a product with this slug
    const product = await db.product.findFirst({
      where: {
        slug: slug,
        isActive: true,
      },
      include: {
        category: true,
      },
    });

    if (product) {
      return NextResponse.json(product);
    }

    // If no product found, try to find a book
    const book = await db.book.findFirst({
      where: {
        slug: slug,
        isActive: true,
      },
      include: {
        languages: true,
      },
    });

    if (book) {
      // Transform book to product-like structure
      const bookAsProduct = {
        id: book.id,
        name: book.name,
        slug: book.slug,
        description: book.description,
        price: book.price,
        compareAtPrice: null,
        images: book.coverImage ? [book.coverImage] : [],
        category: {
          id: "educational-books",
          name: "Educational Books",
          slug: "educational-books",
        },
        tags: ["book", "educational"],
        attributes: {
          author: book.author,
          languages:
            (book as any).languages?.map((lang: any) => lang.name) || [],
        },
        isActive: book.isActive,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
        stockQuantity: 10,
        featured: true,
        isBook: true, // Flag to identify this as a book
      };

      return NextResponse.json(bookAsProduct);
    }

    // If neither product nor book found
    return NextResponse.json(
      { error: `No product or book found with slug: ${slug}` },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error fetching combined product/book:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
