import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";
import { logSecurityEvent } from "@/lib/security/security-events";
import speakeasy from "speakeasy";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await request.json();

    if (!token || typeof token !== "string" || token.length !== 6) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { twoFactor: true },
    });

    if (!user?.twoFactor) {
      return NextResponse.json(
        { error: "Two-factor authentication not set up" },
        { status: 400 }
      );
    }

    // Verify the TOTP token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactor.secret,
      encoding: "base32",
      token: token,
      window: 2, // Allow 2 time windows (30 seconds each) for clock skew
    });

    if (!verified) {
      // Log failed verification attempt
      await logSecurityEvent({
        userId: user.id,
        eventType: "TWO_FACTOR_VERIFY",
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        details: { action: "verification_failed" },
        success: false,
      });

      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes();

    // Update user and 2FA record
    await prisma.$transaction([
      prisma.twoFactor.update({
        where: { userId: user.id },
        data: {
          backupCodes: backupCodes.map(code => hashBackupCode(code)),
          isVerified: true,
          lastUsedAt: new Date(),
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorEnabled: true,
        },
      }),
    ]);

    // Log successful verification
    await logSecurityEvent({
      userId: user.id,
      eventType: "TWO_FACTOR_VERIFY",
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      details: { action: "verification_successful" },
      success: true,
    });

    return NextResponse.json({
      message: "Two-factor authentication enabled successfully",
      backupCodes: backupCodes, // Show to user once, then they should save them
      warning:
        "Save these backup codes in a secure location. Each code can only be used once.",
    });
  } catch (error) {
    console.error("2FA verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    // Generate 8-character alphanumeric codes
    codes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
  }
  return codes;
}

function hashBackupCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

async function verifyBackupCode(
  userId: string,
  code: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { twoFactor: true },
  });

  if (!user?.twoFactor?.backupCodes) {
    return false;
  }

  const hashedCode = hashBackupCode(code);
  const codeIndex = user.twoFactor.backupCodes.indexOf(hashedCode);

  if (codeIndex === -1) {
    return false;
  }

  // Remove the used backup code
  const updatedCodes = [...user.twoFactor.backupCodes];
  updatedCodes.splice(codeIndex, 1);

  await prisma.twoFactor.update({
    where: { userId },
    data: {
      backupCodes: updatedCodes,
      lastUsedAt: new Date(),
    },
  });

  return true;
}
