/**
 * Blog API module
 * Provides types and functions for blog operations
 */

import { db } from "@/lib/db";
import { StemCategory } from "@prisma/client";

/**
 * Blog post type with author and category information
 */
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  categoryId: string;
  authorId: string;
  stemCategory: StemCategory;
  tags: string[];
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  readingTime: number | null;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parentId: string | null;
    image: string | null;
    isActive: boolean;
    metadata: any;
  };
}

/**
 * Get a blog post by its slug
 * Used in blog detail pages
 */
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const blog = await db.blog.findUnique({
    where: {
      slug,
      isPublished: true, // Only return published blogs for public consumption
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      category: true,
    },
  });

  return blog as BlogPost | null;
}

/**
 * Get multiple blog posts with filtering options
 */
export async function getBlogPosts({
  stemCategory,
  categoryId,
  authorId,
  isPublished = true,
  take = 10,
  skip = 0,
}: {
  stemCategory?: StemCategory;
  categoryId?: string;
  authorId?: string;
  isPublished?: boolean;
  take?: number;
  skip?: number;
} = {}): Promise<{
  blogs: BlogPost[];
  count: number;
}> {
  const where: any = {};

  if (stemCategory) {
    where.stemCategory = stemCategory;
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (authorId) {
    where.authorId = authorId;
  }

  if (isPublished !== undefined) {
    where.isPublished = isPublished;
  }

  const [blogs, count] = await Promise.all([
    db.blog.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
      },
      orderBy: { publishedAt: "desc" },
      take,
      skip,
    }),
    db.blog.count({ where }),
  ]);

  return { blogs: blogs as BlogPost[], count };
}

/**
 * Get a blog post by ID (admin use)
 */
export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  const blog = await db.blog.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      category: true,
    },
  });

  return blog as BlogPost | null;
}
