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
      companyName,
      phone,
      businessAddress,
      businessCity,
      businessCountry,
      businessWebsite,
      taxId,
      registrationNumber,
      contactPersonName,
      contactPersonEmail,
      contactPersonPhone,
    } = body;

    // Update supplier profile
    const updatedSupplier = await db.supplier.update({
      where: { userId: session.user.id },
      data: {
        companyName,
        phone,
        businessAddress,
        businessCity,
        businessCountry,
        businessWebsite,
        taxId,
        registrationNumber,
        contactPersonName,
        contactPersonEmail,
        contactPersonPhone,
      },
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

    logger.info("Supplier profile updated", {
      supplierId: updatedSupplier.id,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      profile: updatedSupplier,
    });
  } catch (error) {
    logger.error("Error updating supplier profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
