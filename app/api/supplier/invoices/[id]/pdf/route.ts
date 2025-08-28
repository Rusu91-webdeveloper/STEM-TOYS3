import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const supplier = await db.supplier.findUnique({
      where: { userId: session.user.id },
      select: { id: true, companyName: true },
    });
    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    const invoice = await db.supplierInvoice.findFirst({
      where: { id, supplierId: supplier.id },
      include: {
        orders: {
          select: {
            id: true,
            productId: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            commission: true,
            supplierRevenue: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const drawText = (text: string, x: number, y: number, size = 12) => {
      page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });
    };

    let cursorY = height - 50;
    drawText(`Invoice ${invoice.invoiceNumber}`, 50, cursorY, 18);
    cursorY -= 24;
    drawText(`Supplier: ${supplier.companyName}`, 50, cursorY);
    cursorY -= 16;
    drawText(
      `Period: ${new Date(invoice.periodStart).toLocaleDateString()} - ${new Date(invoice.periodEnd).toLocaleDateString()}`,
      50,
      cursorY
    );
    cursorY -= 16;
    drawText(`Status: ${invoice.status}`, 50, cursorY);
    cursorY -= 24;

    drawText(`Lines:`, 50, cursorY);
    cursorY -= 16;
    drawText(`Qty`, 50, cursorY);
    drawText(`Unit`, 100, cursorY);
    drawText(`Total`, 160, cursorY);
    drawText(`Commission`, 220, cursorY);
    drawText(`Revenue`, 310, cursorY);
    cursorY -= 14;

    invoice.orders.forEach(line => {
      drawText(String(line.quantity), 50, cursorY);
      drawText(line.unitPrice.toFixed(2), 100, cursorY);
      drawText(line.totalPrice.toFixed(2), 160, cursorY);
      drawText(line.commission.toFixed(2), 220, cursorY);
      drawText(line.supplierRevenue.toFixed(2), 310, cursorY);
      cursorY -= 14;
    });

    cursorY -= 10;
    drawText(`Subtotal: ${invoice.subtotal.toFixed(2)}`, 50, cursorY);
    cursorY -= 14;
    drawText(`Commission: ${invoice.commission.toFixed(2)}`, 50, cursorY);
    cursorY -= 14;
    drawText(`Total: ${invoice.totalAmount.toFixed(2)}`, 50, cursorY);

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
