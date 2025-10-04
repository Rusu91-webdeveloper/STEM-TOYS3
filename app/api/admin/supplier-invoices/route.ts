import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

// GET - List all supplier invoices with filtering and pagination
export const GET = withRateLimit(
  async (request: NextRequest) => {
    try {
      const session = await auth();
      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }

      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "20");
      const status = searchParams.get("status") || "";
      const supplierId = searchParams.get("supplierId") || "";
      const periodStart = searchParams.get("periodStart");
      const periodEnd = searchParams.get("periodEnd");
      const search = searchParams.get("search") || "";
      const sortBy = searchParams.get("sortBy") || "createdAt";
      const sortOrder = searchParams.get("sortOrder") || "desc";

      // Build where clause
      const where: any = {};

      if (status && status !== "all") {
        where.status = status;
      }

      if (supplierId) {
        where.supplierId = supplierId;
      }

      if (periodStart || periodEnd) {
        where.createdAt = {};
        if (periodStart) where.createdAt.gte = new Date(periodStart);
        if (periodEnd) where.createdAt.lte = new Date(periodEnd);
      }

      if (search) {
        where.OR = [
          { invoiceNumber: { contains: search, mode: "insensitive" } },
          { supplier: { name: { contains: search, mode: "insensitive" } } },
        ];
      }

      // Build orderBy clause
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      const [invoices, total, stats] = await Promise.all([
        // Get invoices with supplier info
        db.supplierInvoice.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy,
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
                email: true,
                isActive: true,
              },
            },
          },
        }),

        // Get total count
        db.supplierInvoice.count({ where }),

        // Get summary stats
        db.supplierInvoice.aggregate({
          where: status ? { ...where, status } : where,
          _sum: {
            subtotal: true,
            commission: true,
            totalAmount: true,
          },
          _count: {
            id: true,
          },
        }),
      ]);

      const pages = Math.ceil(total / limit);

      return NextResponse.json({
        invoices,
        pagination: {
          page,
          limit,
          total,
          pages,
        },
        stats: {
          totalInvoices: stats._count.id,
          totalSubtotal: stats._sum.subtotal || 0,
          totalCommission: stats._sum.commission || 0,
          totalAmount: stats._sum.totalAmount || 0,
        },
      });
    } catch (error) {
      console.error("Error fetching supplier invoices:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  },
  {
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // 100 requests per window
  }
);

// POST - Create new supplier invoice
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      supplierId,
      periodStart,
      periodEnd,
      subtotal,
      commission,
      notes,
      dueDate,
    } = body;

    // Validate required fields
    if (!supplierId || !periodStart || !periodEnd || subtotal === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if supplier exists
    const supplier = await db.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true, name: true },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Generate invoice number
    const invoiceCount = await db.supplierInvoice.count({
      where: {
        supplierId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), 0, 1), // This year
        },
      },
    });

    const invoiceNumber = `INV-${supplier.name
      .replace(/\s+/g, "")
      .toUpperCase()
      .substring(0, 6)}-${new Date().getFullYear()}-${String(
      invoiceCount + 1
    ).padStart(4, "0")}`;

    const totalAmount = subtotal - (commission || 0);

    // Create invoice
    const invoice = await db.supplierInvoice.create({
      data: {
        supplierId,
        invoiceNumber,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        subtotal,
        commission: commission || 0,
        totalAmount,
        status: "DRAFT",
        dueDate: dueDate
          ? new Date(dueDate)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        notes,
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error("Error creating supplier invoice:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
