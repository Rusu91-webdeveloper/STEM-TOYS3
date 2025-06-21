/**
 * CSRF (Cross-Site Request Forgery) protection middleware and utilities
 * Integrates with the existing CSRF token functions from lib/security.ts
 */

import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { generateCsrfToken, validateCsrfToken } from "@/lib/security";

/**
 * CSRF configuration for different route types
 */
const csrfConfig = {
  // Routes that require CSRF protection
  protectedRoutes: [
    "/api/admin/",
    "/api/account/",
    "/api/cart/",
    "/api/checkout/",
    "/api/contact",
    "/api/newsletter/",
    "/api/reviews",
    "/api/returns/",
  ],

  // Routes that are exempt from CSRF protection
  exemptRoutes: [
    "/api/auth/", // NextAuth handles its own CSRF
    "/api/health",
    "/api/products", // GET requests for public data
    "/api/categories", // GET requests for public data
    "/api/blog", // GET requests for public data
    "/api/books", // GET requests for public data
  ],

  // Methods that require CSRF protection
  protectedMethods: ["POST", "PUT", "PATCH", "DELETE"],

  // Headers where CSRF token can be provided
  tokenHeaders: ["x-csrf-token", "x-xsrf-token", "csrf-token"],
};

/**
 * Extract session ID from NextAuth token or fallback methods
 */
async function getSessionId(request: NextRequest): Promise<string | null> {
  try {
    // Try to get NextAuth session token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (token?.id) {
      return token.id as string;
    }

    // Fallback: check for session cookies
    const sessionCookie =
      request.cookies.get("next-auth.session-token")?.value ||
      request.cookies.get("__Secure-next-auth.session-token")?.value;

    if (sessionCookie) {
      // Use first 32 characters of session cookie as ID
      return sessionCookie.substring(0, 32);
    }

    // Guest session fallback
    const guestId = request.cookies.get("guest_id")?.value;
    if (guestId) {
      return `guest:${guestId}`;
    }

    return null;
  } catch (error) {
    console.error("Error extracting session ID for CSRF:", error);
    return null;
  }
}

/**
 * Extract CSRF token from request headers or body
 */
function extractCsrfToken(request: NextRequest, body?: any): string | null {
  // Check headers first
  for (const header of csrfConfig.tokenHeaders) {
    const token = request.headers.get(header);
    if (token) return token;
  }

  // Check body if provided (for form submissions)
  if (body && typeof body === "object") {
    return body.csrfToken || body._csrf || body.__csrf || null;
  }

  return null;
}

/**
 * Check if a route requires CSRF protection
 */
function requiresCsrfProtection(pathname: string, method: string): boolean {
  // Only protect specified HTTP methods
  if (!csrfConfig.protectedMethods.includes(method)) {
    return false;
  }

  // Check if route is explicitly exempt
  const isExempt = csrfConfig.exemptRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isExempt) {
    return false;
  }

  // Check if route is explicitly protected
  const isProtected = csrfConfig.protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  return isProtected;
}

/**
 * Validate CSRF token for a request
 */
export async function validateCsrfForRequest(
  request: NextRequest,
  body?: any
): Promise<{
  valid: boolean;
  error?: string;
  sessionId?: string;
}> {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Check if CSRF protection is required
  if (!requiresCsrfProtection(pathname, method)) {
    return { valid: true };
  }

  // Get session ID
  const sessionId = await getSessionId(request);
  if (!sessionId) {
    return {
      valid: false,
      error: "No valid session found for CSRF validation",
    };
  }

  // Extract CSRF token
  const csrfToken = extractCsrfToken(request, body);
  if (!csrfToken) {
    return {
      valid: false,
      error: "CSRF token missing from request",
      sessionId,
    };
  }

  // Validate token
  const isValid = validateCsrfToken(csrfToken, sessionId);

  return {
    valid: isValid,
    error: isValid ? undefined : "Invalid or expired CSRF token",
    sessionId,
  };
}

/**
 * Generate CSRF token for current session
 */
export async function generateCsrfForSession(
  request: NextRequest,
  expirationMinutes: number = 60
): Promise<{
  token: string | null;
  sessionId: string | null;
}> {
  const sessionId = await getSessionId(request);

  if (!sessionId) {
    return { token: null, sessionId: null };
  }

  const token = generateCsrfToken(sessionId, expirationMinutes);

  return { token, sessionId };
}

/**
 * CSRF middleware for API routes
 * Usage: Add this to your API route handlers
 */
export async function withCsrfProtection<T>(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<T>,
  options?: {
    validateBody?: boolean;
    customBodyParser?: (request: NextRequest) => Promise<any>;
  }
): Promise<T | Response> {
  try {
    let body;

    // Parse body if needed for CSRF validation
    if (options?.validateBody || request.method !== "GET") {
      if (options?.customBodyParser) {
        body = await options.customBodyParser(request);
      } else {
        // Try to parse JSON body
        try {
          const text = await request.text();
          if (text) {
            body = JSON.parse(text);
          }
        } catch (e) {
          // If body parsing fails, continue without body validation
          body = null;
        }
      }
    }

    // Validate CSRF
    const csrfResult = await validateCsrfForRequest(request, body);

    if (!csrfResult.valid) {
      return new Response(
        JSON.stringify({
          error: "CSRF validation failed",
          message: csrfResult.error,
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Continue with the handler
    return await handler(request);
  } catch (error) {
    console.error("CSRF middleware error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "CSRF validation encountered an error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

/**
 * Create CSRF token API endpoint
 * Use this to generate tokens for frontend forms
 */
export async function createCsrfTokenResponse(
  request: NextRequest
): Promise<Response> {
  const { token, sessionId } = await generateCsrfForSession(request);

  if (!token || !sessionId) {
    return new Response(
      JSON.stringify({
        error: "Unable to generate CSRF token",
        message: "No valid session found",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  return new Response(
    JSON.stringify({
      csrfToken: token,
      sessionId: sessionId,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

/**
 * React hook for CSRF token management
 * Note: This is a utility that can be used in client components
 */
export const csrfTokenHelpers = {
  /**
   * Fetch CSRF token from the API
   */
  async fetchCsrfToken(): Promise<string | null> {
    try {
      const response = await fetch("/api/csrf-token", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        return data.csrfToken;
      }

      return null;
    } catch (error) {
      console.error("Failed to fetch CSRF token:", error);
      return null;
    }
  },

  /**
   * Add CSRF token to form data
   */
  addTokenToFormData(formData: FormData, token: string): FormData {
    formData.append("csrfToken", token);
    return formData;
  },

  /**
   * Add CSRF token to request headers
   */
  addTokenToHeaders(
    headers: Record<string, string>,
    token: string
  ): Record<string, string> {
    return {
      ...headers,
      "X-CSRF-Token": token,
    };
  },
};

export { csrfConfig };
