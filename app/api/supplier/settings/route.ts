import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get supplier data
    const supplier = await db.supplier.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        companyName: true,
        email: true,
        phone: true,
        businessAddress: true,
        businessCity: true,
        businessCountry: true,
        businessWebsite: true,
        taxId: true,
        registrationNumber: true,
        contactPersonName: true,
        contactPersonEmail: true,
        contactPersonPhone: true,
        commissionRate: true,
        status: true,
        createdAt: true,
        logoUrl: true,
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Get notification settings (assuming they exist in user preferences or supplier settings)
    // For now, return default settings
    const notifications = {
      emailNotifications: true,
      orderNotifications: true,
      paymentNotifications: true,
      marketingEmails: false,
      smsNotifications: false,
    };

    logger.info("Supplier settings retrieved", {
      supplierId: supplier.id,
      userId: session.user.id,
    });

    return NextResponse.json({
      profile: supplier,
      notifications,
    });
  } catch (error) {
    logger.error("Error retrieving supplier settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
