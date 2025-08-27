import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { supplierRegistrationSchema } from "@/features/supplier/lib/supplier-validation";
import { sendMail } from "@/lib/brevo";

export const POST = async (request: NextRequest) => {
  try {
    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

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

    // Generate company slug from company name
    const companySlug = data.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Check if company slug is unique
    const existingSlug = await db.supplier.findUnique({
      where: { companySlug },
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

    // Check if contact email is already registered
    const existingEmail = await db.supplier.findFirst({
      where: { contactPersonEmail: data.contactPersonEmail },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "Contact email already registered" },
        { status: 409 }
      );
    }

    // Create supplier profile (without userId for public registration)
    const supplier = await db.supplier.create({
      data: {
        companyName: data.companyName,
        companySlug,
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
        termsAccepted: data.termsAccepted,
        privacyAccepted: data.privacyAccepted,
        status: "PENDING", // Default status
        commissionRate: 15.0, // Default commission rate
        paymentTerms: 30, // Default payment terms (Net 30)
        minimumOrderValue: 0, // Default minimum order value
      },
    });

    logger.info("Public supplier registration successful", {
      supplierId: supplier.id,
      companyName: data.companyName,
    });

    // Send confirmation email to supplier
    try {
      await sendMail({
        to: data.contactPersonEmail,
        subject: "Your supplier application has been received! 📋",
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Supplier Application Confirmation</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
              .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
              .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
              .content { padding: 40px 30px; }
              .greeting { font-size: 18px; margin-bottom: 20px; color: #2d3748; }
              .message { font-size: 16px; margin-bottom: 30px; color: #4a5568; }
              .steps-box { background-color: #f7fafc; border-left: 4px solid #667eea; padding: 25px; margin: 30px 0; border-radius: 0 8px 8px 0; }
              .steps-box h3 { margin: 0 0 15px 0; color: #2d3748; font-size: 18px; }
              .steps-list { margin: 0; padding-left: 20px; }
              .steps-list li { margin-bottom: 8px; color: #4a5568; }
              .reference-box { background-color: #e6fffa; border: 1px solid #81e6d9; padding: 20px; margin: 30px 0; border-radius: 8px; text-align: center; }
              .reference-number { font-size: 20px; font-weight: bold; color: #2c7a7b; margin: 10px 0; }
              .footer { background-color: #2d3748; color: white; padding: 30px; text-align: center; }
              .footer p { margin: 5px 0; font-size: 14px; }
              .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
              .contact-info { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
              .contact-info p { margin: 5px 0; font-size: 14px; color: #718096; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🧩 TechTots</div>
                <h1>Your supplier application has been received! 📋</h1>
                <p>STEM Toys & Educational Products</p>
              </div>
              
              <div class="content">
                <div class="greeting">Hello ${data.contactPersonName},</div>
                
                <div class="message">
                  Thank you for registering with TechTots! We have received your application for <strong>${data.companyName}</strong> and are excited to review the opportunity for collaboration.
                </div>
                
                <div class="steps-box">
                  <h3>🔄 Next steps in the approval process:</h3>
                  <ul class="steps-list">
                    <li><strong>Application review:</strong> We will analyze the information provided within 2-3 business days</li>
                    <li><strong>Final decision:</strong> You will receive an email with our approval or rejection decision</li>
                    <li><strong>Onboarding:</strong> If approved, you will be guided through the product upload process</li>
                    <li><strong>Ongoing support:</strong> We will be in touch for any questions or assistance</li>
                  </ul>
                </div>
                
                <div class="reference-box">
                  <div><strong>Your application reference number:</strong></div>
                  <div class="reference-number">${supplier.id}</div>
                  <div style="font-size: 14px; color: #718096;">Keep this number for reference</div>
                </div>
                
                <div class="message">
                  We are dedicated to building a strong community of suppliers who share our passion for STEM education. We look forward to collaborating with you!
                </div>
                
                <div class="contact-info">
                  <p><strong>Best regards,</strong></p>
                  <p>The TechTots Team</p>
                  <p>📧 contact@techtots.com</p>
                  <p>🌐 www.techtots.com</p>
                </div>
              </div>
              
              <div class="footer">
                <p>© 2024 TechTots STEM Store. All rights reserved.</p>
                <p>Romania</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      logger.info("Supplier confirmation email sent", {
        supplierId: supplier.id,
        email: data.contactPersonEmail,
      });
    } catch (emailError) {
      logger.error("Failed to send supplier confirmation email", {
        supplierId: supplier.id,
        email: data.contactPersonEmail,
        error: emailError,
      });
      // Don't fail the registration if email fails
    }

    // Send notification email to admin
    try {
      const adminEmail = "webira.rem.srl@gmail.com";
      await sendMail({
        to: adminEmail,
        subject: "Nouă aplicație de furnizor! 🆕",
        html: `
          <!DOCTYPE html>
          <html lang="ro">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Notificare Aplicație Furnizor</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
              .container { max-width: 700px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
              .header { background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%); color: white; padding: 40px 30px; text-align: center; }
              .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
              .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
              .content { padding: 40px 30px; }
              .alert-box { background-color: #fed7d7; border: 1px solid #feb2b2; padding: 25px; margin: 30px 0; border-radius: 8px; }
              .alert-box h3 { margin: 0 0 15px 0; color: #c53030; font-size: 18px; }
              .supplier-details { background-color: #f7fafc; border: 1px solid #e2e8f0; padding: 25px; margin: 30px 0; border-radius: 8px; }
              .supplier-details h3 { margin: 0 0 20px 0; color: #2d3748; font-size: 18px; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
              .detail-row { display: flex; margin-bottom: 12px; }
              .detail-label { font-weight: bold; color: #4a5568; min-width: 150px; }
              .detail-value { color: #2d3748; }
              .action-box { background-color: #e6fffa; border: 1px solid #81e6d9; padding: 25px; margin: 30px 0; border-radius: 8px; text-align: center; }
              .action-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px; }
              .footer { background-color: #2d3748; color: white; padding: 30px; text-align: center; }
              .footer p { margin: 5px 0; font-size: 14px; }
              .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
              .priority-badge { background-color: #e53e3e; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; display: inline-block; margin-bottom: 15px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🧩 TechTots Admin</div>
                <h1>Nouă aplicație de furnizor! 🆕</h1>
                <p>Portal de Administrare Furnizori</p>
              </div>
              
              <div class="content">
                <div class="priority-badge">⚠️ ACȚIUNE NECESARĂ</div>
                
                <div class="alert-box">
                  <h3>🔔 Notificare Importantă</h3>
                  <p>O nouă aplicație de furnizor a fost trimisă la TechTots și necesită revizuirea ta. Vă rugăm să analizezi informațiile furnizate și să iei o decizie în cel mai scurt timp.</p>
                </div>
                
                <div class="supplier-details">
                  <h3>📋 Detalii Furnizor</h3>
                  <div class="detail-row">
                    <span class="detail-label">🏢 Companie:</span>
                    <span class="detail-value">${data.companyName}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">👤 Persoană de contact:</span>
                    <span class="detail-value">${data.contactPersonName}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">📧 Email:</span>
                    <span class="detail-value">${data.contactPersonEmail}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">📞 Telefon:</span>
                    <span class="detail-value">${data.contactPersonPhone}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">📍 Adresă:</span>
                    <span class="detail-value">${data.businessAddress}, ${data.businessCity}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">🏷️ Categorii produse:</span>
                    <span class="detail-value">${data.productCategories.join(", ")}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">🆔 ID Furnizor:</span>
                    <span class="detail-value"><strong>${supplier.id}</strong></span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">🔗 Slug:</span>
                    <span class="detail-value"><strong>${companySlug}</strong></span>
                  </div>
                </div>
                
                <div class="action-box">
                  <h3>⚡ Acțiune Rapidă</h3>
                  <p>Vă rugăm să revizuiți aplicația furnizorului și să luați o decizie rapidă pentru a vă asigura că aceasta este o oportunitate de valoare pentru TechTots.</p>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/suppliers" class="action-button">👁️ Vezi Aplicația</a>
                </div>
                
                <div style="margin-top: 30px; padding: 20px; background-color: #f7fafc; border-radius: 8px;">
                  <h4 style="margin: 0 0 15px 0; color: #2d3748;">📊 Criterii de evaluare:</h4>
                  <ul style="margin: 0; padding-left: 20px; color: #4a5568;">
                    <li>Calitatea produselor și alinierea cu misiunea STEM</li>
                    <li>Experiența companiei în domeniul educațional</li>
                    <li>Capacitatea de livrare și servicii post-vânzare</li>
                    <li>Potrivirea cu publicul țintă al TechTots</li>
                  </ul>
                </div>
              </div>
              
              <div class="footer">
                <p>© 2024 TechTots STEM Store. Portal de Administrare.</p>
                <p>România</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      logger.info("Admin notification email sent", {
        supplierId: supplier.id,
        adminEmail,
      });
    } catch (emailError) {
      logger.error("Failed to send admin notification email", {
        supplierId: supplier.id,
        adminEmail: "webira.rem.srl@gmail.com",
        error: emailError,
      });
      // Don't fail the registration if email fails
    }

    // Return supplier data without sensitive information
    const responseData = {
      id: supplier.id,
      companyName: supplier.companyName,
      companySlug: supplier.companySlug,
      status: supplier.status,
      createdAt: supplier.createdAt,
      message:
        "Registration submitted successfully! We'll review your application and contact you within 2-3 business days.",
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    logger.error("Error in public supplier registration:", error);

    // Log the full error details
    console.error("Full error details:", error);

    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
