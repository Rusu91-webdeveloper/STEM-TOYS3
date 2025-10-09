import { NextRequest, NextResponse } from "next/server";
import { Session } from "next-auth";

/**
 * Check if the user has VISITOR role
 * @param session The current user session
 * @returns True if the user is a visitor, false otherwise
 */
export function isVisitor(session: Session | null): boolean {
  return session?.user?.role === "VISITOR";
}

/**
 * Check if the user role should have read-only access
 * @param session The current user session
 * @returns True if the user should have read-only access
 */
export function isReadOnlyRole(session: Session | null): boolean {
  return isVisitor(session);
}

/**
 * Returns a friendly demo mode read-only error response
 * @param customMessage Optional custom message to include
 * @returns NextResponse with 403 status and friendly error message
 */
export function demoModeResponse(customMessage?: string): NextResponse {
  return NextResponse.json(
    {
      error: "Demo Mode - Read Only Access",
      message:
        customMessage ||
        "This is a demonstration account with read-only access. Write operations are disabled to showcase the platform's features.",
      isDemo: true,
    },
    { status: 403 }
  );
}

/**
 * Middleware wrapper that blocks write operations for VISITOR role
 * Use this to protect mutation endpoints (POST, PUT, PATCH, DELETE)
 * @param handler The handler function to execute if authorized
 * @returns A function that can be used as a route handler
 */
export function withVisitorReadOnly<T>(
  handler: (
    request: NextRequest,
    session: Session,
    ...args: any[]
  ) => Promise<T>
) {
  return async (
    request: NextRequest,
    session: Session,
    ...args: any[]
  ): Promise<T | NextResponse> => {
    // Check if user is a visitor (read-only)
    if (isReadOnlyRole(session)) {
      return demoModeResponse();
    }

    // Execute the handler for non-visitor users
    return await handler(request, session, ...args);
  };
}

/**
 * Check if session has VISITOR role and return error response if so
 * Use this at the start of mutation handlers for quick VISITOR blocking
 * @param session The current user session
 * @returns NextResponse if VISITOR, null otherwise
 */
export function blockVisitorWrite(
  session: Session | null
): NextResponse | null {
  if (isReadOnlyRole(session)) {
    return demoModeResponse();
  }
  return null;
}
