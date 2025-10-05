import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";

import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { withAuth } from "@/lib/authorization";
import { z } from "zod";

// Validation schemas
const grantConsentSchema = z.object({
  consentType: z.enum(["marketing", "analytics", "essential", "third_party"]),
  consentGiven: z.boolean(),
  consentDetails: z.object({}).optional(),
  validUntil: z.string().datetime().optional(),
});

const withdrawConsentSchema = z.object({
  consentType: z.string(),
});

/**
 * GET /api/consent - Get user's current consent status
 */
export const GET = withAuth(async (request: NextRequest, session) => {
  try {
    const userId = session.user.id;

    // Get user's consent status
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        consentGiven: true,
        consentDate: true,
        dataRetention: true,
        anonymized: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get recent consent logs
    const consentLogs = await db.consentLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        action: true,
        consentType: true,
        consentGiven: true,
        consentDetails: true,
        validUntil: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      consentStatus: {
        consentGiven: user.consentGiven,
        consentDate: user.consentDate,
        dataRetention: user.dataRetention,
        anonymized: user.anonymized,
      },
      consentLogs,
    });
  } catch (error) {
    console.error("Error fetching consent status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

/**
 * POST /api/consent - Grant consent
 */
export const POST = withAuth(async (request: NextRequest, session) => {
  try {
    const userId = session.user.id;
    const body = await request.json();

    // Validate request body
    const validation = grantConsentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { consentType, consentGiven, consentDetails, validUntil } =
      validation.data;

    // Start a transaction to ensure data consistency
    const result = await db.$transaction(async tx => {
      // Update user's consent status
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          consentGiven,
          consentDate: consentGiven ? new Date() : null,
        },
        select: {
          id: true,
          consentGiven: true,
          consentDate: true,
        },
      });

      // Log the consent action
      const consentLog = await tx.consentLog.create({
        data: {
          userId,
          action: consentGiven ? "GRANTED" : "WITHDRAWN",
          consentType,
          consentGiven,
          consentDetails,
          validUntil: validUntil ? new Date(validUntil) : null,
          ipAddress:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown",
          userAgent: request.headers.get("user-agent"),
        },
      });

      return { updatedUser, consentLog };
    });

    return NextResponse.json({
      message: consentGiven
        ? "Consent granted successfully"
        : "Consent withdrawn successfully",
      consentStatus: result.updatedUser,
      consentLog: result.consentLog,
    });
  } catch (error) {
    console.error("Error managing consent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/consent - Withdraw consent (alternative method)
 */
export const DELETE = withAuth(async (request: NextRequest, session) => {
  try {
    const userId = session.user.id;
    const body = await request.json();

    // Validate request body
    const validation = withdrawConsentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { consentType } = validation.data;

    // Start a transaction
    const result = await db.$transaction(async tx => {
      // Update user's consent status to false
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          consentGiven: false,
        },
        select: {
          id: true,
          consentGiven: true,
          consentDate: true,
        },
      });

      // Log the withdrawal
      const consentLog = await tx.consentLog.create({
        data: {
          userId,
          action: "WITHDRAWN",
          consentType,
          consentGiven: false,
          ipAddress:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown",
          userAgent: request.headers.get("user-agent"),
        },
      });

      return { updatedUser, consentLog };
    });

    return NextResponse.json({
      message: "Consent withdrawn successfully",
      consentStatus: result.updatedUser,
      consentLog: result.consentLog,
    });
  } catch (error) {
    console.error("Error withdrawing consent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
