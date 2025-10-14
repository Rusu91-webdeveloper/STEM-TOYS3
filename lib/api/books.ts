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

    const response = await fetch(url, {
      // ⚡ E-COMMERCE OPTIMIZED: Books/digital products cached moderately
      next: {
        tags: ["books"],
        revalidate: 180, // 3 minutes cache, cleared on updates
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

    // Ensure we return an array
    if (Array.isArray(data)) {
      return data;
    }

    console.error("[getBooks] Unexpected API response format:", data);
    return [];
  } catch (error) {
    console.error("[getBooks] Error fetching books:", error);
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

    const response = await fetch(url, {
      // ⚡ E-COMMERCE OPTIMIZED: Individual books cached longer (stable data)
      next: {
        tags: [`book-${slug}`, "books"],
        revalidate: 180, // 3 minutes cache, cleared on updates
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
