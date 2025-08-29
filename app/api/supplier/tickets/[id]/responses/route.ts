import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const ticket = await db.supplierSupportTicket.findFirst({
      where: { id: params.id, supplierId: supplier.id },
      select: { id: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const body = await request.json();
    const { content } = body;
    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const response = await db.supplierTicketResponse.create({
      data: {
        ticketId: params.id,
        responderId: session.user.id,
        responderType: "SUPPLIER",
        content,
      },
      include: {
        responder: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error("Error adding ticket response:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
