import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// PUT - Update ticket status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const ticketId = params.id;
    const body = await request.json();
    const { status, note } = body;

    if (!ticketId) {
      return NextResponse.json(
        { error: "Ticket ID is required" },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = [
      "OPEN",
      "PENDING_CUSTOMER",
      "PENDING_SUPPLIER",
      "RESOLVED",
      "CLOSED",
      "REOPENED",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Check if ticket exists
    const existingTicket = await db.supplierSupportTicket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        status: true,
        closedAt: true,
      },
    });

    if (!existingTicket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    // Handle closedAt timestamp based on status
    if (status === "CLOSED" || status === "RESOLVED") {
      updateData.closedAt = new Date();
    } else if (
      existingTicket.status === "CLOSED" ||
      existingTicket.status === "RESOLVED"
    ) {
      // Clear closedAt if reopening
      updateData.closedAt = null;
    }

    // Update the ticket
    const updatedTicket = await db.supplierSupportTicket.update({
      where: { id: ticketId },
      data: updateData,
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        status: true,
        closedAt: true,
        updatedAt: true,
      },
    });

    // Create an internal note about the status change
    const statusNote = `Status changed from ${existingTicket.status} to ${status}${
      note ? ` - ${note}` : ""
    } by ${session.user.name || session.user.email}`;

    await db.supplierTicketResponse.create({
      data: {
        ticketId,
        responderId: session.user.id,
        responderType: "ADMIN",
        content: statusNote,
        isInternal: true,
        attachments: [],
      },
    });

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
      message: "Ticket status updated successfully",
    });
  } catch (error) {
    console.error("Error updating ticket status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get ticket status history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const ticketId = params.id;

    if (!ticketId) {
      return NextResponse.json(
        { error: "Ticket ID is required" },
        { status: 400 }
      );
    }

    // Check if ticket exists
    const ticket = await db.supplierSupportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Get status change history (internal notes about status changes)
    const statusHistory = await db.supplierTicketResponse.findMany({
      where: {
        ticketId,
        isInternal: true,
        content: {
          contains: "Status changed",
        },
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        responder: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ statusHistory });
  } catch (error) {
    console.error("Error fetching ticket status history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
