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

    // Get payment records for this supplier
    const payments = await db.supplierPayment.findMany({
      where: { supplierId: supplier.id },
      orderBy: { createdAt: "desc" },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
          },
        },
      },
    });

    // Transform payments for frontend
    const transformedPayments = payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      invoiceId: payment.invoice?.id,
      invoiceNumber: payment.invoice?.invoiceNumber,
      notes: payment.notes,
      processedAt: payment.processedAt?.toISOString(),
      completedAt: payment.completedAt?.toISOString(),
      createdAt: payment.createdAt.toISOString(),
      fee: payment.fee,
    }));

    // Calculate stats
    const completedPayments = payments.filter(p => p.status === "COMPLETED");
    const pendingPayments = payments.filter(
      p => p.status === "PENDING" || p.status === "PROCESSING"
    );

    const stats = {
      totalPaid: completedPayments.reduce((sum, p) => sum + p.amount, 0),
      totalPending: pendingPayments.reduce((sum, p) => sum + p.amount, 0),
      totalFees: payments.reduce((sum, p) => sum + (p.fee || 0), 0),
      averagePaymentTime: 14, // Placeholder - would calculate from actual data
      paymentCount: completedPayments.length,
      currentBalance: 0, // Placeholder - would calculate from pending commissions
    };

    logger.info("Supplier payments retrieved", {
      supplierId: supplier.id,
      userId: session.user.id,
      paymentCount: payments.length,
    });

    return NextResponse.json({
      payments: transformedPayments,
      stats,
    });
  } catch (error) {
    logger.error("Error retrieving supplier payments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
