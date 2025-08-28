import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const supplier = await db.supplier.findUnique({
      where: { userId: session.user.id },
      select: { id: true, commissionRate: true },
    });
    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const periodStart = body?.periodStart ? new Date(body.periodStart) : null;
    const periodEnd = body?.periodEnd ? new Date(body.periodEnd) : null;
    if (
      !periodStart ||
      !periodEnd ||
      isNaN(periodStart.getTime()) ||
      isNaN(periodEnd.getTime())
    ) {
      return NextResponse.json(
        { error: "Invalid or missing periodStart/periodEnd" },
        { status: 400 }
      );
    }

    // Fetch supplier orders in the period
    const orders = await db.supplierOrder.findMany({
      where: {
        supplierId: supplier.id,
        createdAt: { gte: periodStart, lte: periodEnd },
        status: {
          in: [
            "CONFIRMED",
            "IN_PRODUCTION",
            "READY_TO_SHIP",
            "SHIPPED",
            "DELIVERED",
          ],
        },
      },
      select: {
        totalPrice: true,
        commission: true,
        supplierRevenue: true,
      },
    });

    const subtotal = Number(
      orders.reduce((s, o) => s + (o.totalPrice || 0), 0).toFixed(2)
    );
    const commission = Number(
      orders.reduce((s, o) => s + (o.commission || 0), 0).toFixed(2)
    );
    const totalAmount = Number(
      orders.reduce((s, o) => s + (o.supplierRevenue || 0), 0).toFixed(2)
    );

    // Generate invoice number (simple format: YYYYMM-<supplier>-<seq>)
    const yyyymm = `${periodStart.getFullYear()}${String(periodStart.getMonth() + 1).padStart(2, "0")}`;
    const existingCount = await db.supplierInvoice.count({
      where: { supplierId: supplier.id, invoiceNumber: { contains: yyyymm } },
    });
    const invoiceNumber = `INV-${yyyymm}-${existingCount + 1}`;

    const invoice = await db.supplierInvoice.create({
      data: {
        supplierId: supplier.id,
        invoiceNumber,
        periodStart,
        periodEnd,
        subtotal,
        commission,
        totalAmount,
        status: "SENT",
        dueDate: new Date(periodEnd.getTime() + 14 * 24 * 60 * 60 * 1000),
      },
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        status: true,
      },
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error("Error generating supplier invoice:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
