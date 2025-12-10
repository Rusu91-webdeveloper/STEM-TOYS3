/**
 * Smart Cache Invalidation System
 * 
 * This module provides functions to invalidate ALL cache layers together:
 * 1. Next.js Page Cache (ISR)
 * 2. Next.js Data Cache (fetch cache)
 * 3. Redis/Application Cache
 * 
 * Use these functions when creating/updating products, blogs, or other content
 * to ensure users see fresh data immediately.
 */

import { revalidatePath, revalidateTag } from "next/cache";
import { invalidateCachePattern } from "./cache";

/**
 * Invalidate all caches for products
 * Call this when:
 * - Creating a new product
 * - Updating an existing product
 * - Approving/rejecting a product
 * - Changing product status
 */
export async function invalidateProductCaches(options?: {
  productId?: string;
  categoryId?: string;
  reason?: string;
}): Promise<void> {
  const startTime = Date.now();
  
  try {
    console.log("🔄 Starting product cache invalidation...", options?.reason || "manual");

    // 1️⃣ Invalidate Redis/Application Cache
    await Promise.all([
      invalidateCachePattern("products*"),        // All product lists
      invalidateCachePattern("product:*"),        // Individual products
      invalidateCachePattern("featured_products*"), // Featured products
      invalidateCachePattern("homepage*"),        // Homepage cache
      ...(options?.categoryId ? [invalidateCachePattern(`category:${options.categoryId}*`)] : []),
    ]);

    // 2️⃣ Invalidate Next.js Data Cache (fetch cache)
    revalidateTag("products");
    revalidateTag("categories");
    if (options?.productId) {
      revalidateTag(`product-${options.productId}`);
    }

    // 3️⃣ Invalidate Next.js Page Cache (ISR)
    revalidatePath("/products", "page");
    revalidatePath("/", "page"); // Homepage
    revalidatePath("/products/[slug]", "page"); // Product detail pages

    const duration = Date.now() - startTime;
    console.log(`✅ Product caches invalidated successfully in ${duration}ms`);
    
    return;
  } catch (error) {
    console.error("❌ Error invalidating product caches:", error);
    // Don't throw - cache invalidation failure shouldn't break the operation
  }
}

/**
 * Invalidate all caches for blogs
 * Call this when:
 * - Creating a new blog post
 * - Updating an existing blog post
 * - Publishing/unpublishing a blog post
 */
export async function invalidateBlogCaches(options?: {
  postId?: string;
  reason?: string;
}): Promise<void> {
  const startTime = Date.now();
  
  try {
    console.log("🔄 Starting blog cache invalidation...", options?.reason || "manual");

    // 1️⃣ Invalidate Redis/Application Cache
    await Promise.all([
      invalidateCachePattern("blog*"),
      invalidateCachePattern("post:*"),
      invalidateCachePattern("homepage*"),
    ]);

    // 2️⃣ Invalidate Next.js Data Cache
    revalidateTag("blog");
    revalidateTag("posts");
    if (options?.postId) {
      revalidateTag(`post-${options.postId}`);
    }

    // 3️⃣ Invalidate Next.js Page Cache
    revalidatePath("/blog", "page");
    revalidatePath("/blog/[slug]", "page");
    revalidatePath("/", "page"); // Homepage might show recent posts

    const duration = Date.now() - startTime;
    console.log(`✅ Blog caches invalidated successfully in ${duration}ms`);
    
    return;
  } catch (error) {
    console.error("❌ Error invalidating blog caches:", error);
  }
}

/**
 * Invalidate all caches for books (digital products)
 * Call this when:
 * - Creating/updating/deleting a book
 * - Uploading/removing book digital files
 */
export async function invalidateBookCaches(options?: {
  bookId?: string;
  bookSlug?: string;
  reason?: string;
}): Promise<void> {
  const startTime = Date.now();

  try {
    console.log("🔄 Starting book cache invalidation...", options?.reason || "manual");

    // 1️⃣ Invalidate Redis/Application Cache
    await Promise.all([
      invalidateCachePattern("books*"),
      invalidateCachePattern("book:*"),
      invalidateCachePattern("products*"), // Books are surfaced on /products
    ]);

    // 2️⃣ Invalidate Next.js Data Cache
    revalidateTag("books");
    revalidateTag("products");
    if (options?.bookId) {
      revalidateTag(`book-${options.bookId}`);
    }
    if (options?.bookSlug) {
      revalidateTag(`book-${options.bookSlug}`);
    }

    // 3️⃣ Invalidate relevant pages
    revalidatePath("/products", "page");
    revalidatePath("/", "page");

    const duration = Date.now() - startTime;
    console.log(`✅ Book caches invalidated successfully in ${duration}ms`);
  } catch (error) {
    console.error("❌ Error invalidating book caches:", error);
  }
}

/**
 * Invalidate all caches for categories
 * Call this when:
 * - Creating a new category
 * - Updating category details
 * - Reordering categories
 */
export async function invalidateCategoryCaches(options?: {
  categoryId?: string;
  reason?: string;
}): Promise<void> {
  const startTime = Date.now();
  
  try {
    console.log("🔄 Starting category cache invalidation...", options?.reason || "manual");

    // 1️⃣ Invalidate Redis/Application Cache
    await Promise.all([
      invalidateCachePattern("category*"),
      invalidateCachePattern("categories*"),
      invalidateCachePattern("products*"), // Products are grouped by category
    ]);

    // 2️⃣ Invalidate Next.js Data Cache
    revalidateTag("categories");
    revalidateTag("products");
    if (options?.categoryId) {
      revalidateTag(`category-${options.categoryId}`);
    }

    // 3️⃣ Invalidate Next.js Page Cache
    revalidatePath("/categories", "page");
    revalidatePath("/products", "page");
    revalidatePath("/", "page");

    const duration = Date.now() - startTime;
    console.log(`✅ Category caches invalidated successfully in ${duration}ms`);
    
    return;
  } catch (error) {
    console.error("❌ Error invalidating category caches:", error);
  }
}

/**
 * Nuclear option - invalidate EVERYTHING
 * Use sparingly, only when:
 * - Major data migration
 * - Bulk operations (importing many products)
 * - Cache corruption suspected
 * - Manual intervention needed
 */
export async function invalidateAllCaches(reason = "manual"): Promise<void> {
  const startTime = Date.now();
  
  try {
    console.log("🔥 Starting FULL cache invalidation...", reason);

    // 1️⃣ Clear ALL Redis cache
    await Promise.all([
      invalidateCachePattern("*"), // Everything
    ]);

    // 2️⃣ Invalidate all common Next.js Data Cache tags
    const tags = [
      "products", "product", "categories", "category",
      "blog", "posts", "books", "featured"
    ];
    tags.forEach(tag => revalidateTag(tag));

    // 3️⃣ Invalidate all main pages
    const paths = [
      "/",
      "/products",
      "/blog",
      "/categories",
    ];
    paths.forEach(path => revalidatePath(path, "page"));

    const duration = Date.now() - startTime;
    console.log(`✅ ALL caches invalidated successfully in ${duration}ms`);
    
    return;
  } catch (error) {
    console.error("❌ Error invalidating all caches:", error);
  }
}

/**
 * Get cache invalidation statistics
 */
export function getCacheInvalidationStats() {
  return {
    timestamp: new Date().toISOString(),
    message: "Cache invalidation system active",
  };
}
