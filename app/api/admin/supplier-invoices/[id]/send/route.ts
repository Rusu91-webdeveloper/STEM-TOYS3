import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST - Send invoice to supplier
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "PAID") {
      return NextResponse.json(
        { error: "Cannot send paid invoice" },
        { status: 400 }
      );
    }

    // Update invoice status to SENT
    const updatedInvoice = await db.supplierInvoice.update({
      where: { id },
      data: { status: "SENT" },
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

    // TODO: Send email notification to supplier
    // This would integrate with your email service
    console.log(
      `Invoice ${invoice.invoiceNumber} sent to ${invoice.supplier.email}`
    );

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
      message: "Invoice sent successfully",
    });
  } catch (error) {
    console.error("Error sending supplier invoice:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
