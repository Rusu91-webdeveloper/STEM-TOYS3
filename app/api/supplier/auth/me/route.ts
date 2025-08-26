import { NextRequest, NextResponse } from "next/server";
import { withSupplierAuth } from "@/lib/authorization";
import { getCurrentSupplier } from "@/lib/supplier-auth";
import { logger } from "@/lib/logger";

export const GET = withSupplierAuth(async (request: NextRequest, session) => {
  try {
    const supplier = await getCurrentSupplier(session);
    
    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier profile not found" },
        { status: 404 }
      );
    }

    // Return supplier data without sensitive information
    const supplierData = {
      id: supplier.id,
      companyName: supplier.companyName,
      companySlug: supplier.companySlug,
      description: supplier.description,
      website: supplier.website,
      phone: supplier.phone,
      vatNumber: supplier.vatNumber,
      businessAddress: supplier.businessAddress,
      businessCity: supplier.businessCity,
      businessState: supplier.businessState,
      businessCountry: supplier.businessCountry,
      businessPostalCode: supplier.businessPostalCode,
      contactPersonName: supplier.contactPersonName,
      contactPersonEmail: supplier.contactPersonEmail,
      contactPersonPhone: supplier.contactPersonPhone,
      yearEstablished: supplier.yearEstablished,
      employeeCount: supplier.employeeCount,
      annualRevenue: supplier.annualRevenue,
      certifications: supplier.certifications,
      productCategories: supplier.productCategories,
      status: supplier.status,
      commissionRate: supplier.commissionRate,
      paymentTerms: supplier.paymentTerms,
      minimumOrderValue: supplier.minimumOrderValue,
      logo: supplier.logo,
      catalogUrl: supplier.catalogUrl,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
      user: {
        id: supplier.user.id,
        name: supplier.user.name,
        email: supplier.user.email,
        role: supplier.user.role,
        isActive: supplier.user.isActive,
      }
    };

    logger.info("Supplier profile retrieved successfully", {
      supplierId: supplier.id,
      userId: session.user.id,
    });

    return NextResponse.json(supplierData);
  } catch (error) {
    logger.error("Error retrieving supplier profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
