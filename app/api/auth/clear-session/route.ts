import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    console.log("🧹 Clearing all authentication sessions...");

    // Create a response that clears all auth cookies
    const response = NextResponse.json(
      {
        success: true,
        message: "All sessions cleared successfully",
      },
      { status: 200 }
    );

    // Clear all NextAuth cookies
    const cookiesToClear = [
      "next-auth.session-token",
      "next-auth.csrf-token",
      "next-auth.callback-url",
      "__Host-next-auth.csrf-token",
      "__Secure-next-auth.session-token",
      "__Secure-next-auth.callback-url",
      "next-auth.session-token",
      "next-auth.csrf-token",
      "next-auth.callback-url",
    ];

    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, "", {
        expires: new Date(0),
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    });

    // Also clear any custom auth cookies
    const customCookies = [
      "auth_token",
      "user_session",
      "guest_id",
      "cart_session",
    ];

    customCookies.forEach(cookieName => {
      response.cookies.set(cookieName, "", {
        expires: new Date(0),
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    });

    console.log("✅ All authentication cookies cleared");

    return response;
  } catch (error) {
    console.error("Error clearing sessions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to clear sessions",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🧹 Force clearing all sessions via POST...");

    // Get current session to log what we're clearing
    const session = await getServerSession(authOptions);
    if (session?.user) {
      console.log(`Clearing session for user: ${session.user.email}`);
    }

    // Create response that clears everything
    const response = NextResponse.json(
      {
        success: true,
        message: "All sessions force cleared",
        clearedUser: session?.user?.email || "unknown",
      },
      { status: 200 }
    );

    // Clear all possible auth cookies
    const allCookies = [
      "next-auth.session-token",
      "next-auth.csrf-token",
      "next-auth.callback-url",
      "__Host-next-auth.csrf-token",
      "__Secure-next-auth.session-token",
      "__Secure-next-auth.callback-url",
      "auth_token",
      "user_session",
      "guest_id",
      "cart_session",
      "session_id",
      "user_id",
    ];

    allCookies.forEach(cookieName => {
      response.cookies.set(cookieName, "", {
        expires: new Date(0),
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    });

    console.log("✅ All sessions force cleared successfully");

    return response;
  } catch (error) {
    console.error("Error force clearing sessions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to force clear sessions",
      },
      { status: 500 }
    );
  }
}
