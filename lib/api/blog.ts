/**
 * Blog API module
 * Provides types and functions for blog operations
 */

import { StemCategory } from "@prisma/client";

import { db } from "@/lib/db";

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
  metadata: any;
  // Viral content metrics for Romanian market domination
  viralScore: number | null;
  socialShares: number;
  competitorRank: number | null;
  romanianMarketFit: number | null;
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
 * Get related blog posts for a given post
 */
export async function getRelatedPosts(
  currentPostId: string,
  categoryId?: string,
  tags?: string[],
  stemCategory?: StemCategory,
  limit: number = 4
): Promise<BlogPost[]> {
  const where: any = {
    id: { not: currentPostId }, // Exclude current post
    isPublished: true,
  };

  // Priority 1: Same category
  if (categoryId) {
    where.categoryId = categoryId;
  }

  // Priority 2: Same stem category if no category match
  if (!categoryId && stemCategory) {
    where.stemCategory = stemCategory;
  }

  // Priority 3: Shared tags
  if (tags && tags.length > 0) {
    where.tags = {
      hasSome: tags,
    };
  }

  const relatedPosts = await db.blog.findMany({
    where,
    take: limit,
    orderBy: [
      { publishedAt: "desc" }, // Most recent first
      { socialShares: "desc" }, // Then by social shares
    ],
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

  // If we don't have enough related posts, get more from the same stem category
  if (relatedPosts.length < limit && stemCategory) {
    const additionalPosts = await db.blog.findMany({
      where: {
        id: { not: currentPostId },
        isPublished: true,
        stemCategory: stemCategory,
        categoryId: categoryId ? { not: categoryId } : undefined, // Avoid duplicates
      },
      take: limit - relatedPosts.length,
      orderBy: { publishedAt: "desc" },
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

    relatedPosts.push(...additionalPosts);
  }

  return relatedPosts.slice(0, limit) as BlogPost[];
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
