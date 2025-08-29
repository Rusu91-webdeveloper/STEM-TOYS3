import { NextRequest, NextResponse } from "next/server";
import { Session } from "next-auth";
import { z } from "zod";

import { withAdminAuth } from "@/lib/authorization";
import { db } from "@/lib/db";
import { blogService } from "@/lib/services/blog-service";
import { resolveAdminUserId } from "@/lib/admin-utils";

// Schema for creating a blog post
const createBlogSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  content: z.string().min(1, "Content is required"),
  coverImage: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  stemCategory: z.enum([
    "SCIENCE",
    "TECHNOLOGY",
    "ENGINEERING",
    "MATHEMATICS",
    "GENERAL",
  ]),
  tags: z.array(z.string()),
  isPublished: z.boolean().default(false),
});

// GET /api/admin/blogs - Get all blogs with optional filtering
export const GET = withAdminAuth(
  async (request: NextRequest, session: Session) => {
    const { searchParams } = new URL(request.url);
    const stemCategory = searchParams.get("stemCategory");
    const categoryId = searchParams.get("categoryId");
    const isPublished = searchParams.has("isPublished")
      ? searchParams.get("isPublished") === "true"
      : undefined;

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build query
    const where: any = {};
    if (stemCategory) {
      where.stemCategory = stemCategory;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (isPublished !== undefined) {
      where.isPublished = isPublished;
    }

    // Execute query
    const [blogs, total] = await Promise.all([
      db.blog.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
          category: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.blog.count({ where }),
    ]);

    return NextResponse.json({
      blogs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
);

// POST /api/admin/blogs - Create a new blog post
export const POST = withAdminAuth(
  async (request: NextRequest, session: Session) => {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = createBlogSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Resolve the actual admin user ID (handles admin_env case)
    const authorId = await resolveAdminUserId(
      session.user.id,
      session.user.email
    );

    // Create blog post using blog service (includes automatic notifications)
    const blog = await blogService.createBlog({
      ...data,
      authorId,
    });

    console.log(
      `📝 Blog "${blog.title}" created successfully${blog.isPublished ? " and published with notifications" : " as draft"}`
    );

    return NextResponse.json(blog, { status: 201 });
  }
);
