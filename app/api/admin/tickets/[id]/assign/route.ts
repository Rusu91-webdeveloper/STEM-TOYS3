import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST - Assign ticket to admin
export async function POST(
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
    const { assignedTo } = body;

    if (!ticketId) {
      return NextResponse.json(
        { error: "Ticket ID is required" },
        { status: 400 }
      );
    }

    // Check if ticket exists
    const ticket = await db.supplierSupportTicket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        assignedTo: true,
        assignedAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // If assignedTo is provided, verify the admin exists
    if (assignedTo) {
      const admin = await db.user.findUnique({
        where: {
          id: assignedTo,
          role: "ADMIN",
        },
        select: { id: true, name: true, email: true },
      });

      if (!admin) {
        return NextResponse.json(
          { error: "Invalid admin user" },
          { status: 400 }
        );
      }
    }

    // Update ticket assignment
    const updatedTicket = await db.supplierSupportTicket.update({
      where: { id: ticketId },
      data: {
        assignedTo: assignedTo || null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
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

    // Create an internal note about the assignment change
    const assignmentNote = `Ticket ${assignedTo ? "assigned to" : "unassigned from"} ${
      assignedTo ? updatedTicket.assignedAdmin?.name || "admin" : "any admin"
    } by ${session.user.name || session.user.email}`;

    await db.supplierTicketResponse.create({
      data: {
        ticketId,
        responderId: session.user.id,
        responderType: "ADMIN",
        content: assignmentNote,
        isInternal: true,
        attachments: [],
      },
    });

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
      message: assignedTo
        ? "Ticket assigned successfully"
        : "Ticket unassigned successfully",
    });
  } catch (error) {
    console.error("Error assigning ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get available admins for assignment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get all admin users
    const admins = await db.user.findMany({
      where: { role: "ADMIN" },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ admins });
  } catch (error) {
    console.error("Error fetching admins:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
