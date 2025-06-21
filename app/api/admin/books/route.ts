import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

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

    // Create the book
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

export async function GET(request: NextRequest) {
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
