import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const supplier = await db.supplier.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));

    // Update supplier profile
    const updatedSupplier = await db.supplier.update({
      where: { id: supplier.id },
      data: {
        companyName: body.companyName,
        description: body.description,
        website: body.website,
        phone: body.phone,
        vatNumber: body.vatNumber,
        businessAddress: body.businessAddress,
        businessCity: body.businessCity,
        businessState: body.businessState,
        businessCountry: body.businessCountry,
        businessPostalCode: body.businessPostalCode,
        contactPersonName: body.contactPersonName,
        contactPersonEmail: body.contactPersonEmail,
        contactPersonPhone: body.contactPersonPhone,
        yearEstablished: body.yearEstablished,
        employeeCount: body.employeeCount,
        annualRevenue: body.annualRevenue,
        commissionRate: body.commissionRate,
        paymentTerms: body.paymentTerms,
        minimumOrderValue: body.minimumOrderValue,
      },
      select: {
        id: true,
        companyName: true,
        description: true,
        website: true,
        phone: true,
        vatNumber: true,
        businessAddress: true,
        businessCity: true,
        businessState: true,
        businessCountry: true,
        businessPostalCode: true,
        contactPersonName: true,
        contactPersonEmail: true,
        contactPersonPhone: true,
        yearEstablished: true,
        employeeCount: true,
        annualRevenue: true,
        commissionRate: true,
        paymentTerms: true,
        minimumOrderValue: true,
      },
    });

    logger.info("Supplier settings updated successfully", {
      supplierId: supplier.id,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      supplier: updatedSupplier,
    });
  } catch (error) {
    logger.error("Error updating supplier settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
