import type { Product } from "@/types/product";

import { logger } from "../logger";

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

    // In server components, we need to ensure absolute URLs
    let url: string;

    if (typeof window !== "undefined") {
      // Browser environment
      url = `${window.location.origin}/api/products/combined/${encodedSlug}`;
    } else {
      // Server environment - use environment variable or default to localhost
      const apiBase =
        process.env.NEXTAUTH_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        (process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : process.env.NODE_ENV === "production"
            ? "https://stem-toys-3.vercel.app"
            : "http://localhost:3000");

      // Make sure we have a complete URL with protocol
      const baseUrl = apiBase.startsWith("http")
        ? apiBase
        : `http://${apiBase}`;

      // Remove trailing slash if present
      const cleanBaseUrl = baseUrl.endsWith("/")
        ? baseUrl.slice(0, -1)
        : baseUrl;

      console.log(`Using API base URL: ${cleanBaseUrl}`);
      url = `${cleanBaseUrl}/api/products/combined/${encodedSlug}`;
    }

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
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";

    const response = await fetch(`${API_BASE_URL}/api/products/${slug}`, {
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

    // In server components, we need to ensure absolute URLs
    let url: string;

    if (typeof window !== "undefined") {
      // Browser environment
      url = `${window.location.origin}/api/products${queryString}`;
    } else {
      // Server environment - use environment variable or default to localhost
      const apiBase =
        process.env.NEXTAUTH_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        (process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : process.env.NODE_ENV === "production"
            ? "https://stem-toys-3.vercel.app"
            : "http://localhost:3000");

      // Make sure we have a complete URL with protocol
      const baseUrl = apiBase.startsWith("http")
        ? apiBase
        : `http://${apiBase}`;

      // Remove trailing slash if present
      const cleanBaseUrl = baseUrl.endsWith("/")
        ? baseUrl.slice(0, -1)
        : baseUrl;

      console.log(`Using API base URL: ${cleanBaseUrl}`);
      url = `${cleanBaseUrl}/api/products${queryString}`;
    }

    console.log(`Fetching products with URL: ${url}`);

    const response = await fetch(url, {
      next: {
        // Use tags for more precise invalidation
        tags: ["products", category ? `category-${category}` : ""],
        revalidate: 60,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `API error (${response.status}): ${response.statusText}`,
        errorText
      );
      throw new Error(
        `Failed to fetch products: ${response.statusText}. Details: ${errorText}`
      );
    }

    const data = await response.json();
    console.log("API response structure:", Object.keys(data));

    // API returns { count, products }, but we need to return just the products array
    if (data.products && Array.isArray(data.products)) {
      console.log(`Retrieved ${data.products.length} products from API`);
      return data.products;
    } else if (Array.isArray(data)) {
      console.log(`Retrieved ${data.length} products from API (array format)`);
      return data;
    } else if (typeof data === "object" && data !== null) {
      // If it's an object but not in the expected format, try to extract any array we can find
      const possibleArrays = Object.values(data).filter(val =>
        Array.isArray(val)
      );
      if (possibleArrays.length > 0) {
        // Use the largest array found (likely the products)
        const productArray = possibleArrays.reduce(
          (prev, current) => (current.length > prev.length ? current : prev),
          []
        );
        console.log(
          `Found product array with ${productArray.length} items in unexpected format`
        );
        return productArray;
      }

      // If we can't find an array, convert the object to an array if it looks like a product
      if ("id" in data && "name" in data) {
        console.log("Found single product object, converting to array");
        return [data];
      }

      console.error("Unexpected API response format (object):", data);
      return [];
    }
    console.error("Unexpected API response format:", data);
    return [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}
