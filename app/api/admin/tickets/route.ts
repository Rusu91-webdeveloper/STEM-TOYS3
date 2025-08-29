import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - List all supplier support tickets for admin
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";
    const category = searchParams.get("category") || "";
    const supplierId = searchParams.get("supplierId") || "";
    const assignedTo = searchParams.get("assignedTo") || "";
    const search = searchParams.get("search") || "";

    // Build where clause for filtering
    const where: any = {};

    if (status && status !== "all") {
      where.status = status;
    }
    if (priority && priority !== "all") {
      where.priority = priority;
    }
    if (category && category !== "all") {
      where.category = category;
    }
    if (supplierId) {
      where.supplierId = supplierId;
    }
    if (assignedTo) {
      if (assignedTo === "unassigned") {
        where.assignedTo = null;
      } else {
        where.assignedTo = assignedTo;
      }
    }
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { ticketNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [tickets, total] = await Promise.all([
      db.supplierSupportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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
              responderType: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 1, // Get latest response
          },
        },
      }),
      db.supplierSupportTicket.count({ where }),
    ]);

    // Calculate response statistics
    const stats = await db.supplierSupportTicket.groupBy({
      by: ["status"],
      where,
      _count: {
        status: true,
      },
    });

    const statusStats = stats.reduce(
      (acc, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total,
        byStatus: statusStats,
      },
    });
  } catch (error) {
    console.error("Error fetching admin tickets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
