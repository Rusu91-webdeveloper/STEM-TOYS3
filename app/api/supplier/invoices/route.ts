import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const supplier = await db.supplier.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    const sp = request.nextUrl.searchParams;
    const page = parseInt(sp.get("page") || "1");
    const limit = parseInt(sp.get("limit") || "10");
    const status = sp.get("status") || ""; // DRAFT|SENT|PAID|OVERDUE|CANCELLED
    const periodStart = sp.get("periodStart");
    const periodEnd = sp.get("periodEnd");
    const search = sp.get("search") || ""; // invoiceNumber

    const where: any = { supplierId: supplier.id };
    if (status) where.status = status;
    if (periodStart || periodEnd) {
      where.createdAt = {} as any;
      if (periodStart) (where.createdAt as any).gte = new Date(periodStart);
      if (periodEnd) (where.createdAt as any).lte = new Date(periodEnd);
    }
    if (search) {
      where.invoiceNumber = { contains: search, mode: "insensitive" };
    }

    const [invoices, total] = await Promise.all([
      db.supplierInvoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          invoiceNumber: true,
          periodStart: true,
          periodEnd: true,
          subtotal: true,
          commission: true,
          totalAmount: true,
          status: true,
          dueDate: true,
          paidAt: true,
          createdAt: true,
        },
      }),
      db.supplierInvoice.count({ where }),
    ]);

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching supplier invoices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
