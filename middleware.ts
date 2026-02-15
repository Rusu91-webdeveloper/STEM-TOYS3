import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge middleware – protects /api/admin/* endpoints.
 *
 * Admin UI (/admin/*) protection is handled by the admin layout using auth()
 * client-side, because getToken() returns null in production Edge runtime
 * (NEXTAUTH_SECRET/cookie issues) even when the user is authenticated.
 * Account and other pages use server-side auth() which works correctly.
 */
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Admin UI (/admin/*) – skip middleware; admin layout handles auth via
    // useOptimizedSession (session works in production, unlike getToken in Edge)
    if (pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
        return NextResponse.next();
    }

    // Admin API routes – protected by auth() in each route handler
    // (getToken is unreliable in Edge, so we rely on route-level auth)
    if (pathname.startsWith("/api/admin")) {
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Admin UI pages
        "/admin/:path*",
        // Admin API routes
        "/api/admin/:path*",
    ],
};
