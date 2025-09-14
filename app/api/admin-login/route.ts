import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  console.log("🔐 [ADMIN-LOGIN] Starting admin login process");
  
  try {
    const { email, password } = await request.json();
    console.log("🔐 [ADMIN-LOGIN] Request data received:", { email, hasPassword: !!password });

    if (!email || !password) {
      console.log("❌ [ADMIN-LOGIN] Missing email or password");
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    console.log("🔍 [ADMIN-LOGIN] Looking up user in database...");
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      console.log("❌ [ADMIN-LOGIN] User not found in database");
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }
    
    console.log("👤 [ADMIN-LOGIN] User found:", { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      isActive: user.isActive,
      hasPassword: !!user.password 
    });

    // Check if user is admin
    if (user.role !== "ADMIN") {
      console.log("❌ [ADMIN-LOGIN] User is not admin, role:", user.role);
      return NextResponse.json(
        { error: "Access denied. Admin role required." },
        { status: 403 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      console.log("❌ [ADMIN-LOGIN] User account is inactive");
      return NextResponse.json(
        { error: "Account is inactive" },
        { status: 403 }
      );
    }

    // Verify password
    console.log("🔐 [ADMIN-LOGIN] Verifying password...");
    const isValidPassword = await bcrypt.compare(password, user.password || "");
    if (!isValidPassword) {
      console.log("❌ [ADMIN-LOGIN] Password verification failed");
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }
    
    console.log("✅ [ADMIN-LOGIN] Password verification successful");

    // Create a simple session token
    console.log("🎫 [ADMIN-LOGIN] Creating JWT token...");
    const sessionToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      process.env.NEXTAUTH_SECRET || "development-secret",
      { expiresIn: "24h" }
    );
    
    console.log("🎫 [ADMIN-LOGIN] JWT token created successfully");

    // Set cookie
    console.log("🍪 [ADMIN-LOGIN] Setting admin session cookie...");
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set("admin-session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
    });
    
    console.log("✅ [ADMIN-LOGIN] Admin login completed successfully");

    return response;
  } catch (error) {
    console.error("❌ [ADMIN-LOGIN] Admin login error:", error);
    console.error("❌ [ADMIN-LOGIN] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
