import { NextRequest } from "next/server";

import { handlers } from "@/lib/auth";

// Get the original NextAuth handlers
const { GET: originalGet, POST: originalPost } = handlers;

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

  // Otherwise, call the original handler
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
};

// Export the handlers
export const POST = rateLimitedPost;
export const GET = originalGet;
