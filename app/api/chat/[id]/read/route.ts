import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";
import { applyStandardHeaders } from "@/lib/response-headers";

// PUT - Mark a chat message as read
export const PUT = withRateLimit(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. Get message ID from params
    const { id: messageId } = await params;

    // 3. Find the message and verify user has access to it
    const message = await db.supplierMessage.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        supplierId: true,
        isRead: true,
        supplier: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // 4. Check authorization - user can only mark their own messages as read
    let hasAccess = false;

    if (session.user.role === "ADMIN") {
      // Admins can mark any message as read
      hasAccess = true;
    } else if (session.user.role === "SUPPLIER") {
      // Suppliers can only mark messages sent to them as read
      hasAccess = message.supplier.userId === session.user.id;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Unauthorized - you can only mark your own messages as read" },
        { status: 403 }
      );
    }

    // 5. Update message as read if not already read
    if (!message.isRead) {
      await db.supplierMessage.update({
        where: { id: messageId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }

    // 6. Return success response
    const response = NextResponse.json({
      success: true,
      message: "Message marked as read",
    });

    return applyStandardHeaders(response);
  } catch (error) {
    console.error("Error marking message as read:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}, {
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // 100 requests per window
});
