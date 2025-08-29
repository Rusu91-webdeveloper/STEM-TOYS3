import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { hash } from "bcryptjs";
import { sendEmail } from "@/lib/email";

// Validation schema for supplier application
const supplierApplicationSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  companySlug: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  website: z.string().url().optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  vatNumber: z.string().optional(),
  taxId: z.string().optional(),
  businessAddress: z.string().min(5, "Business address must be at least 5 characters"),
  businessCity: z.string().min(2, "City must be at least 2 characters"),
  businessState: z.string().min(2, "State must be at least 2 characters"),
  businessCountry: z.string().min(2, "Country must be at least 2 characters"),
  businessPostalCode: z.string().min(3, "Postal code must be at least 3 characters"),
  contactPersonName: z.string().min(2, "Contact person name must be at least 2 characters"),
  contactPersonEmail: z.string().email("Invalid email address"),
  contactPersonPhone: z.string().min(10, "Contact phone must be at least 10 characters"),
  yearEstablished: z.string().min(4, "Year established must be at least 4 characters"),
  employeeCount: z.string().min(1, "Employee count is required"),
  annualRevenue: z.string().min(1, "Annual revenue is required"),
  certifications: z.string().transform((val) => {
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }),
  productCategories: z.string().transform((val) => {
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }),
  termsAccepted: z.string().transform((val) => val === "true"),
  privacyAccepted: z.string().transform((val) => val === "true"),
  catalogUrl: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Convert FormData to object
    const data: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }

    // Validate the data
    const validatedData = supplierApplicationSchema.parse(data);

    // Check if terms are accepted
    if (!validatedData.termsAccepted || !validatedData.privacyAccepted) {
      return NextResponse.json(
        { message: "You must accept the terms and conditions and privacy policy" },
        { status: 400 }
      );
    }

    // Check if company already exists
    const existingCompany = await prisma.supplier.findFirst({
      where: {
        OR: [
          { companyName: validatedData.companyName },
          { contactPersonEmail: validatedData.contactPersonEmail }
        ]
      }
    });

    if (existingCompany) {
      return NextResponse.json(
        { message: "A company with this name or email already exists" },
        { status: 400 }
      );
    }

    // Generate company slug if not provided
    const companySlug = validatedData.companySlug || 
      validatedData.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    // Check if slug is unique
    const existingSlug = await prisma.supplier.findUnique({
      where: { companySlug }
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
        yearEstablished: validatedData.yearEstablished ? parseInt(validatedData.yearEstablished) : null,
        employeeCount: validatedData.employeeCount ? parseInt(validatedData.employeeCount.split('-')[0]) : null,
        annualRevenue: validatedData.annualRevenue,
        certifications: validatedData.certifications,
        productCategories: validatedData.productCategories,
        catalogUrl: validatedData.catalogUrl || null,
        termsAccepted: validatedData.termsAccepted,
        privacyAccepted: validatedData.privacyAccepted,
        status: "PENDING",
        commissionRate: 15, // Default commission rate
        paymentTerms: 30, // Default payment terms
        minimumOrderValue: 100, // Default minimum order value
      }
    });

    // Handle logo upload if provided
    const logoFile = formData.get('logo') as File;
    if (logoFile && logoFile.size > 0) {
      // In a real implementation, you would upload to cloud storage
      // For now, we'll just note that a logo was provided
      console.log('Logo file received:', logoFile.name, logoFile.size);
    }

    // Send confirmation email to applicant
    try {
      await sendEmail({
        to: validatedData.contactPersonEmail,
        subject: "TechTots Supplier Application Received",
        html: `
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
        `
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the application if email fails
    }

    // Send notification to admin
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL || "admin@techtots.ro",
        subject: "New Supplier Application Received",
        html: `
          <h2>New Supplier Application</h2>
          <p>A new supplier application has been submitted:</p>
          <ul>
            <li><strong>Company:</strong> ${validatedData.companyName}</li>
            <li><strong>Contact:</strong> ${validatedData.contactPersonName} (${validatedData.contactPersonEmail})</li>
            <li><strong>Phone:</strong> ${validatedData.contactPersonPhone}</li>
            <li><strong>Categories:</strong> ${validatedData.productCategories.join(', ')}</li>
            <li><strong>Application ID:</strong> ${supplier.id}</li>
          </ul>
          <p>Please review the application in the admin dashboard.</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
    }

    return NextResponse.json({
      message: "Application submitted successfully",
      applicationId: supplier.id,
      status: "pending"
    });

  } catch (error) {
    console.error('Supplier application error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: "Validation error", 
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
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
