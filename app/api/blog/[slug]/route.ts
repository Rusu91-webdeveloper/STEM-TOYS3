import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import DOMPurify from "isomorphic-dompurify";

import { auth } from "@/lib/auth";
import { blogService } from "@/lib/services/blog-service";

const prisma = new PrismaClient();

// GET a single blog post by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const language = request.nextUrl.searchParams.get("language") || "en"; // Default to English

  console.log(`Fetching blog post with slug ${slug} and language ${language}`);

  try {
    // First, try to find a blog post with the language in the slug (e.g., "my-post-ro")
    let blog = null;

    // Check if slug contains a language suffix
    const slugHasLanguage = slug.endsWith("-ro") || slug.endsWith("-en");

    if (slugHasLanguage) {
      // If the slug already has a language suffix, use it directly
      blog = await prisma.blog.findUnique({
        where: { slug },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    } else {
      // If no language in slug, try with language suffix first, then fall back to original slug
      const languageSuffix = language === "ro" ? "-ro" : "-en";
      const localizedSlug = `${slug}${languageSuffix}`;

      // Try to find the localized version first
      blog = await prisma.blog.findUnique({
        where: { slug: localizedSlug },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      // If not found, fall back to the original slug
      if (!blog) {
        blog = await prisma.blog.findUnique({
          where: { slug },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        });
      }
    }

    if (!blog) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    // For unpublished blogs, check authentication and permission
    if (!blog.isPublished) {
      const session = await auth();

      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Blog post not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(blog);
  } catch (error) {
    console.error(`Error fetching blog post with slug ${slug}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 }
    );
  }
}

// PUT/PATCH to update a blog post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to update a blog post" },
        { status: 401 }
      );
    }

    // Check if user is an admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can update blog posts" },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Process tags from comma-separated string to array
    let tags: string[] = [];
    if (typeof data.tags === "string") {
      tags = data.tags
        .split(",")
        .map((tag: string) => tag.trim())
        .filter(Boolean);
    } else if (Array.isArray(data.tags)) {
      tags = data.tags;
    }

    // Check if blog exists
    const existingBlog = await prisma.blog.findUnique({
      where: { slug },
    });

    if (!existingBlog) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    const sanitizedContent = DOMPurify.sanitize(data.content);

    // Update blog post using blog service (includes automatic notifications)
    const updatedBlog = await blogService.updateBlog({
      id: existingBlog.id,
      title: data.title,
      excerpt: data.excerpt,
      content: sanitizedContent,
      coverImage: data.coverImage,
      categoryId: data.categoryId,
      stemCategory: data.stemCategory,
      tags,
      isPublished: data.isPublished,
    });

    // Update additional fields using direct database update
    await prisma.blog.update({
      where: { id: existingBlog.id },
      data: {
        readingTime: Math.ceil(data.content.split(" ").length / 200), // Rough estimate: 200 words per minute
        updatedAt: new Date(),
      },
    });

    console.log(
      `📝 Blog "${updatedBlog.title}" updated via slug endpoint${data.isPublished && !existingBlog.isPublished ? " and published with notifications" : ""}`
    );

    return NextResponse.json(updatedBlog);
  } catch (error: any) {
    console.error(`Error updating blog post with slug ${slug}:`, error);
    return NextResponse.json(
      { error: "Failed to update blog post" },
      { status: 500 }
    );
  }
}

// DELETE a blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to delete a blog post" },
        { status: 401 }
      );
    }

    // Check if user is an admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can delete blog posts" },
        { status: 403 }
      );
    }

    // Check if blog exists
    const existingBlog = await prisma.blog.findUnique({
      where: { slug },
    });

    if (!existingBlog) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    await prisma.blog.delete({
      where: { slug },
    });

    return NextResponse.json(
      { message: "Blog post deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting blog post with slug ${slug}:`, error);
    return NextResponse.json(
      { error: "Failed to delete blog post" },
      { status: 500 }
    );
  }
}
