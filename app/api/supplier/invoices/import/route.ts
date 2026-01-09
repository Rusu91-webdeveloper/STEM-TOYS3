import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Import invoice from supplier (e.g., KidStory)
 * Accepts invoice data and PDF upload
 * POST /api/supplier/invoices/import
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      supplierId,
      invoiceNumber,
      invoiceDate,
      dueDate,
      disputeDeadline,
      totalAmount,
      currency = "RON",
      pdfUrl,
      xmlData,
      notes,
    } = body;

    // Validate required fields
    if (!supplierId || !invoiceNumber || !invoiceDate || !totalAmount) {
      return NextResponse.json(
        { error: "Missing required fields: supplierId, invoiceNumber, invoiceDate, totalAmount" },
        { status: 400 }
      );
    }

    // Check if invoice already exists
    const existing = await db.receivedSupplierInvoice.findUnique({
      where: { invoiceNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Invoice with this number already exists", invoiceId: existing.id },
        { status: 409 }
      );
    }

    // Parse dates
    const parsedInvoiceDate = new Date(invoiceDate);
    const parsedDueDate = dueDate ? new Date(dueDate) : new Date(parsedInvoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000); // Default 30 days
    const parsedDisputeDeadline = disputeDeadline 
      ? new Date(disputeDeadline) 
      : new Date(parsedInvoiceDate.getTime() + 7 * 24 * 60 * 60 * 1000); // Default 7 days for KidStory

    // Create invoice
    const invoice = await db.receivedSupplierInvoice.create({
      data: {
        supplierId,
        invoiceNumber,
        invoiceDate: parsedInvoiceDate,
        dueDate: parsedDueDate,
        disputeDeadline: parsedDisputeDeadline,
        totalAmount: parseFloat(totalAmount.toString()),
        currency,
        pdfUrl: pdfUrl || null,
        xmlData: xmlData || null,
        notes: notes || null,
        status: "PENDING",
        reconciliationStatus: "PENDING",
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

    // Attempt automatic reconciliation
    await attemptAutoReconciliation(invoice.id);

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
        status: invoice.status,
        reconciliationStatus: invoice.reconciliationStatus,
      },
    });
  } catch (error) {
    console.error("Error importing invoice:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import invoice" },
      { status: 500 }
    );
  }
}

/**
 * Attempt automatic reconciliation by matching invoice to supplier orders
 */
async function attemptAutoReconciliation(invoiceId: string) {
  try {
    const invoice = await db.receivedSupplierInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        supplier: true,
      },
    });

    if (!invoice) return;

    // Find supplier orders in the invoice date range (within 7 days before/after)
    const dateRangeStart = new Date(invoice.invoiceDate);
    dateRangeStart.setDate(dateRangeStart.getDate() - 7);
    const dateRangeEnd = new Date(invoice.invoiceDate);
    dateRangeEnd.setDate(dateRangeEnd.getDate() + 7);

    const supplierOrders = await db.supplierOrder.findMany({
      where: {
        supplierId: invoice.supplierId,
        createdAt: {
          gte: dateRangeStart,
          lte: dateRangeEnd,
        },
        status: {
          in: ["CONFIRMED", "IN_PRODUCTION", "READY_TO_SHIP", "SHIPPED", "DELIVERED"],
        },
      },
    });

    // Calculate expected total
    const expectedTotal = supplierOrders.reduce((sum, order) => sum + order.totalCost, 0);

    // Check for discrepancies
    const discrepancy = invoice.totalAmount - expectedTotal;
    const hasDiscrepancy = Math.abs(discrepancy) > 0.01; // Allow 0.01 RON tolerance

    // Link orders to invoice
    if (supplierOrders.length > 0) {
      await db.receivedInvoiceOrder.createMany({
        data: supplierOrders.map(order => ({
          receivedInvoiceId: invoice.id,
          supplierOrderId: order.id,
          expectedAmount: order.totalCost,
          actualAmount: order.totalCost, // Will be updated if invoice has line items
          discrepancy: 0,
        })),
        skipDuplicates: true,
      });
    }

    // Update reconciliation status
    await db.receivedSupplierInvoice.update({
      where: { id: invoiceId },
      data: {
        reconciliationStatus: hasDiscrepancy ? "DISCREPANCY" : "MATCHED",
        discrepancies: hasDiscrepancy
          ? {
              type: "AMOUNT_MISMATCH",
              expected: expectedTotal,
              actual: invoice.totalAmount,
              difference: discrepancy,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error in auto-reconciliation:", error);
    await db.receivedSupplierInvoice.update({
      where: { id: invoiceId },
      data: {
        reconciliationStatus: "FAILED",
        notes: `Auto-reconciliation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
    });
  }
}
