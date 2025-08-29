import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Get individual ticket details for admin
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

    const ticket = await db.supplierSupportTicket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        description: true,
        status: true,
        priority: true,
        category: true,
        assignedTo: true,
        attachments: true,
        createdAt: true,
        updatedAt: true,
        closedAt: true,
        supplier: {
          select: {
            id: true,
            companyName: true,
            contactPersonName: true,
            contactPersonEmail: true,
            phone: true,
            website: true,
          },
        },
        assignedAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        responses: {
          select: {
            id: true,
            content: true,
            responderType: true,
            isInternal: true,
            attachments: true,
            createdAt: true,
            updatedAt: true,
            responder: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Error fetching ticket details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update ticket details (status, priority, assignment)
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
    const { status, priority, assignedTo } = body;

    if (!ticketId) {
      return NextResponse.json(
        { error: "Ticket ID is required" },
        { status: 400 }
      );
    }

    // Check if ticket exists
    const existingTicket = await db.supplierSupportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, status: true },
    });

    if (!existingTicket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    if (status) {
      updateData.status = status;
      // Set closedAt if status is CLOSED or RESOLVED
      if (status === "CLOSED" || status === "RESOLVED") {
        updateData.closedAt = new Date();
      } else if (
        existingTicket.status === "CLOSED" ||
        existingTicket.status === "RESOLVED"
      ) {
        // Clear closedAt if reopening
        updateData.closedAt = null;
      }
    }

    if (priority) {
      updateData.priority = priority;
    }

    if (assignedTo !== undefined) {
      updateData.assignedTo = assignedTo || null;
    }

    updateData.updatedAt = new Date();

    const updatedTicket = await db.supplierSupportTicket.update({
      where: { id: ticketId },
      data: updateData,
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        status: true,
        priority: true,
        assignedTo: true,
        updatedAt: true,
        assignedAdmin: {
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
      ticket: updatedTicket,
      message: "Ticket updated successfully",
    });
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
