import crypto from "crypto";

import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { appConfig } from "@/lib/config/app-config";
import { resolveAdminUserId } from "@/lib/admin-utils";
import { auth } from "@/lib/auth";
import { sendEmailViaUnifiedSystem } from "@/lib/email/migration-helper";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

const normalizeStatus = (value?: string | null) => {
  if (!value) return "PENDING";
  if (value === "ACTIVE") return "APPROVED";
  return value;
};

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const supplierId = request.nextUrl.pathname.split("/").pop();

    if (!supplierId) {
      return NextResponse.json(
        { error: "Supplier ID is required" },
        { status: 400 }
      );
    }

    const supplier = await db.supplier.findUnique({
      where: { id: supplierId },
      include: {
        _count: {
          select: {
            products: true,
            orders: true,
            invoices: true,
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Get supplier statistics (resilient: use defaults on failure to avoid 500)
    let totalRevenue: { _sum: { supplierRevenue: number | null } } = {
      _sum: { supplierRevenue: 0 },
    };
    let totalOrders = 0;
    let recentOrders: Awaited<
      ReturnType<typeof db.supplierOrder.findMany<{ include: object }>>
    > = [];
    let productStats: Array<{ isActive: boolean; _count: { isActive: number } }> =
      [];

    try {
      const [rev, ordCount, orders, stats] = await Promise.all([
        db.supplierOrder.aggregate({
          where: {
            supplierId,
            status: { in: ["DELIVERED"] },
          },
          _sum: { supplierRevenue: true },
        }),
        db.supplierOrder.count({ where: { supplierId } }),
        db.supplierOrder.findMany({
          where: { supplierId },
          include: {
            order: {
              select: {
                orderNumber: true,
                createdAt: true,
                status: true,
                total: true,
              },
            },
            product: {
              select: {
                name: true,
                images: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        db.product.groupBy({
          by: ["isActive"],
          where: { supplierId },
          _count: { isActive: true },
        }),
      ]);
      totalRevenue = rev;
      totalOrders = ordCount;
      recentOrders = orders;
      productStats = stats;
    } catch (statsError) {
      logger.warn("Supplier stats query failed, using defaults", {
        supplierId,
        error: statsError instanceof Error ? statsError.message : String(statsError),
      });
    }

    // Get recent products (resilient)
    let recentProducts: Array<{
      id: string;
      name: string;
      price: number;
      stockQuantity: number;
      isActive: boolean;
      createdAt: Date;
      images: string[];
      _count: { reviews: number };
    }> = [];
    try {
      recentProducts = await db.product.findMany({
        where: { supplierId },
        select: {
          id: true,
          name: true,
          price: true,
          stockQuantity: true,
          isActive: true,
          createdAt: true,
          images: true,
          _count: { select: { reviews: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
    } catch (productsError) {
      logger.warn("Supplier recent products query failed", {
        supplierId,
        error:
          productsError instanceof Error
            ? productsError.message
            : String(productsError),
      });
    }

    // Transform supplier to match frontend expectations
    const transformedSupplier = {
      id: supplier.id,
      userId: supplier.userId,
      companyName: supplier.companyName || supplier.name,
      companySlug: supplier.companySlug,
      description: supplier.description,
      website: supplier.website,
      phone: supplier.phone,
      email: supplier.email,
      contactPersonName: supplier.contactPersonName || supplier.contactPerson,
      contactPersonEmail: supplier.contactPersonEmail,
      contactPersonPhone: supplier.contactPersonPhone,
      businessAddress: supplier.businessAddress,
      businessCity: supplier.businessCity,
      businessState: supplier.businessState,
      businessCountry: supplier.businessCountry || "Romania",
      businessPostalCode: supplier.businessPostalCode,
      vatNumber: supplier.vatNumber,
      taxId: supplier.taxId,
      cui: supplier.cui,
      codFiscal: supplier.codFiscal,
      nrRegCom: supplier.nrRegCom,
      reprezentantLegal: supplier.reprezentantLegal,
      yearEstablished: supplier.yearEstablished,
      employeeCount: supplier.employeeCount,
      annualRevenue: supplier.annualRevenue,
      certifications: supplier.certifications,
      productCategories: supplier.productCategories,
      isActive: supplier.isActive,
      status: normalizeStatus(supplier.status),
      approvedAt: supplier.approvedAt,
      approvedBy: supplier.approvedBy,
      rejectionReason: supplier.rejectionReason,
      commissionRate: supplier.commissionRate,
      paymentTerms: supplier.paymentTerms,
      minimumOrderValue: supplier.minimumOrderValue,
      defaultMargin: supplier.defaultMargin,
      minimumMarginPercentage: supplier.minimumMarginPercentage,
      priceChangeThreshold: supplier.priceChangeThreshold,
      adresaSediu: supplier.adresaSediu,
      anpcApproval: supplier.anpcApproval,
      educationalCertification: supplier.educationalCertification,
      iscApproval: supplier.iscApproval,
      romanianBankAccount: supplier.romanianBankAccount,
      romanianComplianceStatus: supplier.romanianComplianceStatus,
      romanianCurrency: supplier.romanianCurrency,
      romanianPaymentTerms: supplier.romanianPaymentTerms,
      romanianVatNumber: supplier.romanianVatNumber,
      apiEndpoint: supplier.apiEndpoint,
      apiKey: supplier.apiKey,
      trackingUrl: supplier.trackingUrl,
      averageDeliveryDays: supplier.averageDeliveryDays,
      logo: supplier.logo,
      catalogUrl: supplier.catalogUrl,
      termsAccepted: supplier.termsAccepted,
      privacyAccepted: supplier.privacyAccepted,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
      _count: supplier._count,
    };

    const supplierData = {
      ...transformedSupplier,
      statistics: {
        totalRevenue: totalRevenue._sum?.supplierRevenue ?? 0,
        totalOrders,
        activeProducts:
          productStats.find(p => p.isActive)?._count?.isActive ?? 0,
        inactiveProducts:
          productStats.find(p => !p.isActive)?._count?.isActive ?? 0,
      },
      recentOrders,
      recentProducts,
    };

    logger.info("Admin supplier details retrieved successfully", {
      adminId: session.user.id,
      supplierId,
    });

    return NextResponse.json(supplierData);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    const supplierId = request.nextUrl.pathname.split("/").pop();
    logger.error("Error retrieving admin supplier details:", {
      error: err.message,
      stack: err.stack,
      supplierId,
    });
    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const supplierId = request.nextUrl.pathname.split("/").pop();

    if (!supplierId) {
      return NextResponse.json(
        { error: "Supplier ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      status,
      commissionRate,
      paymentTerms,
      minimumOrderValue,
      defaultMargin,
      minimumMarginPercentage,
      priceChangeThreshold,
      rejectionReason,
      notes,
      businessAddress,
      businessCity,
      businessState,
      businessPostalCode,
      businessCountry,
      contactPersonName,
      contactPersonEmail,
      contactPersonPhone,
      phone,
    } = body;

    // Validate input
    if (
      commissionRate !== undefined &&
      (commissionRate < 0 || commissionRate > 100)
    ) {
      return NextResponse.json(
        { error: "Commission rate must be between 0 and 100" },
        { status: 400 }
      );
    }

    if (paymentTerms !== undefined && paymentTerms < 0) {
      return NextResponse.json(
        { error: "Payment terms must be positive" },
        { status: 400 }
      );
    }

    if (minimumOrderValue !== undefined && minimumOrderValue < 0) {
      return NextResponse.json(
        { error: "Minimum order value must be positive" },
        { status: 400 }
      );
    }

    const normalizePercent = (value: number | undefined) => {
      if (value === undefined || value === null) return undefined;
      if (Number.isNaN(value)) return undefined;
      const numeric = Number(value);
      if (numeric > 1) return numeric / 100;
      return numeric;
    };

    const normalizedDefaultMargin = normalizePercent(defaultMargin);
    const normalizedMinimumMargin = normalizePercent(minimumMarginPercentage);
    const normalizedPriceChangeThreshold = normalizePercent(priceChangeThreshold);

    if (
      normalizedDefaultMargin !== undefined &&
      (normalizedDefaultMargin < 0 || normalizedDefaultMargin > 1)
    ) {
      return NextResponse.json(
        { error: "Default margin must be between 0 and 1 (or 0-100%)" },
        { status: 400 }
      );
    }

    if (
      normalizedMinimumMargin !== undefined &&
      (normalizedMinimumMargin < 0 || normalizedMinimumMargin > 1)
    ) {
      return NextResponse.json(
        { error: "Minimum margin must be between 0 and 1 (or 0-100%)" },
        { status: 400 }
      );
    }

    if (
      normalizedPriceChangeThreshold !== undefined &&
      (normalizedPriceChangeThreshold < 0 || normalizedPriceChangeThreshold > 1)
    ) {
      return NextResponse.json(
        { error: "Price change threshold must be between 0 and 1 (or 0-100%)" },
        { status: 400 }
      );
    }

    if (
      normalizedDefaultMargin !== undefined &&
      normalizedMinimumMargin !== undefined &&
      normalizedMinimumMargin > normalizedDefaultMargin
    ) {
      return NextResponse.json(
        { error: "Minimum margin cannot exceed default margin" },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (status !== undefined) {
      updateData.status = status;
      if (status === "APPROVED") {
        updateData.approvedAt = new Date();
        // Resolve the actual admin user ID (handles admin_env case)
        const actualAdminId = await resolveAdminUserId(
          session.user.id,
          session.user.email
        );
        updateData.approvedBy = actualAdminId;
      } else if (status === "REJECTED" || status === "SUSPENDED") {
        updateData.rejectionReason =
          rejectionReason || `Status changed to ${status}`;
      }
    }

    if (commissionRate !== undefined)
      updateData.commissionRate = commissionRate;
    if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms;
    if (minimumOrderValue !== undefined)
      updateData.minimumOrderValue = minimumOrderValue;
    if (normalizedDefaultMargin !== undefined)
      updateData.defaultMargin = normalizedDefaultMargin;
    if (normalizedMinimumMargin !== undefined)
      updateData.minimumMarginPercentage = normalizedMinimumMargin;
    if (normalizedPriceChangeThreshold !== undefined)
      updateData.priceChangeThreshold = normalizedPriceChangeThreshold;

    if (businessAddress !== undefined)
      updateData.businessAddress = businessAddress;
    if (businessCity !== undefined) updateData.businessCity = businessCity;
    if (businessState !== undefined) updateData.businessState = businessState;
    if (businessPostalCode !== undefined)
      updateData.businessPostalCode = businessPostalCode;
    if (businessCountry !== undefined)
      updateData.businessCountry = businessCountry;
    if (contactPersonName !== undefined)
      updateData.contactPersonName = contactPersonName;
    if (contactPersonEmail !== undefined)
      updateData.contactPersonEmail = contactPersonEmail;
    if (contactPersonPhone !== undefined)
      updateData.contactPersonPhone = contactPersonPhone;
    if (phone !== undefined) updateData.phone = phone;

    try {
      const supplier = await db.supplier.update({
        where: { id: supplierId },
        data: updateData,
      });

      logger.info("Admin supplier updated successfully", {
        adminId: session.user.id,
        supplierId,
        updatedFields: Object.keys(updateData),
      });

      // Create user account and send approval email if status was changed to APPROVED
      if (status === "APPROVED" && supplier.contactPersonEmail) {
        try {
          // Check if user account already exists
          const existingUser = await db.user.findUnique({
            where: { email: supplier.contactPersonEmail },
          });

          if (!existingUser) {
            // Generate a secure temporary password
            const tempPassword = generateSecurePassword();
            const hashedPassword = await hash(tempPassword, 12);

            // Create user account
            const newUser = await db.user.create({
              data: {
                name: supplier.contactPersonName,
                email: supplier.contactPersonEmail,
                password: hashedPassword,
                role: "SUPPLIER",
                isActive: true,
                emailVerified: new Date(),
              },
            });

            // Link the user to the supplier
            await db.supplier.update({
              where: { id: supplierId },
              data: { userId: newUser.id },
            });

            logger.info("Supplier user account created", {
              supplierId,
              userId: newUser.id,
              email: supplier.contactPersonEmail,
            });

            // Send approval email with login credentials
            await sendSupplierApprovalEmail(supplier, tempPassword);
          } else {
            // User already exists, just send approval email
            await sendSupplierApprovalEmail(supplier);
          }

          logger.info("Supplier approval email sent", {
            supplierId,
            email: supplier.contactPersonEmail,
          });
        } catch (emailError) {
          logger.error("Failed to send supplier approval email", {
            supplierId,
            email: supplier.contactPersonEmail,
            error: emailError,
          });
          // Don't fail the update if email fails
        }
      }

      // Send rejection email if status was changed to REJECTED
      if (status === "REJECTED") {
        try {
          await sendSupplierRejectionEmail(supplier, rejectionReason);

          logger.info("Supplier rejection email sent", {
            supplierId,
            email: supplier.contactPersonEmail,
            rejectionReason,
          });
        } catch (emailError) {
          logger.error("Failed to send supplier rejection email", {
            supplierId,
            email: supplier.contactPersonEmail,
            error: emailError,
          });
          // Don't fail the update if email fails
        }
      }

      // Transform supplier to match frontend expectations
      const transformedSupplier = {
        id: supplier.id,
        userId: supplier.userId,
        companyName: supplier.companyName || supplier.name,
        companySlug: supplier.companySlug,
        description: supplier.description,
        website: supplier.website,
        phone: supplier.phone,
        email: supplier.email,
        contactPersonName: supplier.contactPersonName || supplier.contactPerson,
        contactPersonEmail: supplier.contactPersonEmail,
        contactPersonPhone: supplier.contactPersonPhone,
        businessAddress: supplier.businessAddress,
        businessCity: supplier.businessCity,
        businessState: supplier.businessState,
        businessCountry: supplier.businessCountry || "Romania",
        businessPostalCode: supplier.businessPostalCode,
        vatNumber: supplier.vatNumber,
        taxId: supplier.taxId,
        cui: supplier.cui,
        codFiscal: supplier.codFiscal,
        nrRegCom: supplier.nrRegCom,
        reprezentantLegal: supplier.reprezentantLegal,
        yearEstablished: supplier.yearEstablished,
        employeeCount: supplier.employeeCount,
        annualRevenue: supplier.annualRevenue,
        certifications: supplier.certifications,
        productCategories: supplier.productCategories,
        isActive: supplier.isActive,
        status: normalizeStatus(supplier.status),
        approvedAt: supplier.approvedAt,
        approvedBy: supplier.approvedBy,
        rejectionReason: supplier.rejectionReason,
        commissionRate: supplier.commissionRate,
        paymentTerms: supplier.paymentTerms,
        minimumOrderValue: supplier.minimumOrderValue,
        defaultMargin: supplier.defaultMargin,
        minimumMarginPercentage: supplier.minimumMarginPercentage,
        priceChangeThreshold: supplier.priceChangeThreshold,
        adresaSediu: supplier.adresaSediu,
        anpcApproval: supplier.anpcApproval,
        educationalCertification: supplier.educationalCertification,
        iscApproval: supplier.iscApproval,
        romanianBankAccount: supplier.romanianBankAccount,
        romanianComplianceStatus: supplier.romanianComplianceStatus,
        romanianCurrency: supplier.romanianCurrency,
        romanianPaymentTerms: supplier.romanianPaymentTerms,
        romanianVatNumber: supplier.romanianVatNumber,
        apiEndpoint: supplier.apiEndpoint,
        apiKey: supplier.apiKey,
        trackingUrl: supplier.trackingUrl,
        averageDeliveryDays: supplier.averageDeliveryDays,
        logo: supplier.logo,
        catalogUrl: supplier.catalogUrl,
        termsAccepted: supplier.termsAccepted,
        privacyAccepted: supplier.privacyAccepted,
        createdAt: supplier.createdAt,
        updatedAt: supplier.updatedAt,
      };

      return NextResponse.json({
        success: true,
        message: "Supplier updated successfully",
        supplier: transformedSupplier,
      });
    } catch (dbError: any) {
      logger.error("Database error updating supplier:", dbError);

      // Check if it's a foreign key constraint error
      if (dbError.code === "P2003") {
        return NextResponse.json(
          {
            error:
              "Admin user not found in database. Please ensure you have a valid admin account.",
          },
          { status: 400 }
        );
      }

      throw dbError;
    }
  } catch (error) {
    logger.error("Error updating admin supplier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const supplierId = request.nextUrl.pathname.split("/").pop();

    if (!supplierId) {
      return NextResponse.json(
        { error: "Supplier ID is required" },
        { status: 400 }
      );
    }

    // Check if supplier has active products or orders
    const [activeProducts, activeOrders] = await Promise.all([
      db.product.count({
        where: {
          supplierId,
          isActive: true,
        },
      }),
      db.supplierOrder.count({
        where: {
          supplierId,
          status: {
            in: [
              "PENDING",
              "CONFIRMED",
              "IN_PRODUCTION",
              "READY_TO_SHIP",
              "SHIPPED",
            ],
          },
        },
      }),
    ]);

    if (activeProducts > 0 || activeOrders > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete supplier with active products or pending orders",
          details: {
            activeProducts,
            activeOrders,
          },
        },
        { status: 400 }
      );
    }

    // Delete supplier (this will cascade to related records)
    await db.supplier.delete({
      where: { id: supplierId },
    });

    logger.info("Admin supplier deleted successfully", {
      adminId: session.user.id,
      supplierId,
    });

    return NextResponse.json({
      success: true,
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting admin supplier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Function to generate secure password
function generateSecurePassword(): string {
  const length = 12;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Function to send supplier approval email
async function sendSupplierApprovalEmail(supplier: any, tempPassword?: string) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/supplier/dashboard`;
  const productsUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/supplier/products`;
  const ordersUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/supplier/orders`;
  const supportEmail = appConfig.supportEmail;

  const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Supplier Application Approved - TechTots</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 700px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 18px; margin-bottom: 20px; color: #2d3748; }
          .message { font-size: 16px; margin-bottom: 30px; color: #4a5568; }
          .success-box { background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 25px; margin: 30px 0; border-radius: 8px; text-align: center; }
          .success-box h3 { margin: 0 0 15px 0; color: #166534; font-size: 20px; }
          .next-steps { background-color: #f7fafc; border-left: 4px solid #10b981; padding: 25px; margin: 30px 0; border-radius: 0 8px 8px 0; }
          .next-steps h3 { margin: 0 0 20px 0; color: #2d3748; font-size: 18px; }
          .step-list { margin: 0; padding-left: 20px; }
          .step-list li { margin-bottom: 12px; color: #4a5568; }
          .action-buttons { text-align: center; margin: 30px 0; }
          .btn { display: inline-block; padding: 12px 24px; margin: 8px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; }
          .btn-primary { background-color: #10b981; color: white; }
          .btn-secondary { background-color: #6b7280; color: white; }
          .btn-outline { background-color: transparent; color: #10b981; border: 2px solid #10b981; }
          .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
          .feature-card { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; text-align: center; }
          .feature-card h4 { margin: 0 0 10px 0; color: #2d3748; font-size: 16px; }
          .feature-card p { margin: 0; color: #4a5568; font-size: 14px; }
          .footer { background-color: #2d3748; color: white; padding: 30px; text-align: center; }
          .footer p { margin: 5px 0; font-size: 14px; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .contact-info { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
          .contact-info p { margin: 5px 0; font-size: 14px; color: #718096; }
          .commission-info { background-color: #fef3c7; border: 1px solid #fde68a; padding: 20px; margin: 30px 0; border-radius: 8px; }
          .commission-info h4 { margin: 0 0 10px 0; color: #92400e; font-size: 16px; }
          .commission-info p { margin: 5px 0; color: #92400e; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🧩 TechTots</div>
            <h1>🎉 Congratulations! You're Approved!</h1>
            <p>Welcome to the TechTots Supplier Family</p>
          </div>
          
          <div class="content">
            <div class="greeting">Dear ${supplier.contactPersonName},</div>
            
            <div class="success-box">
              <h3>✅ Your Application Has Been Approved!</h3>
              <p>We're excited to welcome <strong>${supplier.companyName}</strong> to the TechTots supplier network!</p>
            </div>
            
            <div class="message">
              Your company has been carefully reviewed and approved to sell STEM educational products through our platform. 
              We're confident that your products will be a great addition to our catalog and will help inspire the next generation of innovators.
            </div>
            
            <div class="next-steps">
              <h3>🚀 Next Steps to Get Started</h3>
              <ol class="step-list">
                <li><strong>Log In to Your Account:</strong> Use the credentials below to access your supplier portal</li>
                <li><strong>Access Your Dashboard:</strong> Manage your account and view your performance</li>
                <li><strong>Upload Your Products:</strong> Add your STEM educational products to our catalog</li>
                <li><strong>Set Up Payment Information:</strong> Configure your payment details for commission payments</li>
                <li><strong>Review Our Guidelines:</strong> Familiarize yourself with our product and shipping standards</li>
                <li><strong>Start Selling:</strong> Your products will be visible to our customers once approved</li>
              </ol>
            </div>
            
            ${tempPassword
      ? `
            <div class="login-credentials" style="background-color: #f0f9ff; border: 1px solid #0ea5e9; padding: 25px; margin: 30px 0; border-radius: 8px;">
              <h3 style="margin: 0 0 20px 0; color: #0c4a6e; font-size: 18px;">🔐 Your Login Credentials</h3>
              <div style="background-color: white; padding: 20px; border-radius: 6px; border: 1px solid #e0f2fe;">
                <p style="margin: 5px 0; font-size: 14px; color: #0c4a6e;"><strong>Email:</strong> ${supplier.contactPersonEmail}</p>
                <p style="margin: 5px 0; font-size: 14px; color: #0c4a6e;"><strong>Temporary Password:</strong> ${tempPassword}</p>
                <p style="margin: 15px 0 5px 0; font-size: 12px; color: #0369a1; font-style: italic;">⚠️ Please change your password after your first login for security</p>
              </div>
            </div>
            `
      : ""
    }
            
            <div class="action-buttons">
              <a href="${dashboardUrl}" class="btn btn-primary">📊 Access Dashboard</a>
              <a href="${productsUrl}" class="btn btn-secondary">📦 Manage Products</a>
              <a href="${ordersUrl}" class="btn btn-outline">📋 View Orders</a>
            </div>
            
            <div class="features-grid">
              <div class="feature-card">
                <h4>📊 Analytics Dashboard</h4>
                <p>Track your sales performance, customer insights, and revenue analytics in real-time</p>
              </div>
              <div class="feature-card">
                <h4>📦 Product Management</h4>
                <p>Easily upload, edit, and manage your product catalog with bulk import capabilities</p>
              </div>
              <div class="feature-card">
                <h4>📋 Order Management</h4>
                <p>Process orders, update status, and manage shipping with our integrated system</p>
              </div>
              <div class="feature-card">
                <h4>💰 Financial Tracking</h4>
                <p>Monitor your earnings, commission rates, and payment history</p>
              </div>
            </div>
            
            <div class="commission-info">
              <h4>💰 Commission & Payment Details</h4>
              <p><strong>Commission Rate:</strong> ${supplier.commissionRate}%</p>
              <p><strong>Payment Terms:</strong> Net ${supplier.paymentTerms} days</p>
              <p><strong>Minimum Order Value:</strong> $${supplier.minimumOrderValue}</p>
              <p>Payments are processed monthly and sent to your registered payment method.</p>
            </div>
            
            <div class="message">
              <strong>Important Notes:</strong>
              <ul style="margin: 10px 0; padding-left: 20px; color: #4a5568;">
                <li>All products must meet our STEM educational standards</li>
                <li>Shipping should be completed within 2-3 business days</li>
                <li>Customer service inquiries will be handled by our team</li>
                <li>Regular performance reviews will be conducted quarterly</li>
              </ul>
            </div>
            
            <div class="contact-info">
              <p><strong>Need Help Getting Started?</strong></p>
              <p>📧 Email: ${supportEmail}</p>
              <p>📞 Phone: +1 (555) 123-4567</p>
              <p>🌐 Support Portal: <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/support" style="color: #10b981;">support.techtots.com</a></p>
            </div>
          </div>
          
          <div class="footer">
            <p>© 2024 TechTots STEM Store. All rights reserved.</p>
            <p>Empowering the next generation through STEM education</p>
          </div>
        </div>
      </body>
      </html>
    `;

  await sendEmailViaUnifiedSystem(
    supplier.contactPersonEmail,
    "🎉 Congratulations! Your TechTots Supplier Application Has Been Approved!",
    htmlContent,
    { forceDirect: true }
  );
}

// Function to send supplier rejection email
async function sendSupplierRejectionEmail(
  supplier: any,
  rejectionReason?: string
) {
  const supportEmail = appConfig.supportEmail;
  const reapplyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/supplier`;

  const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Supplier Application Update - TechTots</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 700px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 18px; margin-bottom: 20px; color: #2d3748; }
          .message { font-size: 16px; margin-bottom: 30px; color: #4a5568; }
          .status-box { background-color: #fef2f2; border: 1px solid #fecaca; padding: 25px; margin: 30px 0; border-radius: 8px; text-align: center; }
          .status-box h3 { margin: 0 0 15px 0; color: #dc2626; font-size: 20px; }
          .reason-box { background-color: #f7fafc; border-left: 4px solid #6b7280; padding: 25px; margin: 30px 0; border-radius: 0 8px 8px 0; }
          .reason-box h3 { margin: 0 0 20px 0; color: #2d3748; font-size: 18px; }
          .next-steps { background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 25px; margin: 30px 0; border-radius: 0 8px 8px 0; }
          .next-steps h3 { margin: 0 0 20px 0; color: #0c4a6e; font-size: 18px; }
          .step-list { margin: 0; padding-left: 20px; }
          .step-list li { margin-bottom: 12px; color: #0c4a6e; }
          .action-buttons { text-align: center; margin: 30px 0; }
          .btn { display: inline-block; padding: 12px 24px; margin: 8px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; }
          .btn-primary { background-color: #0ea5e9; color: white; }
          .btn-secondary { background-color: #6b7280; color: white; }
          .btn-outline { background-color: transparent; color: #0ea5e9; border: 2px solid #0ea5e9; }
          .footer { background-color: #2d3748; color: white; padding: 30px; text-align: center; }
          .footer p { margin: 5px 0; font-size: 14px; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .contact-info { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
          .contact-info p { margin: 5px 0; font-size: 14px; color: #718096; }
          .encouragement { background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; margin: 30px 0; border-radius: 8px; }
          .encouragement h4 { margin: 0 0 10px 0; color: #166534; font-size: 16px; }
          .encouragement p { margin: 0; color: #166534; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🧩 TechTots</div>
            <h1>Application Status Update</h1>
            <p>Thank you for your interest in TechTots</p>
          </div>
          
          <div class="content">
            <div class="greeting">Dear ${supplier.contactPersonName},</div>
            
            <div class="message">
              Thank you for your interest in becoming a supplier with TechTots STEM Store. We appreciate the time and effort you put into your application for <strong>${supplier.companyName}</strong>.
            </div>
            
            <div class="status-box">
              <h3>📋 Application Status: Not Approved</h3>
              <p>After careful review of your application, we regret to inform you that we are unable to approve your supplier application at this time.</p>
            </div>
            
            ${rejectionReason
      ? `
            <div class="reason-box">
              <h3>📝 Review Details</h3>
              <p><strong>Reason for Decision:</strong></p>
              <p style="background-color: white; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; margin: 10px 0; font-style: italic;">
                "${rejectionReason}"
              </p>
            </div>
            `
      : ""
    }
            
            <div class="next-steps">
              <h3>🔄 Next Steps & Future Opportunities</h3>
              <ol class="step-list">
                <li><strong>Review Our Requirements:</strong> Take time to review our supplier requirements and guidelines</li>
                <li><strong>Address Feedback:</strong> Consider the feedback provided and make necessary improvements</li>
                <li><strong>Reapply When Ready:</strong> You may submit a new application after addressing the concerns</li>
                <li><strong>Contact Support:</strong> Reach out to our team if you have questions about the decision</li>
              </ol>
            </div>
            
            <div class="encouragement">
              <h4>💡 We Believe in Your Potential</h4>
              <p>While we cannot approve your application at this time, we encourage you to address the feedback provided and consider reapplying in the future. Many successful suppliers have improved their applications based on our feedback.</p>
            </div>
            
            <div class="action-buttons">
              <a href="${reapplyUrl}" class="btn btn-primary">🔄 Submit New Application</a>
              <a href="mailto:${supportEmail}" class="btn btn-secondary">📧 Contact Support</a>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/supplier" class="btn btn-outline">ℹ️ Learn More</a>
            </div>
            
            <div class="contact-info">
              <p><strong>Questions or Need Clarification?</strong></p>
              <p>📧 Email: ${supportEmail}</p>
              <p>📞 Phone: +1 (555) 123-4567</p>
              <p>🌐 Support Portal: <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/support" style="color: #0ea5e9;">support.techtots.com</a></p>
              <p style="margin-top: 15px; font-size: 13px; color: #9ca3af;">
                <strong>Note:</strong> You can reapply after 30 days from the date of this decision. Please ensure all requirements are met before submitting a new application.
              </p>
            </div>
          </div>
          
          <div class="footer">
            <p>© 2024 TechTots STEM Store. All rights reserved.</p>
            <p>Empowering the next generation through STEM education</p>
          </div>
        </div>
      </body>
      </html>
    `;

  await sendEmailViaUnifiedSystem(
    supplier.contactPersonEmail,
    "Update on Your TechTots Supplier Application",
    htmlContent,
    { forceDirect: true }
  );
}
