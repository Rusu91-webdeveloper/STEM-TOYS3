import type { Book } from "@/types/book";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";

/**
 * Get all books
 */
export async function getBooks(
  options: {
    language?: string;
    sort?: string;
    limit?: number;
  } = {}
): Promise<Book[]> {
  const { language, sort, limit } = options;

  try {
    // Build query string
    const params = new URLSearchParams();
    if (language) params.append("language", language);
    if (sort) params.append("sort", sort);
    if (limit) params.append("limit", limit.toString());

    const queryString = params.toString() ? `?${params.toString()}` : "";

    // In server components, we need to ensure absolute URLs
    let url: string;

    if (typeof window !== "undefined") {
      // Browser environment
      url = `${window.location.origin}/api/books${queryString}`;
    } else {
      // Server environment - use environment variable or default to localhost
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXTAUTH_URL ||
        "http://localhost:3000";

      // Make sure we have a complete URL with protocol
      const baseUrl = apiBase.startsWith("http")
        ? apiBase
        : `http://${apiBase}`;

      // Remove trailing slash if present
      const cleanBaseUrl = baseUrl.endsWith("/")
        ? baseUrl.slice(0, -1)
        : baseUrl;

      console.log(`Using API base URL: ${cleanBaseUrl}`);
      url = `${cleanBaseUrl}/api/books${queryString}`;
    }

    console.log(`Fetching books with URL: ${url}`);

    const response = await fetch(url, {
      next: {
        // Use tags for more precise invalidation
        tags: ["books"],
        revalidate: 60, // Revalidate every minute
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch books: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching books:", error);
    return [];
  }
}

/**
 * Get a book by slug
 */
export async function getBook(slug: string): Promise<Book | null> {
  try {
    // Encode the slug to handle special characters
    const encodedSlug = encodeURIComponent(slug);

    // In server components, we need to ensure absolute URLs
    let url: string;

    if (typeof window !== "undefined") {
      // Browser environment
      url = `${window.location.origin}/api/books?slug=${encodedSlug}`;
    } else {
      // Server environment - use environment variable or default to localhost
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXTAUTH_URL ||
        "http://localhost:3000";

      // Make sure we have a complete URL with protocol
      const baseUrl = apiBase.startsWith("http")
        ? apiBase
        : `http://${apiBase}`;

      // Remove trailing slash if present
      const cleanBaseUrl = baseUrl.endsWith("/")
        ? baseUrl.slice(0, -1)
        : baseUrl;

      console.log(`Using API base URL: ${cleanBaseUrl}`);
      url = `${cleanBaseUrl}/api/books?slug=${encodedSlug}`;
    }

    console.log(`Fetching book with URL: ${url}`);

    const response = await fetch(url, {
      next: {
        // Use tags for more precise invalidation
        tags: [`book-${slug}`, "books"],
        revalidate: 3600, // Revalidate every hour
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch book: ${response.statusText}`);
    }

    const books = await response.json();
    return books.length > 0 ? books[0] : null;
  } catch (error) {
    console.error("Error fetching book:", error);
    return null;
  }
}
