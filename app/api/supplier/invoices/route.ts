import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get supplier
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

    // Get invoices for this supplier
    const invoices = await db.supplierInvoice.findMany({
      where: { supplierId: supplier.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    // Transform invoices for frontend
    const transformedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      periodStart: invoice.periodStart.toISOString(),
      periodEnd: invoice.periodEnd.toISOString(),
      subtotal: invoice.subtotal,
      commission: invoice.commission,
      totalAmount: invoice.totalAmount,
      status: invoice.status,
      dueDate: invoice.dueDate.toISOString(),
      paidAt: invoice.paidAt?.toISOString(),
      notes: invoice.notes,
      createdAt: invoice.createdAt.toISOString(),
      orderCount: invoice._count.orders,
      totalOrdersValue: invoice.subtotal, // Assuming subtotal is the orders value
    }));

    // Calculate stats
    const stats = {
      totalInvoices: invoices.length,
      totalSubtotal: invoices.reduce((sum, inv) => sum + inv.subtotal, 0),
      totalCommission: invoices.reduce((sum, inv) => sum + inv.commission, 0),
      totalAmount: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
    };

    logger.info("Supplier invoices retrieved", {
      supplierId: supplier.id,
      userId: session.user.id,
      invoiceCount: invoices.length,
    });

    return NextResponse.json({
      invoices: transformedInvoices,
      stats,
    });
  } catch (error) {
    logger.error("Error retrieving supplier invoices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
