import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

// GET - Get specific supplier invoice
export const GET = withRateLimit(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await params;
      const session = await auth();
      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }

      const invoice = await db.supplierInvoice.findUnique({
        where: { id },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
              isActive: true,
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

      return NextResponse.json(invoice);
    } catch (error) {
      console.error("Error fetching supplier invoice:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  },
  {
    windowMs: 15 * 60 * 1000,
    limit: 100,
  }
);

// PUT - Update supplier invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      periodStart,
      periodEnd,
      subtotal,
      commission,
      status,
      dueDate,
      notes,
      paymentMethod,
    } = body;

    // Check if invoice exists
    const existingInvoice = await db.supplierInvoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Calculate total amount
    const newSubtotal =
      subtotal !== undefined ? subtotal : existingInvoice.subtotal;
    const newCommission =
      commission !== undefined ? commission : existingInvoice.commission;
    const totalAmount = newSubtotal - newCommission;

    // Update invoice
    const updateData: any = {};
    if (periodStart !== undefined)
      updateData.periodStart = new Date(periodStart);
    if (periodEnd !== undefined) updateData.periodEnd = new Date(periodEnd);
    if (subtotal !== undefined) updateData.subtotal = subtotal;
    if (commission !== undefined) updateData.commission = commission;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (notes !== undefined) updateData.notes = notes;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;

    updateData.totalAmount = totalAmount;

    // If marking as paid, set paidAt
    if (status === "PAID" && existingInvoice.status !== "PAID") {
      updateData.paidAt = new Date();
    } else if (status !== "PAID" && existingInvoice.status === "PAID") {
      updateData.paidAt = null;
    }

    const invoice = await db.supplierInvoice.update({
      where: { id },
      data: updateData,
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
    console.error("Error updating supplier invoice:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete supplier invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Check if invoice exists
    const invoice = await db.supplierInvoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Only allow deletion of DRAFT invoices
    if (invoice.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft invoices can be deleted" },
        { status: 400 }
      );
    }

    await db.supplierInvoice.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting supplier invoice:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
