import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export const GET = async (request: NextRequest) => {
  try {
    // Check authentication
    let session;
    try {
      session = await auth();
    } catch (authError) {
      logger.warn("Auth error in admin suppliers", { error: authError });
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      logger.warn("Unauthorized admin access attempt", {
        path: request.nextUrl.pathname,
        userId: session.user.id,
        userRole: session.user.role,
      });
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { contactPersonName: { contains: search, mode: "insensitive" } },
        { contactPersonEmail: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { vatNumber: { contains: search, mode: "insensitive" } },
        { businessCity: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    // Build order by clause - map sortBy to actual field names
    const orderBy: any = {};
    const sortFieldMap: Record<string, string> = {
      createdAt: "createdAt",
      companyName: "companyName",
      status: "status",
    };
    orderBy[sortFieldMap[sortBy] || "createdAt"] = sortOrder;

    // Fetch suppliers with pagination
    const [suppliers, total] = await Promise.all([
      db.supplier.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: {
              products: true,
              orders: true,
            },
          },
        },
      }),
      db.supplier.count({ where }),
    ]);

    // Get status counts for filters
    const statusCounts = await db.supplier.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    });

    const normalizeStatus = (value?: string | null) => {
      if (!value) return "PENDING";
      if (value === "ACTIVE") return "APPROVED";
      return value;
    };

    const statusCountsMap = statusCounts.reduce((acc, item) => {
      const normalized = normalizeStatus(item.status);
      acc[normalized] = (acc[normalized] || 0) + item._count.status;
      return acc;
    }, {} as Record<string, number>);

    // Transform suppliers to match frontend expectations and calculate revenue
    const suppliersWithRevenue = await Promise.all(
      suppliers.map(async supplier => {
        const revenue = await db.supplierOrder.aggregate({
          where: {
            supplierId: supplier.id,
            status: { in: ["DELIVERED"] },
          },
          _sum: { totalCost: true },
        });

        // Transform database fields to match frontend expectations
        const transformedSupplier = {
          id: supplier.id,
          userId: supplier.userId,
          // Company info - use companyName if available, otherwise fall back to name
          companyName: supplier.companyName || supplier.name,
          companySlug: supplier.companySlug,
          description: supplier.description,
          website: supplier.website,
          phone: supplier.phone,
          email: supplier.email,

          // Contact person - use detailed fields if available, otherwise fall back to basic
          contactPersonName:
            supplier.contactPersonName || supplier.contactPerson,
          contactPersonEmail: supplier.contactPersonEmail,
          contactPersonPhone: supplier.contactPersonPhone,

          // Business address
          businessAddress: supplier.businessAddress,
          businessCity: supplier.businessCity,
          businessState: supplier.businessState,
          businessCountry: supplier.businessCountry || "Romania",
          businessPostalCode: supplier.businessPostalCode,

          // Legal info
          vatNumber: supplier.vatNumber,
          taxId: supplier.taxId,
          cui: supplier.cui,
          codFiscal: supplier.codFiscal,
          nrRegCom: supplier.nrRegCom,
          reprezentantLegal: supplier.reprezentantLegal,

          // Business details
          yearEstablished: supplier.yearEstablished,
          employeeCount: supplier.employeeCount,
          annualRevenue: supplier.annualRevenue,
          certifications: supplier.certifications,
          productCategories: supplier.productCategories,

          // Status and approval
          isActive: supplier.isActive,
          status: normalizeStatus(supplier.status),
          approvedAt: supplier.approvedAt,
          approvedBy: supplier.approvedBy,
          rejectionReason: supplier.rejectionReason,

          // Financial terms
          commissionRate: supplier.commissionRate,
          paymentTerms: supplier.paymentTerms,
          minimumOrderValue: supplier.minimumOrderValue,

          // Romanian compliance
          adresaSediu: supplier.adresaSediu,
          anpcApproval: supplier.anpcApproval,
          educationalCertification: supplier.educationalCertification,
          iscApproval: supplier.iscApproval,
          romanianBankAccount: supplier.romanianBankAccount,
          romanianComplianceStatus: supplier.romanianComplianceStatus,
          romanianCurrency: supplier.romanianCurrency,
          romanianPaymentTerms: supplier.romanianPaymentTerms,
          romanianVatNumber: supplier.romanianVatNumber,

          // API integration
          apiEndpoint: supplier.apiEndpoint,
          apiKey: supplier.apiKey,
          trackingUrl: supplier.trackingUrl,
          averageDeliveryDays: supplier.averageDeliveryDays,

          // Files and media
          logo: supplier.logo,
          catalogUrl: supplier.catalogUrl,
          termsAccepted: supplier.termsAccepted,
          privacyAccepted: supplier.privacyAccepted,

          // Timestamps
          createdAt: supplier.createdAt,
          updatedAt: supplier.updatedAt,

          // Counts
          _count: supplier._count,

          // Revenue
          totalRevenue: revenue._sum.totalCost || 0,
        };

        return transformedSupplier;
      })
    );

    const response = {
      suppliers: suppliersWithRevenue,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        statusCounts: statusCountsMap,
      },
    };

    logger.info("Admin suppliers list retrieved successfully", {
      adminId: session.user.id,
      totalSuppliers: total,
      page,
      limit,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error retrieving admin suppliers list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const POST = async (request: NextRequest) => {
  try {
    // Check authentication
    let session;
    try {
      session = await auth();
    } catch (authError) {
      logger.warn("Auth error in admin suppliers POST", { error: authError });
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      logger.warn("Unauthorized admin access attempt", {
        path: request.nextUrl.pathname,
        userId: session.user.id,
        userRole: session.user.role,
      });
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, supplierId, ...data } = body;

    if (!action || !supplierId) {
      return NextResponse.json(
        { error: "Action and supplierId are required" },
        { status: 400 }
      );
    }

    // Verify supplier exists
    const existingSupplier = await db.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!existingSupplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    let supplier;
    let logMessage;

    switch (action) {
      case "approve":
        supplier = await db.supplier.update({
          where: { id: supplierId },
          data: {
            status: "APPROVED",
            approvedAt: new Date(),
            approvedBy: session.user.id,
            rejectionReason: null,
          },
        });
        logMessage = "Supplier approved";
        break;

      case "reject":
        supplier = await db.supplier.update({
          where: { id: supplierId },
          data: {
            status: "REJECTED",
            rejectionReason: data.rejectionReason || "Application rejected",
          },
        });
        logMessage = "Supplier rejected";
        break;

      case "suspend":
        supplier = await db.supplier.update({
          where: { id: supplierId },
          data: {
            status: "SUSPENDED",
            rejectionReason: data.suspensionReason || "Account suspended",
          },
        });
        logMessage = "Supplier suspended";
        break;

      case "update":
        const updateData: any = {};
        if (data.commissionRate !== undefined)
          updateData.commissionRate = data.commissionRate;
        if (data.paymentTerms !== undefined)
          updateData.paymentTerms = data.paymentTerms;
        if (data.minimumOrderValue !== undefined)
          updateData.minimumOrderValue = data.minimumOrderValue;
        if (data.status !== undefined) updateData.status = data.status;

        supplier = await db.supplier.update({
          where: { id: supplierId },
          data: updateData,
        });
        logMessage = "Supplier updated";
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    logger.info(logMessage, {
      adminId: session.user.id,
      supplierId,
      action,
      supplierName: supplier?.companyName || supplier?.name,
    });

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
      status: supplier.status,
      approvedAt: supplier.approvedAt,
      approvedBy: supplier.approvedBy,
      rejectionReason: supplier.rejectionReason,
      commissionRate: supplier.commissionRate,
      paymentTerms: supplier.paymentTerms,
      minimumOrderValue: supplier.minimumOrderValue,
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
      message: logMessage,
      supplier: transformedSupplier,
    });
  } catch (error) {
    logger.error("Error in admin supplier action:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
