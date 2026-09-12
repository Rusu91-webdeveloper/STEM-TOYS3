import { applyProductContentOverride } from "@/lib/products/catalog-content-overrides";
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

    const response = await fetch(url, {
      // ⚡ E-COMMERCE OPTIMIZED: Individual products cached longer (stable data)
      next: {
        tags: [`product-${slug}`, "products", `book-${slug}`, "books"],
        revalidate: 180, // 3 minutes cache, cleared on product updates
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }

    const product = (await response.json()) as Product;
    return applyProductContentOverride(product);
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

    // Editorial selection first; explicit customer sort choices remain available.
    if (!sort) params.append("sort", "featured");

    // IMPORTANT: Don't set featured=true by default to avoid the optimized query path
    // that might not include all fields
    params.append("featured", "false");

    const queryString = params.toString() ? `?${params.toString()}` : "";

    // Use the utility function to build the URL
    const url = buildApiUrl(`/api/products${queryString}`);

    const response = await fetch(url, {
      // Force fresh data after admin mutations; server-side caching handles perf
      cache: "no-store",
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

    // The API returns { products, pagination, meta } structure
    if (
      data &&
      typeof data === "object" &&
      "products" in data &&
      Array.isArray(data.products)
    ) {
      return data.products;
    }

    // Fallback: if the response is already an array
    if (Array.isArray(data)) {
      return data;
    }

    // Fallback: if it's a single product object
    if (data && typeof data === "object" && "id" in data && "name" in data) {
      return [data];
    }

    console.error("[getProducts] Unexpected API response format:", data);

    // Return empty array if we can't parse the response
    return [];
  } catch (error) {
    console.error("[getProducts] Error fetching products:", error);
    return [];
  }
}
