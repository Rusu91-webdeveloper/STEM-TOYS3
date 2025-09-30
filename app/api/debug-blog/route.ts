import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blogId = searchParams.get("id");

    if (!blogId) {
      return NextResponse.json({ error: "Blog ID required" }, { status: 400 });
    }

    const blog = await db.blog.findUnique({
      where: { id: blogId },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        tags: true,
        metadata: true,
        readingTime: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json({
      blog: {
        id: blog.id,
        title: blog.title || "EMPTY",
        slug: blog.slug || "EMPTY",
        excerpt: blog.excerpt
          ? blog.excerpt.substring(0, 100) + "..."
          : "EMPTY",
        contentLength: blog.content ? blog.content.length : 0,
        tags: blog.tags || [],
        readingTime: blog.readingTime,
        wordCount: blog.wordCount,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
        metadata: blog.metadata,
        contentSample: blog.content
          ? blog.content.substring(0, 200) + "..."
          : "EMPTY",
      },
    });
  } catch (error) {
    console.error("Error checking blog:", error);
    return NextResponse.json(
      {
        error: "Failed to check blog",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
