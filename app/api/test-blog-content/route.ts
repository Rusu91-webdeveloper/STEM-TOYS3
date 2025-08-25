import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Check if user is authenticated and is admin
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can create test blog posts" },
        { status: 403 }
      );
    }

    // Get or create a category
    let category = await db.category.findFirst({
      where: { name: "STEM Education" },
    });

    if (!category) {
      category = await db.category.create({
        data: {
          name: "STEM Education",
          slug: "stem-education",
          description:
            "Educational content about Science, Technology, Engineering, and Mathematics",
          isActive: true,
        },
      });
    }

    // Get the admin user
    const adminUser = await db.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: "No admin user found" },
        { status: 500 }
      );
    }

    // Create a simple test blog post
    const testBlog = await db.blog.create({
      data: {
        title: "Test Blog Post - Simple Markdown",
        slug: "test-blog-simple-markdown",
        excerpt: "A simple test blog post to check markdown rendering.",
        content: `# Test Heading 1

This is a simple test paragraph.

## Test Heading 2

This is another paragraph with **bold text** and *italic text*.

### Test Heading 3

Here's a list:
- Item 1
- Item 2
- Item 3

And a numbered list:
1. First item
2. Second item
3. Third item

> This is a blockquote

Here's some \`inline code\` and a code block:

\`\`\`
console.log("Hello World");
\`\`\`

[This is a link](https://example.com)

---

That's the end of the test.`,
        coverImage: "/images/category_banner_science_01.png",
        categoryId: category.id,
        authorId: adminUser.id,
        stemCategory: "SCIENCE",
        tags: ["test", "markdown", "simple"],
        isPublished: true,
        publishedAt: new Date(),
        readingTime: 2,
        metadata: {
          language: "en",
          metaTitle: "Test Blog Post - Simple Markdown",
          metaDescription:
            "A simple test blog post to check markdown rendering.",
          keywords: ["test", "markdown", "simple"],
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Test blog post created successfully",
      blog: testBlog,
      url: `/blog/post/test-blog-simple-markdown`,
    });
  } catch (error: any) {
    console.error("Error creating test blog post:", error);
    return NextResponse.json(
      {
        error: "Failed to create test blog post",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
