import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Edge middleware – runs before every matched route.
 * Protects /admin/* pages and /api/admin/* endpoints.
 */
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // In production (HTTPS), NextAuth uses __Secure-next-auth.session-token
    const isSecure =
        process.env.NODE_ENV === "production" || request.url.startsWith("https:");

    // ── Admin UI pages (/admin/*) ──────────────────────────────────────
    if (pathname.startsWith("/admin")) {
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
            secureCookie: isSecure,
        });

        // Not authenticated → redirect to login
        if (!token) {
            const loginUrl = new URL("/auth/login", request.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Authenticated but not ADMIN → 403
        if (token.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    // ── Admin API routes (/api/admin/*) ────────────────────────────────
    if (pathname.startsWith("/api/admin")) {
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
            secureCookie: isSecure,
        });

        if (!token || token.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
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
