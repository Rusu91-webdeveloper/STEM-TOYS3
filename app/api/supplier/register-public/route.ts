import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { sendEmailViaUnifiedSystem } from "@/lib/email/migration-helper";
import { prisma } from "@/lib/prisma";

// Validation schema for supplier application
const supplierApplicationSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  companySlug: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  website: z.string().url().optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  vatNumber: z.string().optional(),
  taxId: z.string().optional(),
  businessAddress: z
    .string()
    .min(5, "Business address must be at least 5 characters"),
  businessCity: z.string().min(2, "City must be at least 2 characters"),
  businessState: z.string().min(2, "State must be at least 2 characters"),
  businessCountry: z.string().min(2, "Country must be at least 2 characters"),
  businessPostalCode: z
    .string()
    .min(3, "Postal code must be at least 3 characters"),
  contactPersonName: z
    .string()
    .min(2, "Contact person name must be at least 2 characters"),
  contactPersonEmail: z.string().email("Invalid email address"),
  contactPersonPhone: z
    .string()
    .min(10, "Contact phone must be at least 10 characters"),
  yearEstablished: z.union([z.string(), z.number()]).optional(),
  employeeCount: z.union([z.string(), z.number()]).optional(),
  annualRevenue: z.string().optional(),
  certifications: z.union([z.string(), z.array(z.string())]).transform(val => {
    if (Array.isArray(val)) return val;
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }),
  productCategories: z
    .union([z.string(), z.array(z.string())])
    .transform(val => {
      if (Array.isArray(val)) return val;
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }),
  integrationMethod: z.string().optional(),
  feedUrl: z.string().optional(),
  authType: z.string().optional(),
  authKey: z.string().optional(),
  mappingNotes: z.string().optional(),
  syncPreference: z.string().optional(),
  categoryFocus: z.string().optional(),
  termsAccepted: z
    .union([z.string(), z.boolean()])
    .transform(val => (typeof val === "boolean" ? val : val === "true")),
  privacyAccepted: z
    .union([z.string(), z.boolean()])
    .transform(val => (typeof val === "boolean" ? val : val === "true")),
  catalogUrl: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let data: Record<string, any> = {};
    let formData: FormData | null = null;

    if (contentType.includes("application/json")) {
      data = await request.json();
    } else {
      formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        data[key] = value;
      }
    }

    // Validate the data
    const validatedData = supplierApplicationSchema.parse(data);

    // Check if terms are accepted
    if (!validatedData.termsAccepted || !validatedData.privacyAccepted) {
      return NextResponse.json(
        {
          message:
            "You must accept the terms and conditions and privacy policy",
        },
        { status: 400 }
      );
    }

    // Check if company already exists
    // Note: email field is unique, so we check by email (which will be set to contactPersonEmail)
    const existingCompany = await prisma.supplier.findFirst({
      where: {
        OR: [
          { companyName: validatedData.companyName },
          { email: validatedData.contactPersonEmail },
          { contactPersonEmail: validatedData.contactPersonEmail },
        ],
      },
    });

    if (existingCompany) {
      return NextResponse.json(
        { message: "A company with this name or email already exists" },
        { status: 400 }
      );
    }

    // Generate company slug if not provided
    const companySlug =
      validatedData.companySlug ||
      validatedData.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    // Check if slug is unique
    const existingSlug = await prisma.supplier.findUnique({
      where: { companySlug },
    });

    if (existingSlug) {
      return NextResponse.json(
        { message: "A company with this slug already exists" },
        { status: 400 }
      );
    }

    // Create supplier application
    const supplier = await prisma.supplier.create({
      data: {
        // Required fields: name and email
        name: validatedData.companyName,
        email: validatedData.contactPersonEmail,
        companyName: validatedData.companyName,
        companySlug,
        description: validatedData.description,
        website: validatedData.website || null,
        phone: validatedData.phone,
        vatNumber: validatedData.vatNumber || null,
        taxId: validatedData.taxId || null,
        businessAddress: validatedData.businessAddress,
        businessCity: validatedData.businessCity,
        businessState: validatedData.businessState,
        businessCountry: validatedData.businessCountry,
        businessPostalCode: validatedData.businessPostalCode,
        contactPersonName: validatedData.contactPersonName,
        contactPersonEmail: validatedData.contactPersonEmail,
        contactPersonPhone: validatedData.contactPersonPhone,
        yearEstablished: validatedData.yearEstablished
          ? parseInt(validatedData.yearEstablished)
          : null,
        employeeCount: validatedData.employeeCount
          ? parseInt(validatedData.employeeCount.split("-")[0])
          : null,
        annualRevenue: validatedData.annualRevenue,
        certifications: validatedData.certifications,
        productCategories: validatedData.productCategories,
        catalogUrl: validatedData.catalogUrl || null,
        integrationMethod: validatedData.integrationMethod || null,
        feedUrl: validatedData.feedUrl || null,
        authType: validatedData.authType || null,
        authKey: validatedData.authKey || null,
        mappingNotes: validatedData.mappingNotes || null,
        syncPreference: validatedData.syncPreference || null,
        categoryFocus: validatedData.categoryFocus || null,
        termsAccepted: validatedData.termsAccepted,
        privacyAccepted: validatedData.privacyAccepted,
        status: "PENDING",
        commissionRate: 15, // Default commission rate
        paymentTerms: 30, // Default payment terms
        minimumOrderValue: 100, // Default minimum order value
      },
    });

    // Handle logo upload if provided
    if (formData) {
      const logoFile = formData.get("logo") as File;
      if (logoFile && logoFile.size > 0) {
        // In a real implementation, you would upload to cloud storage
        // For now, we'll just note that a logo was provided
        console.log("Logo file received:", logoFile.name, logoFile.size);
      }
    }

    // Send confirmation email to applicant (force direct sending to avoid queue issues)
    try {
      await sendEmailViaUnifiedSystem(
        validatedData.contactPersonEmail,
        "TechTots Supplier Application Received",
        `
          <h2>Thank you for your application!</h2>
          <p>Dear ${validatedData.contactPersonName},</p>
          <p>We have received your application to become a TechTots supplier. Your application is currently under review.</p>
          <p><strong>Application Details:</strong></p>
          <ul>
            <li>Company: ${validatedData.companyName}</li>
            <li>Application ID: ${supplier.id}</li>
            <li>Status: Pending Review</li>
          </ul>
          <p>Our team will review your application within 5-7 business days and contact you with the next steps.</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>The TechTots Team</p>
        `,
        { forceDirect: true }
      );
      console.log(
        "✅ Confirmation email sent to applicant:",
        validatedData.contactPersonEmail
      );
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the application if email fails
    }

    // Send notification to admin (force direct sending to avoid queue issues)
    try {
      const adminEmail = process.env.ADMIN_EMAIL || "admin@techtots.ro";
      await sendEmailViaUnifiedSystem(
        adminEmail,
        "New Supplier Application Received",
        `
          <h2>New Supplier Application</h2>
          <p>A new supplier application has been submitted:</p>
          <ul>
            <li><strong>Company:</strong> ${validatedData.companyName}</li>
            <li><strong>Contact:</strong> ${validatedData.contactPersonName} (${validatedData.contactPersonEmail})</li>
            <li><strong>Phone:</strong> ${validatedData.contactPersonPhone}</li>
            <li><strong>Categories:</strong> ${validatedData.productCategories.join(", ")}</li>
            <li><strong>Integration:</strong> ${validatedData.integrationMethod || "Not provided"}</li>
            <li><strong>Feed/API URL:</strong> ${validatedData.feedUrl || "Not provided"}</li>
            <li><strong>Application ID:</strong> ${supplier.id}</li>
          </ul>
          <p>Please review the application in the admin dashboard.</p>
        `,
        { forceDirect: true }
      );
      console.log("✅ Admin notification email sent to:", adminEmail);
    } catch (emailError) {
      console.error("Failed to send admin notification:", emailError);
    }

    return NextResponse.json({
      message: "Application submitted successfully",
      applicationId: supplier.id,
      status: "pending",
    });
  } catch (error) {
    console.error("Supplier application error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Validation error",
          errors: error.errors.map(e => `${e.path.join(".")}: ${e.message}`),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
