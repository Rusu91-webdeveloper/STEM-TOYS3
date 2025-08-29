import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendTicketStatusNotification } from "@/lib/admin-notifications";

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

    // Get internal notes that indicate status changes
    const statusHistory = await db.supplierTicketResponse.findMany({
      where: {
        ticketId: params.id,
        isInternal: true,
        content: {
          contains: "Status changed",
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        responder: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
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

    const body = await request.json();
    const { status, note } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Verify the ticket exists and get current status
    const ticket = await db.supplierSupportTicket.findUnique({
      where: { id: params.id },
      include: {
        supplier: {
          select: {
            companyName: true,
            contactPersonName: true,
            contactPersonEmail: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    const oldStatus = ticket.status;
    const updateData: any = {
      status: status as any,
      updatedAt: new Date(),
    };

    // Set closedAt if status is CLOSED
    if (status === "CLOSED") {
      updateData.closedAt = new Date();
    } else if (oldStatus === "CLOSED" && status !== "CLOSED") {
      // Clear closedAt if reopening a closed ticket
      updateData.closedAt = null;
    }

    // Update ticket status
    await db.supplierSupportTicket.update({
      where: { id: params.id },
      data: updateData,
    });

    // Create an internal note about the status change
    const statusNote = `Status changed from ${oldStatus} to ${status}${
      note ? ` - ${note}` : ""
    }`;

    await db.supplierTicketResponse.create({
      data: {
        ticketId: params.id,
        responderId: session.user.id,
        responderType: "ADMIN",
        content: statusNote,
        isInternal: true,
      },
    });

    // Send notification about status change
    try {
      await sendTicketStatusNotification({
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        oldStatus,
        newStatus: status,
        updatedBy: session.user.name || "Admin",
        updatedByEmail: session.user.email,
        note,
      });
    } catch (error) {
      console.error("Failed to send status notification:", error);
      // Don't fail the status update if notification fails
    }

    return NextResponse.json({
      success: true,
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
