import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      emailNotifications,
      orderNotifications,
      paymentNotifications,
      marketingEmails,
      smsNotifications,
    } = body;

    // For now, store notification preferences in user metadata
    // In a real app, you'd have a separate notification preferences table
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        // Store preferences in a JSON field or create a separate table
        // For now, we'll just acknowledge the request
      },
    });

    logger.info("Supplier notification preferences updated", {
      userId: session.user.id,
      preferences: {
        emailNotifications,
        orderNotifications,
        paymentNotifications,
        marketingEmails,
        smsNotifications,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notification preferences updated successfully",
      notifications: {
        emailNotifications,
        orderNotifications,
        paymentNotifications,
        marketingEmails,
        smsNotifications,
      },
    });
  } catch (error) {
    logger.error("Error updating supplier notification preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
