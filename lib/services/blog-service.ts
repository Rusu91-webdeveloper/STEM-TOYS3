import { StemCategory } from "@prisma/client";

import { emailTemplates } from "@/lib/brevoTemplates";
import { db } from "@/lib/db";

export interface CreateBlogInput {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  categoryId: string;
  authorId: string;
  stemCategory: StemCategory;
  tags: string[];
  isPublished: boolean;
  publishedAt?: Date;
}

export interface UpdateBlogInput {
  id: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  categoryId?: string;
  stemCategory?: StemCategory;
  tags?: string[];
  isPublished?: boolean;
  publishedAt?: Date;
}

/**
 * Helper function to send blog notifications to newsletter subscribers
 * This is called automatically when a blog is published
 */
async function sendBlogNotification(blogId: string): Promise<void> {
  try {
    console.log(`🔔 Sending blog notification for blog ID: ${blogId}`);

    // Get the blog post with author and category information
    const blog = await db.blog.findUnique({
      where: { id: blogId },
      include: {
        author: {
          select: {
            name: true,
          },
        },
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!blog) {
      console.error(`❌ Blog with ID ${blogId} not found for notification`);
      return;
    }

    if (!blog.isPublished) {
      console.log(
        `⏸️ Blog "${blog.title}" is not published, skipping notification`
      );
      return;
    }

    // Get all active newsletter subscribers
    const subscribers = await db.newsletter.findMany({
      where: {
        isActive: true,
      },
    });

    if (subscribers.length === 0) {
      console.log(`📭 No active newsletter subscribers found`);
      return;
    }

    console.log(
      `📧 Sending notifications to ${subscribers.length} subscribers for blog: "${blog.title}"`
    );

    // Send notification emails to all subscribers
    const emailPromises = subscribers.map(subscriber =>
      emailTemplates.blogNotification({
        to: subscriber.email,
        name: subscriber.firstName || subscriber.email.split("@")[0],
        blog: {
          ...blog,
          author: {
            name: blog.author.name || "TechTots Team",
          },
        },
      })
    );

    await Promise.all(emailPromises);

    console.log(
      `✅ Successfully sent blog notifications to ${subscribers.length} subscribers for: "${blog.title}"`
    );
  } catch (error) {
    console.error(
      `❌ Error sending blog notification for blog ID ${blogId}:`,
      error
    );
    // Don't throw the error so blog creation/update isn't affected
  }
}

export const blogService = {
  /**
   * Create a new blog post
   */
  async createBlog(data: CreateBlogInput) {
    const blog = await db.blog.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        coverImage: data.coverImage,
        categoryId: data.categoryId,
        authorId: data.authorId,
        stemCategory: data.stemCategory,
        tags: data.tags,
        isPublished: data.isPublished,
        publishedAt: data.isPublished ? data.publishedAt || new Date() : null,
      },
    });

    // Send automatic notification if blog is published
    if (data.isPublished) {
      // Don't await this so blog creation isn't delayed
      sendBlogNotification(blog.id).catch(console.error);
    }

    return blog;
  },

  /**
   * Update an existing blog post
   */
  async updateBlog(data: UpdateBlogInput) {
    const { id, ...updateData } = data;

    // Check if blog is being published for the first time
    let wasAlreadyPublished = false;
    let shouldSendNotification = false;

    if (updateData.isPublished) {
      const existingBlog = await db.blog.findUnique({
        where: { id },
        select: { isPublished: true, publishedAt: true },
      });

      if (existingBlog) {
        wasAlreadyPublished = existingBlog.isPublished;
        shouldSendNotification = !wasAlreadyPublished && updateData.isPublished;

        // If publishing for the first time, set publishedAt to now
        if (!existingBlog.publishedAt) {
          updateData.publishedAt = new Date();
        }
      }
    }

    const updatedBlog = await db.blog.update({
      where: { id },
      data: updateData,
    });

    // Send automatic notification if blog is being published for the first time
    if (shouldSendNotification) {
      console.log(
        `📰 Blog "${updatedBlog.title}" is being published for the first time, sending notifications...`
      );
      // Don't await this so blog update isn't delayed
      sendBlogNotification(updatedBlog.id).catch(console.error);
    }

    return updatedBlog;
  },

  /**
   * Delete a blog post
   */
  deleteBlog(id: string) {
    return db.blog.delete({
      where: { id },
    });
  },

  /**
   * Get a blog post by ID
   */
  getBlogById(id: string) {
    return db.blog.findUnique({
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
  },

  /**
   * Get a blog post by slug
   */
  getBlogBySlug(slug: string) {
    return db.blog.findUnique({
      where: { slug },
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
  },

  /**
   * Get all blog posts with optional filtering
   */
  async getAllBlogs({
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
  } = {}) {
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

    return { blogs, count };
  },

  /**
   * Manually send blog notification (for admin use)
   */
  async sendNotification(blogId: string, _categories?: string[]) {
    await sendBlogNotification(blogId);
  },
};
