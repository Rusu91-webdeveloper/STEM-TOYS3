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

    const body = await request.json().catch(() => ({}));
    const method = body?.method as string | undefined;
    const notes = (body?.notes as string | undefined) || undefined;
    if (!method) {
      return NextResponse.json(
        { error: "Missing payment method" },
        { status: 400 }
      );
    }

    const updated = await db.supplierInvoice.updateMany({
      where: { id, supplierId: supplier.id },
      data: { paymentMethod: method, notes },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording invoice payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
