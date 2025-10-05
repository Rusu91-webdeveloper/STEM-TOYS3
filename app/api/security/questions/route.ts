import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logSecurityEvent } from "@/lib/security/security-events";
import {
  encryptSecurityAnswer,
  verifySecurityAnswer,
} from "@/lib/security/security-utils";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { questions } = await request.json();

    if (
      !Array.isArray(questions) ||
      questions.length < 2 ||
      questions.length > 5
    ) {
      return NextResponse.json(
        { error: "Must provide 2-5 security questions" },
        { status: 400 }
      );
    }

    // Validate question format
    for (const q of questions) {
      if (
        !q.question ||
        !q.answer ||
        typeof q.question !== "string" ||
        typeof q.answer !== "string"
      ) {
        return NextResponse.json(
          { error: "Invalid question format" },
          { status: 400 }
        );
      }

      if (q.question.length < 10 || q.answer.length < 3) {
        return NextResponse.json(
          { error: "Questions and answers must be meaningful" },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Encrypt and store security questions
    const encryptedQuestions = questions.map(q => ({
      question: q.question,
      answer: encryptSecurityAnswer(q.answer),
    }));

    await prisma.user.update({
      where: { id: user.id },
      data: {
        securityQuestions: encryptedQuestions,
      },
    });

    // Log the event
    await logSecurityEvent({
      userId: user.id,
      eventType: "SECURITY_QUESTION_SETUP",
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      details: { questionCount: questions.length },
      success: true,
    });

    return NextResponse.json({
      message: "Security questions set up successfully",
    });
  } catch (error) {
    console.error("Security questions setup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { securityQuestions: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return only questions (not answers)
    const questions = user.securityQuestions
      ? (user.securityQuestions as any[]).map(q => ({ question: q.question }))
      : [];

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Security questions get error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
