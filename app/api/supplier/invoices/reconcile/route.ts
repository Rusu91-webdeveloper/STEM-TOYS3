import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Manually reconcile an invoice with supplier orders
 * POST /api/supplier/invoices/reconcile
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();
    const { invoiceId, supplierOrderIds, notes } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { error: "invoiceId is required" },
        { status: 400 }
      );
    }

    const invoice = await db.receivedSupplierInvoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // If supplierOrderIds provided, link specific orders
    if (supplierOrderIds && Array.isArray(supplierOrderIds)) {
      // Remove existing links
      await db.receivedInvoiceOrder.deleteMany({
        where: { receivedInvoiceId: invoiceId },
      });

      // Get supplier orders
      const orders = await db.supplierOrder.findMany({
        where: {
          id: { in: supplierOrderIds },
          supplierId: invoice.supplierId,
        },
      });

      // Create new links
      if (orders.length > 0) {
        await db.receivedInvoiceOrder.createMany({
          data: orders.map(order => ({
            receivedInvoiceId: invoiceId,
            supplierOrderId: order.id,
            expectedAmount: order.totalCost,
            actualAmount: order.totalCost,
            discrepancy: 0,
          })),
        });

        // Calculate expected total
        const expectedTotal = orders.reduce((sum, order) => sum + order.totalCost, 0);
        const discrepancy = invoice.totalAmount - expectedTotal;

        // Update invoice
        await db.receivedSupplierInvoice.update({
          where: { id: invoiceId },
          data: {
            reconciliationStatus: Math.abs(discrepancy) > 0.01 ? "DISCREPANCY" : "MATCHED",
            discrepancies: Math.abs(discrepancy) > 0.01
              ? {
                  type: "AMOUNT_MISMATCH",
                  expected: expectedTotal,
                  actual: invoice.totalAmount,
                  difference: discrepancy,
                }
              : null,
            notes: notes || invoice.notes,
            reconciledAt: new Date(),
            reconciledBy: session.user.id,
          },
        });
      }
    } else {
      // Mark as resolved without linking orders
      await db.receivedSupplierInvoice.update({
        where: { id: invoiceId },
        data: {
          reconciliationStatus: "RESOLVED",
          notes: notes || invoice.notes,
          reconciledAt: new Date(),
          reconciledBy: session.user.id,
        },
      });
    }

    const updatedInvoice = await db.receivedSupplierInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        linkedOrders: {
          include: {
            supplierOrder: {
              include: {
                order: {
                  select: {
                    orderNumber: true,
                  },
                },
                product: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error("Error reconciling invoice:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reconcile invoice" },
      { status: 500 }
    );
  }
}

/**
 * Get invoice reconciliation details
 * GET /api/supplier/invoices/reconcile?invoiceId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoiceId");

    if (!invoiceId) {
      return NextResponse.json(
        { error: "invoiceId is required" },
        { status: 400 }
      );
    }

    const invoice = await db.receivedSupplierInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        linkedOrders: {
          include: {
            supplierOrder: {
              include: {
                order: {
                  select: {
                    orderNumber: true,
                    createdAt: true,
                  },
                },
                product: {
                  select: {
                    name: true,
                    sku: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Get potential matching orders
    const dateRangeStart = new Date(invoice.invoiceDate);
    dateRangeStart.setDate(dateRangeStart.getDate() - 7);
    const dateRangeEnd = new Date(invoice.invoiceDate);
    dateRangeEnd.setDate(dateRangeEnd.getDate() + 7);

    const potentialOrders = await db.supplierOrder.findMany({
      where: {
        supplierId: invoice.supplierId,
        createdAt: {
          gte: dateRangeStart,
          lte: dateRangeEnd,
        },
        status: {
          in: ["CONFIRMED", "IN_PRODUCTION", "READY_TO_SHIP", "SHIPPED", "DELIVERED"],
        },
        receivedInvoiceLinks: {
          none: {}, // Not already linked to another invoice
        },
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            createdAt: true,
          },
        },
        product: {
          select: {
            name: true,
            sku: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      invoice,
      potentialOrders,
    });
  } catch (error) {
    console.error("Error fetching reconciliation details:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch reconciliation details" },
      { status: 500 }
    );
  }
}
