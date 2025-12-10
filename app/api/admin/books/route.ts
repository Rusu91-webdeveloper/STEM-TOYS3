import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { invalidateBookCaches } from "@/lib/cache-smart-invalidation";
import { db } from "@/lib/db";

// Validation schema for book creation/update
const bookSchema = z.object({
  name: z.string().min(1, "Book name is required"),
  author: z.string().min(1, "Author is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0, "Price must be non-negative"),
  coverImage: z.string().url().nullable().optional(),
  isActive: z.boolean().default(true),
  slug: z.string().min(1, "Slug is required"),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    // Block VISITOR role from write operations
    if (session?.user?.role === "VISITOR") {
      return NextResponse.json(
        {
          error: "Demo Mode - Read Only Access",
          message:
            "This is a demonstration account. Write operations are disabled.",
          isDemo: true,
        },
        { status: 403 }
      );
    }

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate the request body
    const validatedData = bookSchema.parse(body);

    // Check if slug already exists
    const existingBook = await db.book.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingBook) {
      return NextResponse.json(
        { error: "A book with this slug already exists" },
        { status: 400 }
      );
    }

    // Create the book without requiring languages
    // Languages will be associated when digital files are uploaded
    const book = await db.book.create({
      data: {
        name: validatedData.name,
        author: validatedData.author,
        description: validatedData.description,
        price: validatedData.price,
        coverImage: validatedData.coverImage,
        isActive: validatedData.isActive,
        slug: validatedData.slug,
      },
    });

    await invalidateBookCaches({
      bookId: book.id,
      bookSlug: book.slug,
      reason: `Book created: ${book.name}`,
    });

    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    console.error("Error creating book:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all books
    const books = await db.book.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
