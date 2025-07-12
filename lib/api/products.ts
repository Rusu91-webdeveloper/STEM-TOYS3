import type { Product } from "@/types/product";

import { logger } from "../logger";
import { buildApiUrl } from "../utils/api-url";

/**
 * Get a combined product or book by slug
 * This will check both products and books tables
 */
export async function getCombinedProduct(
  slug: string
): Promise<Product | null> {
  try {
    // Encode the slug to handle special characters
    const encodedSlug = encodeURIComponent(slug);

    // Use the utility function to build the URL
    const url = buildApiUrl(`/api/products/combined/${encodedSlug}`);
    console.log(`Fetching combined product/book with URL: ${url}`);

    const response = await fetch(url, {
      next: {
        // Use tags for more precise invalidation
        tags: [`product-${slug}`, "products", `book-${slug}`, "books"],
        revalidate: 300, // 🚀 PERFORMANCE: Cache for 5 minutes for better performance
      },
      // 🚀 PERFORMANCE: Add browser cache headers
      cache: "force-cache",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching combined product:", error);
    return null;
  }
}

/**
 * Get a product by slug
 */
export async function getProduct(slug: string): Promise<Product | null> {
  try {
    const url = buildApiUrl(`/api/products/${slug}`);

    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Product not found");
      }
      throw new Error(`Failed to fetch product: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logger.error(`Failed to fetch product with slug: ${slug}`, error);
    throw error;
  }
}

/**
 * Get all products
 */
export async function getProducts(
  options: {
    category?: string;
    sort?: string;
    limit?: number;
  } = {}
): Promise<Product[]> {
  const { category, sort, limit } = options;

  try {
    // Build query string
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (sort) params.append("sort", sort);
    if (limit) params.append("limit", limit.toString());

    const queryString = params.toString() ? `?${params.toString()}` : "";

    // Use the utility function to build the URL
    const url = buildApiUrl(`/api/products${queryString}`);

    console.log(`[getProducts] Fetching products with URL: ${url}`);
    console.log(`[getProducts] Environment: ${process.env.NODE_ENV}`);
    console.log(`[getProducts] Query: ${queryString}`);

    const response = await fetch(url, {
      next: {
        // Use tags for more precise invalidation
        tags: ["products", category ? `category-${category}` : ""].filter(
          Boolean
        ),
        revalidate: 60,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[getProducts] API error (${response.status}): ${response.statusText}`,
        errorText
      );
      throw new Error(
        `Failed to fetch products: ${response.statusText}. Details: ${errorText}`
      );
    }

    const data = await response.json();
    console.log("[getProducts] API response type:", typeof data);
    console.log("[getProducts] API response keys:", Object.keys(data));

    // The API returns { products, pagination, meta } structure
    if (
      data &&
      typeof data === "object" &&
      "products" in data &&
      Array.isArray(data.products)
    ) {
      console.log(
        `[getProducts] Retrieved ${data.products.length} products from API (structured response)`
      );
      return data.products;
    }

    // Fallback: if the response is already an array
    if (Array.isArray(data)) {
      console.log(
        `[getProducts] Retrieved ${data.length} products from API (array response)`
      );
      return data;
    }

    // Fallback: if it's a single product object
    if (data && typeof data === "object" && "id" in data && "name" in data) {
      console.log(
        "[getProducts] Found single product object, converting to array"
      );
      return [data];
    }

    console.error("[getProducts] Unexpected API response format:", data);
    console.error("[getProducts] Response type:", typeof data);
    console.error(
      "[getProducts] Response keys:",
      data ? Object.keys(data) : "null"
    );

    // Return empty array if we can't parse the response
    return [];
  } catch (error) {
    console.error("[getProducts] Error fetching products:", error);
    console.error("[getProducts] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return [];
  }
}
