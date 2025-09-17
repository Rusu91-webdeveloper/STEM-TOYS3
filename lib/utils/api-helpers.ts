/**
 * Utility functions for handling API responses consistently
 * Prevents "Unexpected token DOCTYPE" errors when APIs return HTML instead of JSON
 */

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

/**
 * Safely fetch and parse JSON from an API endpoint
 * Handles non-JSON responses gracefully without throwing parsing errors
 */
export async function safeApiCall<T = any>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, options);

    if (response.ok) {
      // Check if the response is actually JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        return { data, success: true };
      } else {
        // Response is not JSON, likely HTML error page
        return {
          error: `API returned non-JSON response (${response.status})`,
          success: false,
        };
      }
    } else {
      // Non-successful status code
      let errorMessage = `API request failed with status ${response.status}`;

      try {
        // Try to get error message from JSON response
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        }
      } catch {
        // If parsing error response fails, use the default message
      }

      return {
        error: errorMessage,
        success: false,
      };
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Network error",
      success: false,
    };
  }
}

/**
 * Legacy function for backward compatibility
 * Use safeApiCall for new code
 */
export async function fetchJson<T = any>(url: string): Promise<T | null> {
  const result = await safeApiCall<T>(url);
  return result.success ? result.data || null : null;
}
