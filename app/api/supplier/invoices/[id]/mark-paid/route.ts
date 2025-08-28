import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
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
      select: { id: true },
    });
    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const updated = await db.supplierInvoice.updateMany({
      where: {
        id,
        supplierId: supplier.id,
        status: { in: ["SENT", "OVERDUE"] },
      },
      data: { status: "PAID", paidAt: now },
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { error: "Invoice not found or not payable" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, paidAt: now.toISOString() });
  } catch (error) {
    console.error("Error marking invoice paid:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
