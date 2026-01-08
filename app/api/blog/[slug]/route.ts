import DOMPurify from "isomorphic-dompurify";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { blogService } from "@/lib/services/blog-service";

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
      blog = await db.blog.findUnique({
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
      blog = await db.blog.findUnique({
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
        blog = await db.blog.findUnique({
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
    console.log("🔍 UPDATE API - Received data:", {
      hasMultilingual: !!data.multilingual,
      multilingualKeys: data.multilingual
        ? Object.keys(data.multilingual)
        : null,
      enContentLength: data.multilingual?.en?.content?.length || 0,
      roContentLength: data.multilingual?.ro?.content?.length || 0,
      hasTitle: !!data.title,
      hasContent: !!data.content,
      categoryId: data.categoryId,
    });

    // Validate required fields
    if (!data.title || !data.title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!data.excerpt || !data.excerpt.trim()) {
      return NextResponse.json(
        { error: "Excerpt is required" },
        { status: 400 }
      );
    }

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
    const existingBlog = await db.blog.findUnique({
      where: { slug },
    });

    if (!existingBlog) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    // For markdown content, we don't need to sanitize as it will be processed by ReactMarkdown
    // Use Romanian content as the main content, or fall back to the provided content
    const content = data.multilingual?.ro?.content || data.content || existingBlog.content;
    
    // Ensure content is not empty
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Prepare metadata with multilingual content
    const metadata = (existingBlog.metadata as any) || {};

    // Update multilingual content if provided
    if (data.multilingual) {
      console.log(
        "🌍 SETTING LANGUAGE TO BOTH - multilingual content detected"
      );
      // Set language to "both" when multilingual content is present
      metadata.language = "both";
      metadata.multilingual = {
        en: {
          title: data.multilingual.en?.title || "",
          excerpt: data.multilingual.en?.excerpt || "",
          content: data.multilingual.en?.content || "",
        },
        ro: {
          title: data.multilingual.ro?.title || data.title,
          excerpt: data.multilingual.ro?.excerpt || data.excerpt,
          content: data.multilingual.ro?.content || data.content,
        },
      };
      console.log("✅ Updated metadata with language='both'");
    } else {
      console.log("❌ No multilingual data in request");
    }

    // Prepare update data - only include fields that are provided and valid
    const updateData: any = {
      id: existingBlog.id,
      title: data.title.trim(),
      excerpt: data.excerpt.trim(),
      content: content.trim(),
    };

    // Only include optional fields if they are provided
    if (data.coverImage !== undefined) {
      updateData.coverImage = data.coverImage || null;
    }

    if (data.categoryId && data.categoryId.trim()) {
      // Verify category exists
      const category = await db.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        return NextResponse.json(
          { error: "Invalid category ID" },
          { status: 400 }
        );
      }
      updateData.categoryId = data.categoryId;
    }

    if (data.stemCategory) {
      updateData.stemCategory = data.stemCategory;
    }

    if (tags.length > 0) {
      updateData.tags = tags;
    }

    if (data.isPublished !== undefined) {
      updateData.isPublished = data.isPublished;
    }

    // Update blog post using blog service (includes automatic notifications)
    const updatedBlog = await blogService.updateBlog(updateData);

    // Calculate reading time from the actual content being saved
    const contentForReadingTime = content || data.content || "";
    const readingTime = contentForReadingTime
      ? Math.ceil(contentForReadingTime.split(" ").length / 200)
      : existingBlog.readingTime || 5;

    // Update additional fields including metadata using direct database update
    await db.blog.update({
      where: { id: existingBlog.id },
      data: {
        metadata,
        readingTime,
        updatedAt: new Date(),
      },
    });

    console.log(
      `📝 Blog "${updatedBlog.title}" updated via slug endpoint${data.isPublished && !existingBlog.isPublished ? " and published with notifications" : ""}`
    );

    return NextResponse.json(updatedBlog);
  } catch (error: any) {
    console.error(`Error updating blog post with slug ${slug}:`, error);
    console.error(`Error details:`, {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    });

    // Return more specific error messages
    let errorMessage = "Failed to update blog post";
    let statusCode = 500;

    if (error?.code === "P2002") {
      // Unique constraint violation
      errorMessage = "A blog post with this slug or title already exists";
      statusCode = 409;
    } else if (error?.code === "P2025") {
      // Record not found
      errorMessage = "Blog post not found";
      statusCode = 404;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: statusCode }
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
    const existingBlog = await db.blog.findUnique({
      where: { slug },
    });

    if (!existingBlog) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    await db.blog.delete({
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
