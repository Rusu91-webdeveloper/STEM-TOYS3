import crypto from "crypto";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { handlePreflight, applyCors } from "@/lib/cors";
import { validateCsrfForRequest } from "@/lib/csrf";
import { applyRateLimit } from "@/lib/rate-limit";
import { securityHeaders, isDevelopment } from "@/lib/security";

// Supported locales
const locales = ["en", "ro"];
const defaultLocale = "en"; // Changed from "ro" to "en" as default until we have translated content

// Define a name for our redirect tracking cookie
const REDIRECT_COOKIE = "next-redirect-count";

/**
 * Helper function to add cache control headers for static assets
 */
function addCacheHeaders(
  response: NextResponse,
  pathname: string
): NextResponse {
  // Define cache durations based on file types
  const SHORT_CACHE = "public, s-maxage=60, stale-while-revalidate=300"; // 1 minute cache, 5 minute revalidate
  const MEDIUM_CACHE = "public, s-maxage=3600, stale-while-revalidate=86400"; // 1 hour cache, 1 day revalidate
  const LONG_CACHE = "public, s-maxage=86400, stale-while-revalidate=604800"; // 1 day cache, 7 day revalidate
  const VERY_LONG_CACHE = "public, s-maxage=31536000, immutable"; // 1 year cache, immutable

  // Static assets patterns
  const isStaticImage = /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(pathname);
  const isStaticFont = /\.(woff|woff2|eot|ttf|otf)$/i.test(pathname);
  const isStaticDocument = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i.test(
    pathname
  );
  const isStaticMedia = /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/i.test(pathname);

  // Check if the file is in static dirs
  const isInPublicDir =
    pathname.startsWith("/public/") || pathname.startsWith("/_next/static/");
  const isNextImage = pathname.startsWith("/_next/image");
  const isNextFont = pathname.startsWith("/_next/static/media");

  // Apply appropriate caching based on file type and location
  if (isNextImage) {
    response.headers.set("Cache-Control", MEDIUM_CACHE);
  } else if (isNextFont || isStaticFont) {
    response.headers.set("Cache-Control", VERY_LONG_CACHE);
  } else if (isStaticImage) {
    response.headers.set("Cache-Control", LONG_CACHE);
  } else if (isStaticDocument || isStaticMedia) {
    response.headers.set("Cache-Control", MEDIUM_CACHE);
  } else if (isInPublicDir) {
    response.headers.set("Cache-Control", MEDIUM_CACHE);
  }

  return response;
}

/**
 * Next.js Middleware for applying security headers, authentication checks,
 * and other global request/response modifications.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for static asset cache rules first for better performance
  if (
    /\._next\/|\/public\//i.test(pathname) ||
    /\.(jpg|jpeg|png|gif|webp|avif|svg|woff|woff2|ttf|pdf|css|js)$/i.test(
      pathname
    )
  ) {
    const response = NextResponse.next();
    return addCacheHeaders(response, pathname);
  }

  // Handle CORS preflight requests early
  const preflightResponse = handlePreflight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  // Apply rate limiting for API routes and sensitive endpoints
  const rateLimitResult = await applyRateLimit(request, pathname);
  if (!rateLimitResult.success) {
    // Rate limit exceeded - return the rate limit response
    // Don't log for session endpoint since it has its own rate limiter
    if (!pathname.includes("/api/auth/session")) {
      console.log(`Rate limit exceeded for ${pathname}`);
    }
    return rateLimitResult.response!;
  }

  // Apply CSRF protection for API routes with state-changing methods
  // But skip routes that handle CSRF validation internally
  const skipCSRFMiddleware = [
    "/api/checkout/order", // Handles CSRF internally
    "/api/auth/", // NextAuth handles its own CSRF
    "/api/stripe/", // Stripe webhooks
  ];

  const shouldApplyCSRF =
    pathname.startsWith("/api/") &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(request.method) &&
    !skipCSRFMiddleware.some(route => pathname.startsWith(route));

  if (shouldApplyCSRF) {
    const csrfResult = await validateCsrfForRequest(request);
    if (!csrfResult.valid) {
      console.log(
        `CSRF validation failed for ${pathname}: ${csrfResult.error}`
      );
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
  }

  // **PERFORMANCE OPTIMIZATION**: Skip expensive session validation for non-critical routes
  const skipValidationRoutes = [
    "/",
    "/products",
    "/categories",
    "/blog",
    "/about",
    "/contact",
    "/terms",
    "/privacy",
    "/warranty",
    "/returns",
    "/api/products",
    "/api/books",
    "/api/categories",
    "/api/blog",
    "/api/health",
    "/api/comments",
    "/api/reviews",
  ];

  // Only validate sessions for critical protected routes
  const requiresValidation =
    pathname.startsWith("/account") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/supplier");

  // **PERFORMANCE**: Early exit for routes that don't need validation
  if (
    !requiresValidation &&
    skipValidationRoutes.some(route => pathname.startsWith(route))
  ) {
    console.log(`Path: ${pathname}, Auth Status: Skipped (Public Route)`);
    return NextResponse.next();
  }

  // Check for authentication by looking for auth cookies
  // We need to check all possible cookie names used by Next Auth
  const authCookies = [
    request.cookies.get("next-auth.session-token")?.value,
    request.cookies.get("__Secure-next-auth.session-token")?.value,
    // Development cookie name
    request.cookies.get("next-auth.session-token.0")?.value,
    request.cookies.get("__Host-next-auth.csrf-token")?.value,
  ];

  // Also check for guest sessions to support guest checkout
  const guestCookie = request.cookies.get("guest_id")?.value;

  // Consider the user authenticated if ANY auth cookie exists
  const isAuthenticated = authCookies.some(cookie => !!cookie);

  // Check for a special header that might be set by client-side code
  const clientAuthHeader = request.headers.get("x-auth-token");
  const isClientAuthenticated = !!clientAuthHeader;

  // Final auth state combines both checks
  const isUserAuthenticated = isAuthenticated || isClientAuthenticated;

  // **PERFORMANCE**: Reduced logging for non-critical paths
  if (requiresValidation) {
    console.log(
      `Path: ${pathname}, Auth Status: ${isUserAuthenticated ? "Authenticated" : "Not Authenticated"}`
    );
    if (isUserAuthenticated) {
      console.log(
        `Auth Cookie Present: ${isAuthenticated ? "Yes" : "No"}, Client Auth: ${isClientAuthenticated ? "Yes" : "No"}`
      );
    }
  }

  // Handle auth redirects
  if (pathname === "/auth/signin") {
    if (isUserAuthenticated) {
      // If already logged in, redirect to home page
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
  if (pathname === "/auth/signup") {
    if (isUserAuthenticated) {
      // If already logged in, redirect to home page
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.redirect(new URL("/auth/register", request.url));
  }

  // Protect checkout routes - ONLY if user is not authenticated
  if (pathname.startsWith("/checkout")) {
    // First check if URL contains our special auth parameter
    const hasAuthParam = request.nextUrl.searchParams.has("_auth");

    // Check for a special header from client-side navigation
    const isClientNav = request.headers.get("x-client-navigation") === "true";

    // Skip auth check for special browsers or crawlers that may not handle redirects well
    const userAgent = request.headers.get("user-agent") || "";
    const isSpecialClient =
      userAgent.includes("Googlebot") ||
      userAgent.includes("Headless") ||
      userAgent.includes("Puppeteer");

    // If URL has our special auth parameter, treat as authenticated
    if (isUserAuthenticated || isSpecialClient || hasAuthParam) {
      console.log(
        `User is authenticated or has auth param, allowing access to ${pathname}`
      );

      // Continue with the request if authenticated
      const response = NextResponse.next();

      // Clean up by removing the auth parameter if present
      if (hasAuthParam) {
        // Clone the URL
        const url = new URL(request.nextUrl);
        // Remove the auth parameter
        url.searchParams.delete("_auth");
        // Rewrite the URL while allowing access
        response.headers.set("x-middleware-rewrite", url.toString());
      }

      return response;
    }
    // Check if coming directly from a checkout button click in cart
    const referer = request.headers.get("referer") || "";
    const isComingFromCart = referer.includes("/cart");

    // If this is a client navigation or coming from cart, allow it
    // The client-side code will handle the redirect
    if (isClientNav || isComingFromCart) {
      console.log(
        `Client-side navigation to checkout, bypassing middleware redirect`
      );
      return NextResponse.next();
    }

    // Check for potential redirect loops using our cookie
    const redirectCount = parseInt(
      request.cookies.get(REDIRECT_COOKIE)?.value || "0"
    );

    // Don't redirect if:
    // 1. Coming from login page
    // 2. Coming from the same page (likely a language/currency change)
    // 3. We've already redirected too many times in a short period
    if (
      referer.includes("/auth/login") ||
      referer.split("?")[0] === request.nextUrl.origin + pathname ||
      redirectCount > 2
    ) {
      if (redirectCount > 2) {
        console.log(
          `Detected potential redirect loop (${redirectCount} redirects), allowing access`
        );
      } else {
        console.log(
          `Coming from login page or same page, not redirecting again`
        );
      }

      // Create a response that allows access
      const response = NextResponse.next();

      // Reset the redirect counter
      response.cookies.set(REDIRECT_COOKIE, "0", {
        maxAge: 60, // 1 minute expiry
        path: "/",
      });

      return response;
    }
    // Store the original checkout URL in a cookie so we can redirect back after login
    const signInUrl = new URL("/auth/login", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    console.log(
      `Redirecting unauthenticated user to login with callback to ${pathname}`
    );

    // Create the redirect response
    const response = NextResponse.redirect(signInUrl);

    // Increment the redirect counter
    response.cookies.set(REDIRECT_COOKIE, String(redirectCount + 1), {
      maxAge: 60, // 1 minute expiry
      path: "/",
    });

    return response;
  }

  // Handle supplier route protection
  if (pathname.startsWith("/supplier")) {
    try {
      // Import supplier middleware functions
      const { 
        protectSupplierRoute, 
        checkSupplierRegistration, 
        handleSupplierStatusRedirect 
      } = await import("@/lib/supplier-middleware");

      // Handle supplier registration page
      if (pathname === "/supplier/register") {
        const registrationCheck = await checkSupplierRegistration(request);
        if (registrationCheck) return registrationCheck;
      }

      // Handle supplier status pages
      if (pathname.startsWith("/supplier/pending") || 
          pathname.startsWith("/supplier/rejected") || 
          pathname.startsWith("/supplier/suspended")) {
        const statusRedirect = await handleSupplierStatusRedirect(request);
        if (statusRedirect) return statusRedirect;
      }

      // Protect supplier dashboard and other supplier routes
      if (pathname.startsWith("/supplier/dashboard") || 
          pathname.startsWith("/supplier/products") || 
          pathname.startsWith("/supplier/orders") || 
          pathname.startsWith("/supplier/invoices") || 
          pathname.startsWith("/supplier/analytics")) {
        const protection = await protectSupplierRoute(request, true);
        if (protection) return protection;
      }

      // Protect supplier profile and settings (allow pending suppliers)
      if (pathname.startsWith("/supplier/profile") || 
          pathname.startsWith("/supplier/settings")) {
        const protection = await protectSupplierRoute(request, false);
        if (protection) return protection;
      }

    } catch (error) {
      console.error("Error in supplier route protection:", error);
      // On error, redirect to login
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  // Handle admin supplier management route protection
  if (pathname.startsWith("/admin/suppliers")) {
    try {
      const { protectAdminSupplierRoute } = await import("@/lib/supplier-middleware");
      const protection = await protectAdminSupplierRoute(request);
      if (protection) return protection;
    } catch (error) {
      console.error("Error in admin supplier route protection:", error);
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  // For now, we'll disable automatic locale redirection until we have the proper i18n setup
  // This will allow the root route to work properly
  /*
  // Handle i18n routing
  const pathnameHasLocale = locales.some(
    (locale: string) =>
      pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    // Redirect if there is no locale
    const locale = defaultLocale;

    // e.g. incoming request is /products
    // The new URL is now /en/products
    return NextResponse.redirect(
      new URL(
        `/${locale}${pathname.startsWith("/") ? "" : "/"}${pathname}`,
        request.url
      )
    );
  }
  */

  // Get the response
  const response = NextResponse.next();

  // Add rate limit headers to response
  Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (value) {
      // Dynamically set CSP for better security
      if (key === "Content-Security-Policy") {
        // Generate a nonce for scripts
        const nonce = crypto.randomBytes(16).toString("base64");
        // Store nonce in request context for use in page templates
        response.headers.set("x-nonce", nonce);
        response.headers.set(key, getContentSecurityPolicy(nonce));
      } else {
        response.headers.set(key, value);
      }
    }
  });

  // Add cache headers for static content
  addCacheHeaders(response, pathname);

  // Apply CORS headers to the response
  const corsResponse = applyCors(request, response);

  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Check if this is a fresh Google auth session
    const isRecentGoogleAuth =
      token?.googleAuthTimestamp &&
      Date.now() - (token.googleAuthTimestamp as number) < 120000; // 2 minute grace period

    // **PERFORMANCE**: Only validate for very critical routes and not too frequently
    const criticalValidationRoutes = ["/account/settings", "/admin"];
    const needsCriticalValidation = criticalValidationRoutes.some(route =>
      pathname.startsWith(route)
    );

    if (token?.id && needsCriticalValidation) {
      // Skip validation for static assets and API routes to avoid unnecessary checks
      if (
        request.nextUrl.pathname.startsWith("/_next") ||
        request.nextUrl.pathname.startsWith("/static") ||
        request.nextUrl.pathname.startsWith("/api/auth/validate-session") ||
        request.nextUrl.pathname.startsWith("/api/auth/clear-session")
      ) {
        return response;
      }

      // **PERFORMANCE**: Cache validation results to avoid repeated calls
      const validationCacheKey = `validation_${token.id}_${Math.floor(Date.now() / 300000)}`; // Cache for 5 minutes

      // Log the auth state to help debugging
      console.log(
        `Path: ${request.nextUrl.pathname}, Auth Status: Authenticated - Validating Critical Route`
      );

      // For critical routes only, validate the user still exists in database
      try {
        // **PERFORMANCE**: Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // Reduced to 2 second timeout

        const validationResponse = await fetch(
          new URL("/api/auth/validate-session", request.url),
          {
            headers: request.headers,
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (validationResponse.ok) {
          const data = await validationResponse.json();
          if (!data.valid) {
            console.log(`Session validation failed: ${data.reason}`);

            // For fresh Google auth that failed validation, show a special error
            if (isRecentGoogleAuth && data.isRecentAuth) {
              console.log(
                "Fresh Google auth detected but validation failed - giving more time"
              );

              // For very fresh sessions (under 15 seconds), give more time
              if (Date.now() - (token.googleAuthTimestamp as number) < 15000) {
                console.log(
                  "Very fresh session, delaying validation to allow propagation"
                );
                return response;
              }

              return NextResponse.redirect(
                new URL(`/auth/login?error=RecentAuthFailed`, request.url)
              );
            }

            // Standard invalid sessions are cleared
            return NextResponse.redirect(
              new URL("/api/auth/clear-session", request.url)
            );
          }
        }
      } catch (error) {
        // **PERFORMANCE**: Don't block on validation errors for better UX
        if (error instanceof Error && error.name === "AbortError") {
          console.error(
            "Session validation timeout - allowing request to proceed"
          );
        } else {
          console.error("Error validating session:", error);
        }
        // Continue to allow the user to proceed
      }
    }

    // If the user is on the login page but already has a valid session
    // redirect them directly to the account page for better UX
    if (
      token?.id &&
      request.nextUrl.pathname === "/auth/login" &&
      !request.nextUrl.search.includes("error=")
    ) {
      console.log(
        `Redirecting authenticated user from login page to account page`
      );
      return NextResponse.redirect(new URL("/account", request.url));
    }
  } catch (error) {
    // Log the error but don't fail the middleware
    console.error("Error checking session token:", error);
  }

  return corsResponse;
}

/**
 * Define routes that the middleware should run on
 */
export const config = {
  matcher: [
    // Match all paths except:
    // - API routes (except auth endpoints which we want to process)
    // - Static files in _next or public folders
    // - Favicon, images, etc.
    "/((?!api/auth/clear-session|api/auth/\\[...nextauth\\]|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    // Explicitly include account and profile routes to ensure they're always checked
    "/account/:path*",
    "/profile/:path*",
  ],
};

/**
 * Generate the Content-Security-Policy header value
 */
function getContentSecurityPolicy(nonce: string) {
  // Check if we're in development mode
  const dev = isDevelopment();

  // Base directives common to both development and production
  const baseDirectives = {
    // Default source restrictions
    "default-src": ["'self'"],

    // Style sources
    "style-src": ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],

    // Font sources
    "font-src": ["'self'", "fonts.gstatic.com", "data:"],

    // Image sources
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "utfs.io",
      "stripe.com",
      "https://stripe.com",
      "placehold.co",
    ],

    // Do not allow object sources
    "object-src": ["'none'"],

    // Base URI restriction
    "base-uri": ["'self'"],

    // Form submission restriction
    "form-action": ["'self'"],

    // Frame embedding restriction
    "frame-ancestors": ["'none'"],
  };

  // Development-specific directives (more permissive)
  if (dev) {
    return Object.entries({
      ...baseDirectives,

      // In development, we need unsafe-eval and unsafe-inline
      "script-src": [
        "'self'",
        "'unsafe-eval'",
        "'unsafe-inline'", // Allow all inline scripts in development
        "js.stripe.com",
        "uploadthing.com",
      ],

      // Broad connection permissions for development
      "connect-src": [
        "'self'",
        "ws:",
        "wss:",
        "localhost:*",
        "127.0.0.1:*",
        "api.stripe.com",
        "uploadthing.com",
        "utfs.io",
        "*",
      ],

      // Frame sources
      "frame-src": ["*"],
    })
      .map(([key, values]) => `${key} ${values.join(" ")}`)
      .join("; ");
  }

  // Production-specific directives (more restrictive)
  return Object.entries({
    ...baseDirectives,

    // In production, use nonces and strict-dynamic with Stripe support
    "script-src": [
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      "https:",
      "'unsafe-inline'", // Fallback for browsers that don't support strict-dynamic
      "js.stripe.com",
      "uploadthing.com",
      "https://js.stripe.com",
      "https://m.stripe.com",
    ],

    // Specific connection permissions for production with Stripe
    "connect-src": [
      "'self'", 
      "api.stripe.com", 
      "uploadthing.com", 
      "utfs.io",
      "https://api.stripe.com",
      "https://m.stripe.com",
      "https://checkout.stripe.com",
    ],

    // Frame sources with Stripe support
    "frame-src": [
      "js.stripe.com",
      "https://js.stripe.com",
      "https://hooks.stripe.com",
      "https://checkout.stripe.com",
    ],

    // Force HTTPS
    "upgrade-insecure-requests": [],
  })
    .map(([key, values]) => {
      // Filter out empty arrays to avoid trailing spaces
      if (values.length === 0) return key;
      return `${key} ${values.join(" ")}`;
    })
    .join("; ");
}
