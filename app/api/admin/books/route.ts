import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
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

    // Get the default language (e.g., the first one in the database)
    const defaultLanguage = await db.language.findFirst();

    if (!defaultLanguage) {
      return NextResponse.json(
        {
          error:
            "No languages found in the database. Please add a language before creating a book.",
        },
        { status: 500 }
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
        languages: {
          connect: { id: defaultLanguage.id },
        },
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
