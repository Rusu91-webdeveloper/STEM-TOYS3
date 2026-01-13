import { NextRequest } from "next/server";

// Create handlers directly to avoid cached fallback handlers
let authHandlers: { GET: Function; POST: Function } | null = null;

const getHandlers = async () => {
  if (!authHandlers) {
    try {
      // Force fresh creation of auth instance
      const { createAuth } = await import("@/lib/auth-wrapper");
      const { authOptions } = await import("@/lib/server/auth");

      console.log("Creating fresh auth instance for handlers...");
      const authInstance = createAuth(authOptions);
      
      // Validate handlers exist
      if (!authInstance?.handlers) {
        throw new Error("Auth instance created but handlers are missing");
      }
      
      authHandlers = authInstance.handlers;
      console.log("Fresh auth handlers created successfully");
    } catch (error) {
      console.error("Failed to create fresh auth handlers:", error);
      
      // Return fallback handlers instead of throwing
      // This prevents ClientFetchError from crashing the app
      authHandlers = {
        GET: (req: NextRequest) => {
          console.warn("[Auth Fallback] Using fallback GET handler");
          return new Response(
            JSON.stringify({
              error: "ClientFetchError",
              message: "Auth handlers not initialized",
            }),
            {
              status: 503,
              headers: { "Content-Type": "application/json" },
            }
          );
        },
        POST: (req: NextRequest) => {
          console.warn("[Auth Fallback] Using fallback POST handler");
          return new Response(
            JSON.stringify({
              error: "ClientFetchError",
              message: "Auth handlers not initialized",
            }),
            {
              status: 503,
              headers: { "Content-Type": "application/json" },
            }
          );
        },
      };
    }
  }
  return authHandlers;
};

// Function to get the original NextAuth handlers
const getOriginalHandlers = async () => {
  const handlers = await getHandlers();
  return { GET: handlers.GET, POST: handlers.POST };
};

// Simple in-memory rate limiting store (would use Redis in production)
// Using a module-level variable to persist between requests
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Configure rate limiting - MUCH more reasonable limits
const SIGNIN_RATE_LIMIT = 20; // Increased from 5 to 20
const SIGNIN_RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Operations that should NOT be rate limited
const EXCLUDED_OPERATIONS = [
  "csrf", // CSRF token generation
  "session", // Session checks
  "signout", // Sign out operations
  "providers", // Provider information
  "callback", // OAuth callbacks
];

// Function to determine if a request should be rate limited
function shouldRateLimit(request: NextRequest): boolean {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split("/");

  // Extract the last segment which typically contains the operation
  const operation = pathSegments[pathSegments.length - 1];

  // Don't rate limit excluded operations
  if (EXCLUDED_OPERATIONS.includes(operation)) {
    return false;
  }

  // Only rate limit actual sign-in attempts
  // Look for signin in the path or check if it's a credential submission
  const isSignIn =
    url.pathname.includes("signin") ||
    url.pathname.includes("signIn") ||
    url.searchParams.has("signin") ||
    url.searchParams.has("signIn");

  return isSignIn;
}

// Cleanup function to remove expired rate limit entries
function cleanupRateLimitStore() {
  const now = Date.now();

  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }

  // Run cleanup every minute
  setTimeout(cleanupRateLimitStore, 60 * 1000);
}

// Start the cleanup process
cleanupRateLimitStore();

// Create a middleware function that applies selective rate limiting before NextAuth
const rateLimitedPost = async (req: NextRequest) => {
  const { POST: originalPost } = await getOriginalHandlers();

  // Check if this request should be rate limited
  if (!shouldRateLimit(req)) {
    // Skip rate limiting for excluded operations
    return originalPost(req);
  }

  const ipAddress =
    req.headers.get("x-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    "unknown";

  // Get current time
  const now = Date.now();

  // Get or initialize rate limit entry
  let rateLimit = rateLimitStore.get(ipAddress);

  if (!rateLimit || now > rateLimit.resetTime) {
    // Initialize or reset rate limit
    rateLimit = {
      count: 0,
      resetTime: now + SIGNIN_RATE_WINDOW_MS,
    };
  }

  // Increment count
  rateLimit.count += 1;

  // Update store
  rateLimitStore.set(ipAddress, rateLimit);

  // Calculate remaining requests and reset time
  const remaining = Math.max(0, SIGNIN_RATE_LIMIT - rateLimit.count);
  const reset = Math.ceil((rateLimit.resetTime - now) / 1000); // in seconds

  // If limit exceeded, return 429 Too Many Requests
  if (rateLimit.count > SIGNIN_RATE_LIMIT) {
    return new Response(
      JSON.stringify({
        error: "too_many_requests",
        message: "Too many sign-in attempts, please try again later.",
        retryAfter: reset,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": SIGNIN_RATE_LIMIT.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": reset.toString(),
        },
      }
    );
  }

  // Otherwise, call the original handler with error handling
  try {
    const response = await originalPost(req);

    // If it's a Response object, add rate limit headers
    if (response instanceof Response) {
      // Clone the response to add our headers
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers),
          "X-RateLimit-Limit": SIGNIN_RATE_LIMIT.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      });
    }

    return response;
  } catch (error) {
    console.error("[Auth Route] POST handler error:", error);
    
    // Return a proper error response instead of throwing
    return new Response(
      JSON.stringify({
        error: "ClientFetchError",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": SIGNIN_RATE_LIMIT.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
        },
      }
    );
  }
};

// Create GET handler that gets fresh auth handlers with error handling
const rateLimitedGet = async (req: NextRequest) => {
  try {
    const { GET: originalGet } = await getOriginalHandlers();
    const response = await originalGet(req);
    
    // Ensure we always return a valid Response
    if (!(response instanceof Response)) {
      console.error("[Auth Route] GET handler returned non-Response object");
      return new Response(
        JSON.stringify({ error: "Invalid response from auth handler" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Log OAuth callback requests for debugging
    const url = new URL(req.url);
    if (url.pathname.includes("callback")) {
      console.log("[Auth Route] OAuth callback received:", {
        pathname: url.pathname,
        searchParams: Object.fromEntries(url.searchParams),
      });
    }
    
    return response;
  } catch (error) {
    console.error("[Auth Route] GET handler error:", error);
    
    // For OAuth callbacks, preserve error information in the redirect
    const url = new URL(req.url);
    if (url.pathname.includes("callback")) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      // Redirect to error page with error details
      const errorUrl = new URL("/auth/error", req.url);
      errorUrl.searchParams.set("error", "ClientFetchError");
      errorUrl.searchParams.set("error_description", errorMessage);
      return Response.redirect(errorUrl);
    }
    
    // Return a proper error response instead of throwing
    return new Response(
      JSON.stringify({
        error: "ClientFetchError",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// Export the handlers
export const POST = rateLimitedPost;
export const GET = rateLimitedGet;
