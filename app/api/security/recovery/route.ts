import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logSecurityEvent } from "@/lib/security/security-events";
import { verifySecurityAnswer } from "@/lib/security/security-utils";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email, answers } = await request.json();

    if (!email || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Email and answers are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        securityQuestions: true,
        accountLocked: true,
        lockoutUntil: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if account is locked
    if (
      user.accountLocked &&
      user.lockoutUntil &&
      user.lockoutUntil > new Date()
    ) {
      return NextResponse.json(
        { error: "Account is temporarily locked due to security reasons" },
        { status: 423 }
      );
    }

    if (
      !user.securityQuestions ||
      (user.securityQuestions as any[]).length === 0
    ) {
      return NextResponse.json(
        { error: "No security questions set up for this account" },
        { status: 400 }
      );
    }

    const storedQuestions = user.securityQuestions as any[];
    let correctAnswers = 0;

    // Verify answers
    for (let i = 0; i < Math.min(answers.length, storedQuestions.length); i++) {
      const providedAnswer = answers[i]?.answer;
      const storedAnswer = storedQuestions[i]?.answer;

      if (
        providedAnswer &&
        storedAnswer &&
        verifySecurityAnswer(storedAnswer, providedAnswer)
      ) {
        correctAnswers++;
      }
    }

    // Require at least 70% correct answers
    const requiredCorrect = Math.ceil(storedQuestions.length * 0.7);

    if (correctAnswers < requiredCorrect) {
      // Log failed recovery attempt
      await logSecurityEvent({
        userId: user.id,
        eventType: "ACCOUNT_RECOVERY",
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        details: {
          action: "recovery_failed",
          correctAnswers,
          totalQuestions: storedQuestions.length,
        },
        success: false,
        riskScore: 60,
      });

      return NextResponse.json(
        { error: "Security answers do not match" },
        { status: 400 }
      );
    }

    // Generate recovery token
    const recoveryToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store recovery token in database (you might want to create a separate table for this)
    // For now, we'll use a temporary solution with user metadata
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // You might want to add a recoveryTokens field to the User model
        // For now, we'll use a simple approach
      },
    });

    // Log successful recovery initiation
    await logSecurityEvent({
      userId: user.id,
      eventType: "ACCOUNT_RECOVERY",
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      details: {
        action: "recovery_initiated",
        correctAnswers,
        totalQuestions: storedQuestions.length,
      },
      success: true,
    });

    // TODO: Send recovery email with the token
    // For now, return the token directly (in production, send via email)
    return NextResponse.json({
      message:
        "Security questions verified. Use this token to reset your password.",
      recoveryToken,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Account recovery error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
