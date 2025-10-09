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
            supplierOrders: true,
          },
        },
      },
    });

    logger.info("Supplier invoices retrieved", {
      supplierId: supplier.id,
      userId: session.user.id,
      invoiceCount: invoices.length,
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
      orderCount: invoice._count.supplierOrders,
      totalOrdersValue: invoice.subtotal, // Assuming subtotal is the orders value
    }));

    // Calculate stats
    const paidInvoices = invoices.filter(inv => inv.status === "PAID");
    const pendingInvoices = invoices.filter(
      inv => inv.status === "SENT" || inv.status === "DRAFT"
    );
    const overdueInvoices = invoices.filter(inv => inv.status === "OVERDUE");

    // Calculate average payment time for paid invoices
    const paymentTimes = paidInvoices
      .filter(inv => inv.paidAt)
      .map(inv => {
        const created = new Date(inv.createdAt).getTime();
        const paid = new Date(inv.paidAt!).getTime();
        return Math.round((paid - created) / (1000 * 60 * 60 * 24)); // days
      });

    const averagePaymentTime =
      paymentTimes.length > 0
        ? Math.round(
            paymentTimes.reduce((sum, time) => sum + time, 0) /
              paymentTimes.length
          )
        : 0;

    const stats = {
      totalInvoices: invoices.length,
      totalPaid: paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      totalPending: pendingInvoices.reduce(
        (sum, inv) => sum + inv.totalAmount,
        0
      ),
      totalOverdue: overdueInvoices.reduce(
        (sum, inv) => sum + inv.totalAmount,
        0
      ),
      averagePaymentTime,
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
