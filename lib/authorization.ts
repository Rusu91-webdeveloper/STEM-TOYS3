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
 * Checks if the user is a supplier
 * @param session The current user session
 * @returns True if the user is a supplier, false otherwise
 */
export function isSupplier(session: Session | null): boolean {
  return isAuthorized(session, "SUPPLIER");
}

/**
 * Checks if the user is an approved supplier
 * @param session The current user session
 * @returns True if the user is an approved supplier, false otherwise
 */
export async function isApprovedSupplier(
  session: Session | null
): Promise<boolean> {
  if (!isSupplier(session)) {
    return false;
  }

  try {
    const { db } = await import("@/lib/db");
    const supplier = await db.supplier.findUnique({
      where: { userId: session!.user.id },
      select: { status: true },
    });

    return supplier?.status === "APPROVED";
  } catch (error) {
    console.error("Error checking supplier approval status:", error);
    return false;
  }
}

/**
 * Middleware to verify supplier role for API routes
 * @param handler The handler function to execute if authorized
 * @returns A function that can be used as a route handler
 */
export function withSupplierAuth<T>(
  handler: (
    request: NextRequest,
    session: Session,
    ...args: any[]
  ) => Promise<T>
) {
  return async (
    request: NextRequest,
    ...args: any[]
  ): Promise<T | NextResponse> => {
    try {
      // Check authentication
      let session;
      try {
        session = await auth();
      } catch (authError) {
        // Handle auth errors during build time
        if (
          process.env.NODE_ENV === "production" ||
          process.env.NODE_ENV === "development"
        ) {
          logger.warn("Auth error during build time, skipping auth check", {
            error: authError,
          });
          return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
          );
        }
        throw authError;
      }

      if (!session?.user?.id) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      // Check if user has a supplier profile
      try {
        const { db } = await import("@/lib/db");
        const supplier = await db.supplier.findUnique({
          where: { userId: session.user.id },
          select: { id: true, status: true },
        });

        if (!supplier) {
          logger.warn(
            "Unauthorized supplier access attempt - no supplier profile",
            {
              path: request.nextUrl.pathname,
              userId: session.user.id,
            }
          );
          return unauthorizedResponse("Supplier profile required");
        }

        // Execute the handler with the authenticated session
        return await handler(request, session as Session, ...args);
      } catch (dbError) {
        logger.error("Database error in supplier auth middleware", {
          error: dbError,
        });
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    } catch (error) {
      logger.error("Error in supplier auth middleware", { error });
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware to verify approved supplier role for API routes
 * @param handler The handler function to execute if authorized
 * @returns A function that can be used as a route handler
 */
export function withApprovedSupplierAuth<T>(
  handler: (
    request: NextRequest,
    session: Session,
    ...args: any[]
  ) => Promise<T>
) {
  return async (
    request: NextRequest,
    ...args: any[]
  ): Promise<T | NextResponse> => {
    try {
      // Check authentication
      let session;
      try {
        session = await auth();
      } catch (authError) {
        // Handle auth errors during build time
        if (
          process.env.NODE_ENV === "production" ||
          process.env.NODE_ENV === "development"
        ) {
          logger.warn("Auth error during build time, skipping auth check", {
            error: authError,
          });
          return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
          );
        }
        throw authError;
      }

      if (!(await isApprovedSupplier(session))) {
        logger.warn("Unauthorized approved supplier access attempt", {
          path: request.nextUrl.pathname,
          userId: session?.user?.id,
        });
        return unauthorizedResponse("Approved supplier access required");
      }

      // Execute the handler with the authenticated session
      return await handler(request, session as Session, ...args);
    } catch (error) {
      logger.error("Error in approved supplier auth middleware", { error });
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware to verify admin role for API routes
 * @param handler The handler function to execute if authorized
 * @returns A function that can be used as a route handler
 */
export function withAdminAuth<T>(
  handler: (
    request: NextRequest,
    session: Session,
    ...args: any[]
  ) => Promise<T>
) {
  return async (
    request: NextRequest,
    ...args: any[]
  ): Promise<T | NextResponse> => {
    try {
      // Check authentication
      let session;
      try {
        session = await auth();
      } catch (authError) {
        // Handle auth errors during build time
        if (
          process.env.NODE_ENV === "production" ||
          process.env.NODE_ENV === "development"
        ) {
          logger.warn("Auth error during build time, skipping auth check", {
            error: authError,
          });
          return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
          );
        }
        throw authError;
      }

      if (!isAdmin(session)) {
        logger.warn("Unauthorized admin access attempt", {
          path: request.nextUrl.pathname,
          userId: session?.user?.id,
        });
        return unauthorizedResponse("Admin access required");
      }

      // Execute the handler with the authenticated session
      // At this point we know session is not null because isAdmin checks that
      return await handler(request, session as Session, ...args);
    } catch (error) {
      logger.error("Error in admin auth middleware", { error });
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware to verify user authentication for API routes
 * @param handler The handler function to execute if authorized
 * @param requiredRole Optional role requirement
 * @returns A function that can be used as a route handler
 */
export function withAuth<T>(
  handler: (
    request: NextRequest,
    session: Session,
    ...args: any[]
  ) => Promise<T>,
  requiredRole?: string
) {
  return async (
    request: NextRequest,
    ...args: any[]
  ): Promise<T | NextResponse> => {
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
      return await handler(request, session as Session, ...args);
    } catch (error) {
      logger.error("Error in auth middleware", { error });
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}
