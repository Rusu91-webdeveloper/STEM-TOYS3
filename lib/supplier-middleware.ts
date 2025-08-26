import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCurrentSupplier } from "@/lib/supplier-auth";
import { logger } from "@/lib/logger";

/**
 * Middleware to protect supplier routes
 * @param request The incoming request
 * @param requireApproved Whether to require approved status (default: true)
 * @returns NextResponse or null to continue
 */
export async function protectSupplierRoute(
  request: NextRequest,
  requireApproved: boolean = true
): Promise<NextResponse | null> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      logger.warn("Unauthenticated access attempt to supplier route", {
        path: request.nextUrl.pathname,
      });
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // Check if user has supplier role
    if (session.user.role !== "SUPPLIER") {
      logger.warn("Non-supplier access attempt to supplier route", {
        path: request.nextUrl.pathname,
        userId: session.user.id,
        role: session.user.role,
      });
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Get supplier profile
    const supplier = await getCurrentSupplier(session);
    
    if (!supplier) {
      logger.warn("Supplier profile not found", {
        path: request.nextUrl.pathname,
        userId: session.user.id,
      });
      return NextResponse.redirect(new URL("/supplier/register", request.url));
    }

    // Check approval status if required
    if (requireApproved && supplier.status !== "APPROVED") {
      logger.warn("Non-approved supplier access attempt", {
        path: request.nextUrl.pathname,
        userId: session.user.id,
        status: supplier.status,
      });
      
      // Redirect based on status
      switch (supplier.status) {
        case "PENDING":
          return NextResponse.redirect(new URL("/supplier/pending", request.url));
        case "REJECTED":
          return NextResponse.redirect(new URL("/supplier/rejected", request.url));
        case "SUSPENDED":
          return NextResponse.redirect(new URL("/supplier/suspended", request.url));
        default:
          return NextResponse.redirect(new URL("/supplier/status", request.url));
      }
    }

    // All checks passed, continue
    return null;
  } catch (error) {
    logger.error("Error in supplier route protection:", error);
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}

/**
 * Middleware to protect admin supplier management routes
 * @param request The incoming request
 * @returns NextResponse or null to continue
 */
export async function protectAdminSupplierRoute(
  request: NextRequest
): Promise<NextResponse | null> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      logger.warn("Unauthenticated access attempt to admin supplier route", {
        path: request.nextUrl.pathname,
      });
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // Check if user has admin role
    if (session.user.role !== "ADMIN") {
      logger.warn("Non-admin access attempt to admin supplier route", {
        path: request.nextUrl.pathname,
        userId: session.user.id,
        role: session.user.role,
      });
      return NextResponse.redirect(new URL("/", request.url));
    }

    // All checks passed, continue
    return null;
  } catch (error) {
    logger.error("Error in admin supplier route protection:", error);
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}

/**
 * Middleware to check supplier registration status
 * @param request The incoming request
 * @returns NextResponse or null to continue
 */
export async function checkSupplierRegistration(
  request: NextRequest
): Promise<NextResponse | null> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      // Not authenticated, allow access to registration page
      return null;
    }

    // Check if user has supplier role
    if (session.user.role !== "SUPPLIER") {
      // Not a supplier, allow access to registration page
      return null;
    }

    // Get supplier profile
    const supplier = await getCurrentSupplier(session);
    
    if (supplier) {
      // Supplier already exists, redirect to dashboard
      logger.info("Supplier already registered, redirecting to dashboard", {
        userId: session.user.id,
        supplierId: supplier.id,
      });
      return NextResponse.redirect(new URL("/supplier/dashboard", request.url));
    }

    // No supplier profile, allow access to registration
    return null;
  } catch (error) {
    logger.error("Error checking supplier registration:", error);
    // On error, allow access to registration page
    return null;
  }
}

/**
 * Middleware to handle supplier status-based redirects
 * @param request The incoming request
 * @returns NextResponse or null to continue
 */
export async function handleSupplierStatusRedirect(
  request: NextRequest
): Promise<NextResponse | null> {
  try {
    const session = await auth();
    
    if (!session?.user?.id || session.user.role !== "SUPPLIER") {
      return null;
    }

    const supplier = await getCurrentSupplier(session);
    
    if (!supplier) {
      return null;
    }

    const pathname = request.nextUrl.pathname;

    // If accessing dashboard but not approved, redirect based on status
    if (pathname === "/supplier/dashboard" && supplier.status !== "APPROVED") {
      switch (supplier.status) {
        case "PENDING":
          return NextResponse.redirect(new URL("/supplier/pending", request.url));
        case "REJECTED":
          return NextResponse.redirect(new URL("/supplier/rejected", request.url));
        case "SUSPENDED":
          return NextResponse.redirect(new URL("/supplier/suspended", request.url));
      }
    }

    // If accessing status pages but approved, redirect to dashboard
    if (supplier.status === "APPROVED" && 
        (pathname === "/supplier/pending" || 
         pathname === "/supplier/rejected" || 
         pathname === "/supplier/suspended")) {
      return NextResponse.redirect(new URL("/supplier/dashboard", request.url));
    }

    return null;
  } catch (error) {
    logger.error("Error handling supplier status redirect:", error);
    return null;
  }
}
