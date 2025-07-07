import { NextRequest, NextResponse } from "next/server";
import { Session } from "next-auth";

import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";

/**
 * Standard response for unauthorized access
 */
export function unauthorizedResponse(message = "Not authorized") {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Verifies that the user is authenticated and has required role
 * @param session The current user session
 * @param requiredRole The role required for access (optional)
 * @returns True if the user is authorized, false otherwise
 */
export function isAuthorized(
  session: Session | null,
  requiredRole?: string
): boolean {
  if (!session?.user) {
    return false;
  }

  // If no specific role is required, any authenticated user is authorized
  if (!requiredRole) {
    return true;
  }

  // Check for required role
  return session.user.role === requiredRole;
}

/**
 * Checks if the user is an admin
 * @param session The current user session
 * @returns True if the user is an admin, false otherwise
 */
export function isAdmin(session: Session | null): boolean {
  return isAuthorized(session, "ADMIN");
}

/**
 * Middleware to verify admin role for API routes
 * @param request The incoming request
 * @param handler The handler function to execute if authorized
 * @returns Response from the handler or 403 error
 */
export async function withAdminAuth<T>(
  request: NextRequest,
  handler: (request: NextRequest, session: Session) => Promise<T>
): Promise<T | NextResponse> {
  try {
    // Check authentication
    const session = await auth();

    if (!isAdmin(session)) {
      logger.warn("Unauthorized admin access attempt", {
        path: request.nextUrl.pathname,
        userId: session?.user?.id,
      });
      return unauthorizedResponse("Admin access required");
    }

    // Execute the handler with the authenticated session
    // At this point we know session is not null because isAdmin checks that
    return await handler(request, session as Session);
  } catch (error) {
    logger.error("Error in admin auth middleware", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Middleware to verify user authentication for API routes
 * @param request The incoming request
 * @param handler The handler function to execute if authorized
 * @param requiredRole Optional role requirement
 * @returns Response from the handler or unauthorized error
 */
export async function withAuth<T>(
  request: NextRequest,
  handler: (request: NextRequest, session: Session) => Promise<T>,
  requiredRole?: string
): Promise<T | NextResponse> {
  try {
    // Check authentication
    const session = await auth();

    if (!isAuthorized(session, requiredRole)) {
      const message = requiredRole
        ? `Role '${requiredRole}' required`
        : "Authentication required";

      logger.warn("Unauthorized access attempt", {
        path: request.nextUrl.pathname,
        userId: session?.user?.id,
        requiredRole,
      });

      return unauthorizedResponse(message);
    }

    // Execute the handler with the authenticated session
    // At this point we know session is not null because isAuthorized checks that
    return await handler(request, session as Session);
  } catch (error) {
    logger.error("Error in auth middleware", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
