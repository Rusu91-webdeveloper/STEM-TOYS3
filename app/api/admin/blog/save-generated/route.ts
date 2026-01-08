import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { StemCategory } from "@prisma/client";

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim();
}

// Helper function to find or create blog category
async function findOrCreateBlogCategory(stemCategory: StemCategory) {
  const categoryNameMap: Record<StemCategory, string> = {
    SCIENCE: "Știință",
    TECHNOLOGY: "Tehnologie",
    ENGINEERING: "Inginerie",
    MATHEMATICS: "Matematică",
    GENERAL: "Educație STEM",
  };

  const categoryName = categoryNameMap[stemCategory] || "Educație STEM";
  const slug = generateSlug(categoryName);

  // Try to find existing category
  let category = await db.category.findFirst({
    where: {
      OR: [
        { name: { equals: categoryName, mode: "insensitive" } },
        { slug: slug },
      ],
    },
  });

  // Create category if it doesn't exist
  if (!category) {
    category = await db.category.create({
      data: {
        name: categoryName,
        slug: slug,
        description: `${categoryName} - articole și resurse educaționale`,
        isActive: true,
      },
    });
  }

  return category;
}

// Schema for saving AI-generated blog
const saveGeneratedBlogSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  excerpt: z.string().min(1, "Excerpt is required"),
  content: z.string().min(1, "Content is required"),
  coverImage: z.string().nullable().optional(),
  stemCategory: z
    .enum(["SCIENCE", "TECHNOLOGY", "ENGINEERING", "MATHEMATICS", "GENERAL"])
    .default("GENERAL"),
  tags: z.array(z.string()).default([]),
  metadata: z.any().optional(),
  readingTime: z.number().default(5),
  isPublished: z.boolean().default(false),
});

// POST - Save AI-generated blog to database
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = saveGeneratedBlogSchema.parse(body);

    // Find or create category
    const category = await findOrCreateBlogCategory(
      validatedData.stemCategory as StemCategory
    );

    // Generate unique slug if not provided
    let slug = validatedData.slug || generateSlug(validatedData.title);
    const existingBlog = await db.blog.findUnique({ where: { slug } });

    // If slug exists, append timestamp
    if (existingBlog) {
      slug = `${slug}-${Date.now()}`;
    }

    // Get author ID
    let authorId = session.user.id;
    const userExists = await db.user.findUnique({
      where: { id: authorId },
      select: { id: true },
    });

    // If user doesn't exist, use the admin user from the database
    if (!userExists) {
      const adminUser = await db.user.findFirst({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      if (adminUser) {
        authorId = adminUser.id;
      } else {
        return NextResponse.json(
          { error: "Failed to save blog: No valid author found" },
          { status: 500 }
        );
      }
    }

    // Create blog post
    const blog = await db.blog.create({
      data: {
        title: validatedData.title,
        slug: slug,
        excerpt: validatedData.excerpt,
        content: validatedData.content,
        coverImage: validatedData.coverImage || null,
        categoryId: category.id,
        authorId: authorId,
        tags: validatedData.tags,
        metadata: validatedData.metadata || {
          aiGenerated: true,
        },
        isPublished: validatedData.isPublished,
        readingTime: validatedData.readingTime,
        stemCategory: validatedData.stemCategory as StemCategory,
        socialShares: 0,
      },
    });

    console.log(`✅ Blog "${blog.title}" saved successfully as draft`);

    return NextResponse.json(
      {
        success: true,
        id: blog.id,
        slug: blog.slug,
        title: blog.title,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving AI-generated blog:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    // Handle unique constraint violations (e.g., duplicate slug)
    if ((error as any)?.code === "P2002") {
      return NextResponse.json(
        {
          error: "A blog post with this slug already exists. Please try again.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save blog. Please try again.",
      },
      { status: 500 }
    );
  }
}
