import { prisma } from "@/lib/prisma";
import { logSecurityEvent } from "./security-events";

export interface LoginAttempt {
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
}

export async function handleLoginAttempt(attempt: LoginAttempt) {
  const { email, ipAddress, userAgent, success } = attempt;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      failedLoginAttempts: true,
      accountLocked: true,
      lockoutUntil: true,
    },
  });

  if (!user) {
    // Log unknown email attempt
    await logSecurityEvent({
      eventType: "LOGIN_FAILED",
      ipAddress,
      userAgent,
      details: { reason: "unknown_email", email },
      success: false,
      riskScore: 20,
    });
    return;
  }

  if (success) {
    // Successful login - reset failed attempts and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        accountLocked: false,
        lockoutUntil: null,
        lastLoginAt: new Date(),
      },
    });

    await logSecurityEvent({
      userId: user.id,
      eventType: "LOGIN_SUCCESS",
      ipAddress,
      userAgent,
      success: true,
    });
  } else {
    // Failed login - increment counter
    const newAttempts = (user.failedLoginAttempts || 0) + 1;
    const shouldLock = newAttempts >= 5; // Lock after 5 failed attempts
    const lockoutUntil = shouldLock
      ? new Date(Date.now() + 30 * 60 * 1000)
      : null; // 30 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newAttempts,
        accountLocked: shouldLock,
        lockoutUntil: lockoutUntil,
      },
    });

    if (shouldLock) {
      await logSecurityEvent({
        userId: user.id,
        eventType: "ACCOUNT_LOCKOUT",
        ipAddress,
        userAgent,
        details: { failedAttempts: newAttempts },
        success: false,
        riskScore: 70,
      });
    } else {
      await logSecurityEvent({
        userId: user.id,
        eventType: "LOGIN_FAILED",
        ipAddress,
        userAgent,
        details: { attemptNumber: newAttempts },
        success: false,
        riskScore: newAttempts * 10,
      });
    }
  }
}

export async function checkAccountLockout(email: string): Promise<{
  locked: boolean;
  lockoutUntil?: Date;
  remainingAttempts?: number;
}> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      accountLocked: true,
      lockoutUntil: true,
      failedLoginAttempts: true,
    },
  });

  if (!user) {
    return { locked: false, remainingAttempts: 5 };
  }

  // Check if lockout has expired
  if (
    user.accountLocked &&
    user.lockoutUntil &&
    user.lockoutUntil <= new Date()
  ) {
    // Reset lockout
    await prisma.user.update({
      where: { email },
      data: {
        accountLocked: false,
        lockoutUntil: null,
        failedLoginAttempts: 0,
      },
    });
    return { locked: false, remainingAttempts: 5 };
  }

  const remainingAttempts = Math.max(0, 5 - (user.failedLoginAttempts || 0));

  return {
    locked: user.accountLocked || false,
    lockoutUntil: user.lockoutUntil || undefined,
    remainingAttempts,
  };
}

export async function unlockAccount(email: string, adminUserId?: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      accountLocked: false,
      lockoutUntil: null,
      failedLoginAttempts: 0,
    },
  });

  await logSecurityEvent({
    userId: user.id,
    eventType: "ACCOUNT_UNLOCK",
    details: {
      action: adminUserId ? "unlocked_by_admin" : "auto_unlock",
      adminUserId,
    },
    success: true,
  });
}

export async function verifyTwoFactorToken(
  userId: string,
  token: string,
  ipAddress: string,
  userAgent: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { twoFactor: true },
  });

  if (!user?.twoFactor?.secret) {
    return false;
  }

  const speakeasy = require("speakeasy");
  const verified = speakeasy.totp.verify({
    secret: user.twoFactor.secret,
    encoding: "base32",
    token: token,
    window: 2,
  });

  if (verified) {
    // Update last used time
    await prisma.twoFactor.update({
      where: { userId },
      data: { lastUsedAt: new Date() },
    });

    await logSecurityEvent({
      userId,
      eventType: "TWO_FACTOR_VERIFY",
      ipAddress,
      userAgent,
      details: { method: "totp" },
      success: true,
    });
  } else {
    await logSecurityEvent({
      userId,
      eventType: "TWO_FACTOR_VERIFY",
      ipAddress,
      userAgent,
      details: { method: "totp", reason: "invalid_token" },
      success: false,
      riskScore: 40,
    });
  }

  return verified;
}

export async function verifyBackupCode(
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

  const crypto = require("crypto");
  const hashedCode = crypto.createHash("sha256").update(code).digest("hex");
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
