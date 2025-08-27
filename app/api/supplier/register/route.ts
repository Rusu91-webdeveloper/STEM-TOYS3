import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { z } from "zod";

// Validation schema for supplier registration
const supplierRegistrationSchema = z.object({
  companyName: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(100),
  companySlug: z
    .string()
    .min(2)
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      "Company slug must contain only lowercase letters, numbers, and hyphens"
    ),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  vatNumber: z
    .string()
    .regex(
      /^RO\d{2,10}$/,
      "VAT number must be in Romanian format (RO + 2-10 digits)"
    )
    .optional(),
  taxId: z.string().optional(),
  businessAddress: z
    .string()
    .min(5, "Business address must be at least 5 characters"),
  businessCity: z.string().min(2, "City must be at least 2 characters"),
  businessState: z.string().min(2, "State must be at least 2 characters"),
  businessCountry: z.string().default("România"),
  businessPostalCode: z
    .string()
    .min(4, "Postal code must be at least 4 characters"),
  contactPersonName: z
    .string()
    .min(2, "Contact person name must be at least 2 characters"),
  contactPersonEmail: z.string().email("Invalid contact email"),
  contactPersonPhone: z
    .string()
    .min(10, "Contact phone must be at least 10 characters"),
  yearEstablished: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear())
    .optional(),
  employeeCount: z.number().int().min(1).optional(),
  annualRevenue: z.string().optional(),
  certifications: z.array(z.string()).default([]),
  productCategories: z.array(z.string()).default([]),
  logo: z.string().url().optional().or(z.literal("")),
  catalogUrl: z.string().url().optional().or(z.literal("")),
  termsAccepted: z
    .boolean()
    .refine(val => val === true, "You must accept the terms and conditions"),
  privacyAccepted: z
    .boolean()
    .refine(val => val === true, "You must accept the privacy policy"),
});

export const POST = async (request: NextRequest) => {
  try {
    // Check authentication
    let session;
    try {
      session = await auth();
    } catch (authError) {
      // Handle auth errors during build time
      if (
        process.env.NODE_ENV === "production" ||
        process.env.NODE_ENV === "development"
      ) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
      throw authError;
    }

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user already has supplier role
    if (session.user.role !== "SUPPLIER") {
      return NextResponse.json(
        { error: "User must have supplier role to register" },
        { status: 403 }
      );
    }

    // Check if supplier profile already exists
    const existingSupplier = await db.supplier.findUnique({
      where: { userId: session.user.id },
    });

    if (existingSupplier) {
      return NextResponse.json(
        { error: "Supplier profile already exists" },
        { status: 409 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = supplierRegistrationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if company slug is unique
    const existingSlug = await db.supplier.findUnique({
      where: { companySlug: data.companySlug },
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: "Company slug already exists" },
        { status: 409 }
      );
    }

    // Check if VAT number is unique (if provided)
    if (data.vatNumber) {
      const existingVat = await db.supplier.findFirst({
        where: { vatNumber: data.vatNumber },
      });

      if (existingVat) {
        return NextResponse.json(
          { error: "VAT number already registered" },
          { status: 409 }
        );
      }
    }

    // Create supplier profile
    const supplier = await db.supplier.create({
      data: {
        userId: session.user.id,
        companyName: data.companyName,
        companySlug: data.companySlug,
        description: data.description,
        website: data.website || null,
        phone: data.phone,
        vatNumber: data.vatNumber || null,
        taxId: data.taxId || null,
        businessAddress: data.businessAddress,
        businessCity: data.businessCity,
        businessState: data.businessState,
        businessCountry: data.businessCountry,
        businessPostalCode: data.businessPostalCode,
        contactPersonName: data.contactPersonName,
        contactPersonEmail: data.contactPersonEmail,
        contactPersonPhone: data.contactPersonPhone,
        yearEstablished: data.yearEstablished || null,
        employeeCount: data.employeeCount || null,
        annualRevenue: data.annualRevenue || null,
        certifications: data.certifications,
        productCategories: data.productCategories,
        logo: data.logo || null,
        catalogUrl: data.catalogUrl || null,
        termsAccepted: data.termsAccepted,
        privacyAccepted: data.privacyAccepted,
        status: "PENDING", // Default status
        commissionRate: 15.0, // Default commission rate
        paymentTerms: 30, // Default payment terms (Net 30)
        minimumOrderValue: 0, // Default minimum order value
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    logger.info("Supplier registration successful", {
      supplierId: supplier.id,
      userId: session.user.id,
      companyName: data.companyName,
    });

    // Return supplier data without sensitive information
    const supplierData = {
      id: supplier.id,
      companyName: supplier.companyName,
      companySlug: supplier.companySlug,
      status: supplier.status,
      createdAt: supplier.createdAt,
      user: supplier.user,
    };

    return NextResponse.json(supplierData, { status: 201 });
  } catch (error) {
    logger.error("Error in supplier registration:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
