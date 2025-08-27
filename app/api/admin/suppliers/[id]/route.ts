import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { resolveAdminUserId } from "@/lib/admin-utils";
import { sendMail } from "@/lib/brevo";

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
    console.log("GET: Looking for supplier with ID:", supplierId);

    if (!supplierId) {
      return NextResponse.json(
        { error: "Supplier ID is required" },
        { status: 400 }
      );
    }

    const supplier = await db.supplier.findUnique({
      where: { id: supplierId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            products: true,
            orders: true,
            invoices: true,
          },
        },
      },
    });

    console.log("Supplier query result:", supplier);

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Get supplier statistics
    const [totalRevenue, totalOrders, recentOrders, productStats] =
      await Promise.all([
        // Total revenue
        db.supplierOrder.aggregate({
          where: {
            supplierId,
            status: { in: ["DELIVERED"] },
          },
          _sum: { supplierRevenue: true },
        }),

        // Total orders
        db.supplierOrder.count({
          where: { supplierId },
        }),

        // Recent orders
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

        // Product statistics
        db.product.groupBy({
          by: ["isActive"],
          where: { supplierId },
          _count: {
            isActive: true,
          },
        }),
      ]);

    // Get recent products
    const recentProducts = await db.product.findMany({
      where: { supplierId },
      select: {
        id: true,
        name: true,
        price: true,
        stockQuantity: true,
        isActive: true,
        createdAt: true,
        images: true,
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const supplierData = {
      ...supplier,
      statistics: {
        totalRevenue: totalRevenue._sum.supplierRevenue || 0,
        totalOrders,
        activeProducts:
          productStats.find(p => p.isActive)?._count.isActive || 0,
        inactiveProducts:
          productStats.find(p => !p.isActive)?._count.isActive || 0,
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
    logger.error("Error retrieving admin supplier details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
      rejectionReason,
      notes,
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

    try {
      const supplier = await db.supplier.update({
        where: { id: supplierId },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      logger.info("Admin supplier updated successfully", {
        adminId: session.user.id,
        supplierId,
        updatedFields: Object.keys(updateData),
      });

      // Send approval email if status was changed to APPROVED
      if (status === "APPROVED") {
        try {
          await sendSupplierApprovalEmail(supplier);
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

      return NextResponse.json({
        success: true,
        message: "Supplier updated successfully",
        supplier,
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

// Function to send supplier approval email
async function sendSupplierApprovalEmail(supplier: any) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/supplier/dashboard`;
  const productsUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/supplier/products`;
  const ordersUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/supplier/orders`;
  const supportEmail = "support@techtots.com";

  await sendMail({
    to: supplier.contactPersonEmail,
    subject:
      "🎉 Congratulations! Your TechTots Supplier Application Has Been Approved!",
    html: `
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
                <li><strong>Access Your Dashboard:</strong> Log in to your supplier portal to manage your account</li>
                <li><strong>Upload Your Products:</strong> Add your STEM educational products to our catalog</li>
                <li><strong>Set Up Payment Information:</strong> Configure your payment details for commission payments</li>
                <li><strong>Review Our Guidelines:</strong> Familiarize yourself with our product and shipping standards</li>
                <li><strong>Start Selling:</strong> Your products will be visible to our customers once approved</li>
              </ol>
            </div>
            
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
    `,
  });
}
