import type { Book } from "@/types/book";

import { buildApiUrl } from "../utils/api-url";

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

    // Use the utility function to build the URL
    const url = buildApiUrl(`/api/books${queryString}`);

    console.log(`[getBooks] Fetching books with URL: ${url}`);
    console.log(`[getBooks] Environment: ${process.env.NODE_ENV}`);
    console.log(`[getBooks] Query: ${queryString}`);

    const response = await fetch(url, {
      next: {
        // Use tags for more precise invalidation
        tags: ["books"],
        revalidate: 60, // Revalidate every minute
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[getBooks] API error (${response.status}): ${response.statusText}`,
        errorText
      );
      throw new Error(`Failed to fetch books: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("[getBooks] API response type:", typeof data);

    // Ensure we return an array
    if (Array.isArray(data)) {
      console.log(`[getBooks] Retrieved ${data.length} books from API`);
      return data;
    }

    console.error("[getBooks] Unexpected API response format:", data);
    return [];
  } catch (error) {
    console.error("[getBooks] Error fetching books:", error);
    console.error("[getBooks] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
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

    // Use the utility function to build the URL
    const url = buildApiUrl(`/api/books?slug=${encodedSlug}`);

    console.log(`[getBook] Fetching book with URL: ${url}`);

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
    console.error("[getBook] Error fetching book:", error);
    return null;
  }
}
