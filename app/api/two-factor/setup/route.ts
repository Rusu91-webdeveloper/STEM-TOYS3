import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logSecurityEvent } from "@/lib/security/security-events";
import speakeasy from "speakeasy";
import qrcode from "qrcode";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { twoFactor: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if 2FA is already enabled
    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: "Two-factor authentication is already enabled" },
        { status: 400 }
      );
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `TechTots (${user.email})`,
      issuer: "TechTots",
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

    // Store the secret temporarily (not yet verified)
    const existingTwoFactor = user.twoFactor;
    if (existingTwoFactor) {
      // Update existing record
      await prisma.twoFactor.update({
        where: { userId: user.id },
        data: {
          secret: secret.base32,
          isVerified: false,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new record
      await prisma.twoFactor.create({
        data: {
          userId: user.id,
          secret: secret.base32,
          backupCodes: [], // Will be generated after verification
          isVerified: false,
        },
      });
    }

    // Log security event
    await logSecurityEvent({
      userId: user.id,
      eventType: "TWO_FACTOR_SETUP",
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      details: { action: "setup_started" },
      success: true,
    });

    return NextResponse.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      message:
        "Scan the QR code with your authenticator app and verify with the code to complete setup",
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
