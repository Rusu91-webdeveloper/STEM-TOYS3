import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, search } = body;

    // Build where clause for filtering
    const where: any = {};

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { contactPersonName: { contains: search, mode: "insensitive" } },
        { contactPersonEmail: { contains: search, mode: "insensitive" } },
        { vatNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    // Fetch suppliers with related data
    const suppliers = await db.supplier.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate revenue for each supplier
    const suppliersWithRevenue = await Promise.all(
      suppliers.map(async supplier => {
        const revenue = await db.supplierOrder.aggregate({
          where: {
            supplierId: supplier.id,
            status: { in: ["DELIVERED"] },
          },
          _sum: { supplierRevenue: true },
        });

        return {
          ...supplier,
          totalRevenue: revenue._sum.supplierRevenue || 0,
        };
      })
    );

    // Generate CSV content
    const csvHeaders = [
      "Company Name",
      "Company Slug",
      "Contact Person Name",
      "Contact Person Email",
      "Contact Person Phone",
      "Business Address",
      "Business City",
      "Business State",
      "Business Country",
      "Business Postal Code",
      "Phone",
      "VAT Number",
      "Tax ID",
      "Website",
      "Year Established",
      "Employee Count",
      "Annual Revenue",
      "Certifications",
      "Product Categories",
      "Status",
      "Commission Rate (%)",
      "Payment Terms (days)",
      "Minimum Order Value",
      "Approved At",
      "Rejection Reason",
      "Total Products",
      "Total Orders",
      "Total Revenue",
      "User Account Created",
      "User Email",
      "Created At",
      "Updated At",
      // Romanian compliance fields
      "Adresa Sediu",
      "ANPC Approval",
      "Cod Fiscal",
      "CUI",
      "Educational Certification",
      "ISC Approval",
      "Nr Reg Com",
      "Reprezentant Legal",
      "Romanian Bank Account",
      "Romanian Compliance Status",
      "Romanian Currency",
      "Romanian Payment Terms",
      "Romanian VAT Number",
    ];

    const csvRows = suppliersWithRevenue.map(supplier => [
      supplier.companyName,
      supplier.companySlug,
      supplier.contactPersonName,
      supplier.contactPersonEmail,
      supplier.contactPersonPhone,
      supplier.businessAddress,
      supplier.businessCity,
      supplier.businessState,
      supplier.businessCountry,
      supplier.businessPostalCode,
      supplier.phone,
      supplier.vatNumber || "",
      supplier.taxId || "",
      supplier.website || "",
      supplier.yearEstablished?.toString() || "",
      supplier.employeeCount?.toString() || "",
      supplier.annualRevenue || "",
      supplier.certifications.join("; "),
      supplier.productCategories.join("; "),
      supplier.status,
      supplier.commissionRate.toString(),
      supplier.paymentTerms.toString(),
      supplier.minimumOrderValue.toString(),
      supplier.approvedAt ? supplier.approvedAt.toISOString() : "",
      supplier.rejectionReason || "",
      supplier._count.products.toString(),
      supplier._count.orders.toString(),
      supplier.totalRevenue.toString(),
      supplier.user ? "Yes" : "No",
      supplier.user?.email || "",
      supplier.createdAt.toISOString(),
      supplier.updatedAt.toISOString(),
      // Romanian compliance fields
      supplier.adresaSediu || "",
      supplier.anpcApproval ? "Yes" : "No",
      supplier.codFiscal || "",
      supplier.cui || "",
      supplier.educationalCertification || "",
      supplier.iscApproval ? "Yes" : "No",
      supplier.nrRegCom || "",
      supplier.reprezentantLegal || "",
      supplier.romanianBankAccount || "",
      supplier.romanianComplianceStatus,
      supplier.romanianCurrency,
      supplier.romanianPaymentTerms.toString(),
      supplier.romanianVatNumber || "",
    ]);

    // Create CSV content
    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map(row =>
        row
          .map(field => {
            // Escape commas and quotes in CSV fields
            if (
              field.includes(",") ||
              field.includes('"') ||
              field.includes("\n")
            ) {
              return `"${field.replace(/"/g, '""')}"`;
            }
            return field;
          })
          .join(",")
      ),
    ].join("\n");

    logger.info("Supplier export generated successfully", {
      adminId: session.user.id,
      recordCount: suppliersWithRevenue.length,
      filters: { status, search },
    });

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="suppliers-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    logger.error("Error exporting suppliers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
