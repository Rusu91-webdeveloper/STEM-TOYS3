import DOMPurify from "isomorphic-dompurify";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { blogService } from "@/lib/services/blog-service";

// GET all blogs with optional filters
export async function GET(request: NextRequest) {
  try {
    // Parse URL parameters
    const searchParams = request.nextUrl.searchParams;
    const stemCategory = searchParams.get("stemCategory");
    const categoryId =
      searchParams.get("categoryId") || searchParams.get("category"); // Support both param names
    const language = searchParams.get("language") || "en"; // Default to English if not specified
    const publishedParam = searchParams.get("published") || "true"; // Default to published only

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50); // Max 50 per page
    const skip = (page - 1) * limit;

    console.log(
      `Fetching blogs with filters: language=${language}, stemCategory=${stemCategory}, categoryId=${categoryId}, published=${publishedParam}, page=${page}, limit=${limit}`
    );

    // Build filter object
    const filter: any = {};

    // Handle the published parameter (allow 'all' to show all blogs including drafts)
    if (publishedParam !== "all") {
      filter.isPublished = publishedParam === "true";
    }

    if (stemCategory && stemCategory !== "all") {
      filter.stemCategory = stemCategory;
    }

    if (categoryId && categoryId !== "all") {
      filter.categoryId = categoryId;
    }

    // Get total count for pagination
    const totalCount = await db.blog.count({ where: filter });

    // Fetch blog posts with pagination
    const blogs = await db.blog.findMany({
      where: filter,
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
      orderBy: {
        publishedAt: "desc",
      },
      skip,
      take: limit,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Filter blogs by language using the metadata field
    // Blogs without explicit language metadata are treated as available in Romanian (default)
    const filteredBlogs = blogs.filter(blog => {
      // If requesting all blogs (admin dashboard), don't filter by language
      if (publishedParam === "all") return true;

      const metadata = (blog.metadata || {}) as any;
      const blogLang = metadata.language as string | undefined;

      // Posts explicitly marked for both languages are included only if they
      // actually contain localized content for the requested language
      if (blogLang === "both") {
        const multilingual = metadata?.multilingual || {};
        const localized = multilingual?.[language as "en" | "ro"] || {};
        const hasLocalizedContent = Boolean(
          (localized.title && String(localized.title).trim().length > 0) ||
            (localized.excerpt &&
              String(localized.excerpt).trim().length > 0) ||
            (localized.content && String(localized.content).trim().length > 0)
        );
        return hasLocalizedContent;
      }

      // If blog has explicit language set, require exact match
      if (blogLang) {
        return blogLang === language;
      }

      // Blogs without language metadata are treated as Romanian (default language)
      // This ensures backward compatibility for existing blogs
      return language === "ro";
    });

    // Map multilingual fields to requested language when available
    const localizedBlogs = filteredBlogs.map(blog => {
      try {
        const meta: any = blog.metadata || {};
        const multilingual = meta?.multilingual;
        const supportsBoth = meta?.language === "both";
        if (multilingual && supportsBoth) {
          const lang = (language === "ro" ? "ro" : "en") as "en" | "ro";
          const ml = multilingual[lang] || {};
          return {
            ...blog,
            title: ml.title || blog.title,
            excerpt: ml.excerpt || blog.excerpt,
            content: ml.content || blog.content,
          };
        }
      } catch (_) {
        // noop - fall back to original blog fields on metadata parse issues
      }
      return blog;
    });

    return NextResponse.json({
      blogs: localizedBlogs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}

// POST a new blog post
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to create a blog post" },
        { status: 401 }
      );
    }

    // Check if user is an admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can create blog posts" },
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

    // Set published date if the blog is published
    const publishedAt = data.isPublished ? new Date() : null;

    // Check if the user exists in the database
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
          { error: "Failed to create blog post: No valid author found" },
          { status: 500 }
        );
      }
    }

    // Create default metadata; enhance for multilingual when provided
    const metadata: any = {
      language: data.language || "en",
      metaTitle: data.title,
      metaDescription: data.excerpt,
      keywords: tags,
    };

    // If bilingual content provided, store multilingual payload and set language to "both"
    if (data.multilingual && typeof data.multilingual === "object") {
      const ml = data.multilingual as any;
      metadata.language = "both";
      metadata.multilingual = {
        en: {
          title: ml.en?.title || data.title,
          excerpt: ml.en?.excerpt || data.excerpt,
          content: ml.en?.content || data.content,
        },
        ro: {
          title: ml.ro?.title || "",
          excerpt: ml.ro?.excerpt || "",
          content: ml.ro?.content || "",
        },
      };
    }

    console.log("Creating blog post with data:", {
      title: data.title,
      slug: data.slug,
      authorId,
      categoryId: data.categoryId,
      tags,
      language: metadata.language,
    });

    // For markdown content, we don't need to sanitize as it will be processed by ReactMarkdown
    const content = data.content;

    // Create blog post using blog service (includes automatic notifications)
    const blog = await blogService.createBlog({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content,
      coverImage: data.coverImage || undefined,
      categoryId: data.categoryId,
      authorId,
      stemCategory: data.stemCategory || "GENERAL",
      tags,
      isPublished: data.isPublished || false,
      publishedAt: publishedAt || undefined,
    });

    // Add metadata and reading time using direct database update
    await db.blog.update({
      where: { id: blog.id },
      data: {
        readingTime: Math.ceil(data.content.split(" ").length / 200), // Rough estimate: 200 words per minute
        metadata,
      },
    });

    return NextResponse.json(blog, { status: 201 });
  } catch (error: any) {
    console.error("Error creating blog post:", error);

    // Handle unique constraint violations (e.g., duplicate slug)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A blog with this slug already exists" },
        { status: 400 }
      );
    }

    // Provide more detailed error information
    return NextResponse.json(
      {
        error: "Failed to create blog post",
        details: error.message || "Unknown error",
        code: error.code || "UNKNOWN",
      },
      { status: 500 }
    );
  }
}
