import { handlers } from "@/lib/auth";
import { NextRequest } from "next/server";

// Get the original NextAuth handlers
const { GET: originalGet, POST: originalPost } = handlers;

// Simple in-memory rate limiting store (would use Redis in production)
// Using a module-level variable to persist between requests
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Configure rate limiting
const LOGIN_RATE_LIMIT = 5;
const LOGIN_RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

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

// Create a middleware function that applies rate limiting before NextAuth
const rateLimitedPost = async (req: NextRequest) => {
  const ipAddress =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";

  // Get current time
  const now = Date.now();

  // Get or initialize rate limit entry
  let rateLimit = rateLimitStore.get(ipAddress);

  if (!rateLimit || now > rateLimit.resetTime) {
    // Initialize or reset rate limit
    rateLimit = {
      count: 0,
      resetTime: now + LOGIN_RATE_WINDOW_MS,
    };
  }

  // Increment count
  rateLimit.count += 1;

  // Update store
  rateLimitStore.set(ipAddress, rateLimit);

  // Calculate remaining requests and reset time
  const remaining = Math.max(0, LOGIN_RATE_LIMIT - rateLimit.count);
  const reset = Math.ceil((rateLimit.resetTime - now) / 1000); // in seconds

  // If limit exceeded, return 429 Too Many Requests
  if (rateLimit.count > LOGIN_RATE_LIMIT) {
    return new Response(
      JSON.stringify({
        error: "too_many_requests",
        message: "Too many login attempts, please try again later.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": LOGIN_RATE_LIMIT.toString(),
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
        "X-RateLimit-Limit": LOGIN_RATE_LIMIT.toString(),
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
