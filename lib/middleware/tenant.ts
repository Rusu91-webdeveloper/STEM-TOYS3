import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";

/**
 * Interface for tenant context
 */
export interface TenantContext {
  tenantId: string | null;
  tenant: any | null;
  organizationId: string | null;
  organization: any | null;
  isMultiTenant: boolean;
}

/**
 * Extract tenant context from request
 * Supports multiple tenant resolution strategies:
 * 1. Subdomain (tenant.domain.com)
 * 2. Path prefix (/tenant-slug/...)
 * 3. Header (x-tenant-id)
 * 4. Query parameter (?tenant=slug)
 * 5. Cookie (tenant_slug)
 * 6. User session (for authenticated users)
 */
export async function getTenantContext(
  request: NextRequest
): Promise<TenantContext> {
  const { hostname, pathname } = request.nextUrl;
  let tenantId: string | null = null;
  let tenant: any = null;
  let organizationId: string | null = null;
  let organization: any = null;

  // Strategy 1: Subdomain detection
  const subdomain = getSubdomain(hostname);
  if (subdomain && subdomain !== "www") {
    tenant = await db.tenant.findUnique({
      where: { slug: subdomain },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        settings: true,
      },
    });

    if (tenant) {
      tenantId = tenant.id;
    }
  }

  // Strategy 2: Path prefix detection (/tenant-slug/...)
  if (!tenantId) {
    const pathTenant = getPathTenant(pathname);
    if (pathTenant) {
      tenant = await db.tenant.findUnique({
        where: { slug: pathTenant },
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          settings: true,
        },
      });

      if (tenant) {
        tenantId = tenant.id;
      }
    }
  }

  // Strategy 3: Header detection
  if (!tenantId) {
    const headerTenant =
      request.headers.get("x-tenant-id") ||
      request.headers.get("x-tenant-slug");
    if (headerTenant) {
      tenant = await db.tenant.findUnique({
        where:
          headerTenant.length === 24
            ? { id: headerTenant }
            : { slug: headerTenant },
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          settings: true,
        },
      });

      if (tenant) {
        tenantId = tenant.id;
      }
    }
  }

  // Strategy 4: Query parameter detection
  if (!tenantId) {
    const queryTenant = request.nextUrl.searchParams.get("tenant");
    if (queryTenant) {
      tenant = await db.tenant.findUnique({
        where: { slug: queryTenant },
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          settings: true,
        },
      });

      if (tenant) {
        tenantId = tenant.id;
      }
    }
  }

  // Strategy 5: Cookie detection
  if (!tenantId) {
    const cookieTenant = request.cookies.get("tenant_slug")?.value;
    if (cookieTenant) {
      tenant = await db.tenant.findUnique({
        where: { slug: cookieTenant },
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          settings: true,
        },
      });

      if (tenant) {
        tenantId = tenant.id;
      }
    }
  }

  // Strategy 6: User session (for authenticated users)
  if (!tenantId) {
    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (token?.id) {
        const user = await db.user.findUnique({
          where: { id: token.id as string },
          select: { tenantId: true, organizationId: true },
        });

        if (user?.tenantId) {
          tenantId = user.tenantId;
          tenant = await db.tenant.findUnique({
            where: { id: tenantId },
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true,
              settings: true,
            },
          });
        }

        if (user?.organizationId) {
          organizationId = user.organizationId;
          organization = await db.organization.findUnique({
            where: { id: organizationId },
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true,
              settings: true,
            },
          });
        }
      }
    } catch (error) {
      // Ignore auth errors during tenant resolution
      console.warn("Error resolving tenant from user session:", error);
    }
  }

  // Default to first active tenant if none found
  if (!tenantId) {
    tenant = await db.tenant.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        settings: true,
      },
    });

    if (tenant) {
      tenantId = tenant.id;
    }
  }

  return {
    tenantId,
    tenant,
    organizationId,
    organization,
    isMultiTenant: !!tenantId,
  };
}

/**
 * Middleware to enforce tenant isolation
 * Redirects or blocks requests that don't have valid tenant context
 */
export async function withTenantIsolation(
  request: NextRequest,
  tenantContext: TenantContext
): Promise<NextResponse | null> {
  // Skip tenant isolation for public routes
  const publicRoutes = [
    "/api/auth/",
    "/api/health",
    "/api/webhooks",
    "/_next/",
    "/favicon.ico",
    "/public/",
  ];

  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return null; // Continue with request
  }

  // For multi-tenant setup, require tenant context
  if (!tenantContext.tenantId) {
    // Return 400 for API routes, redirect for page routes
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 }
      );
    } else {
      // Redirect to tenant selection or default tenant
      return NextResponse.redirect(new URL("/tenant/select", request.url));
    }
  }

  // Check if tenant is active
  if (tenantContext.tenant && !tenantContext.tenant.isActive) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Tenant is inactive" },
        { status: 403 }
      );
    } else {
      return NextResponse.redirect(new URL("/tenant/inactive", request.url));
    }
  }

  return null; // Continue with request
}

/**
 * Add tenant context to request headers for downstream processing
 */
export function addTenantHeaders(
  request: NextRequest,
  tenantContext: TenantContext
): NextRequest {
  const headers = new Headers(request.headers);

  if (tenantContext.tenantId) {
    headers.set("x-tenant-id", tenantContext.tenantId);
  }

  if (tenantContext.organizationId) {
    headers.set("x-organization-id", tenantContext.organizationId);
  }

  if (tenantContext.tenant?.slug) {
    headers.set("x-tenant-slug", tenantContext.tenant.slug);
  }

  if (tenantContext.organization?.slug) {
    headers.set("x-organization-slug", tenantContext.organization.slug);
  }

  // Create new request with updated headers
  return new NextRequest(request.url, {
    ...request,
    headers,
  });
}

/**
 * Helper function to extract subdomain from hostname
 */
function getSubdomain(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(":")[0];

  // Handle localhost and IP addresses
  if (host === "localhost" || host.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    return null;
  }

  const parts = host.split(".");
  if (parts.length > 2) {
    return parts[0];
  }

  return null;
}

/**
 * Helper function to extract tenant from path
 */
function getPathTenant(pathname: string): string | null {
  const pathParts = pathname.split("/").filter(Boolean);

  // Check if first path segment is a tenant slug
  if (pathParts.length > 0) {
    const firstSegment = pathParts[0];

    // Skip common non-tenant paths
    const skipPaths = [
      "api",
      "auth",
      "admin",
      "account",
      "checkout",
      "products",
      "blog",
    ];
    if (!skipPaths.includes(firstSegment)) {
      return firstSegment;
    }
  }

  return null;
}

/**
 * Validate tenant access for a user
 */
export async function validateTenantAccess(
  userId: string,
  tenantId: string | null
): Promise<boolean> {
  if (!tenantId) return true; // Allow access if no tenant specified

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { tenantId: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return false;
    }

    // If user has a tenant assigned, it must match
    if (user.tenantId && user.tenantId !== tenantId) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error validating tenant access:", error);
    return false;
  }
}
